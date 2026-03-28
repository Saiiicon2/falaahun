import { Request, Response } from 'express'
import { pledgeModel } from '../models/pledge'
import { dealModel, projectModel } from '../models/project'
import { contactModel } from '../models/contact'

const getProjectIdFromContext = async (tenantOrganizationId: string, contactId?: string, dealId?: string) => {
  if (dealId) {
    const deal = await dealModel.getById(dealId, tenantOrganizationId)
    return deal?.project_id as string | undefined
  }

  if (contactId) {
    const contact = await contactModel.getById(contactId, tenantOrganizationId)
    return contact?.project_id as string | undefined
  }

  return undefined
}

const recalculateProjectIfNeeded = async (tenantOrganizationId: string, projectId?: string) => {
  if (!projectId) {
    return
  }

  await projectModel.recalculateRaised(projectId, tenantOrganizationId)
}

export const getPledges = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { limit = 50, offset = 0, contactId, projectId, dealId } = req.query

    const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50
    const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0

    if (typeof contactId === 'string' && contactId.length > 0) {
      const pledges = await pledgeModel.getByContact(contactId, req.user.organizationId, parsedLimit)
      return res.json({ success: true, data: pledges })
    }

    if (typeof dealId === 'string' && dealId.length > 0) {
      const pledges = await pledgeModel.getByDeal(dealId, req.user.organizationId, parsedLimit)
      return res.json({ success: true, data: pledges })
    }

    if (typeof projectId === 'string' && projectId.length > 0) {
      const pledges = await pledgeModel.getByProject(projectId, req.user.organizationId, parsedLimit, parsedOffset)
      return res.json({ success: true, data: pledges })
    }

    const pledges = await pledgeModel.getAll(req.user.organizationId, parsedLimit, parsedOffset)
    return res.json({ success: true, data: pledges })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const getPledge = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const pledge = await pledgeModel.getById(req.params.id, req.user.organizationId)

    if (!pledge) {
      return res.status(404).json({ success: false, error: 'Pledge not found' })
    }

    return res.json({ success: true, data: pledge })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const createPledge = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const {
      contactId,
      dealId,
      amount,
      currency,
      type,
      status,
      paymentMethod,
      transactionId,
      expectedDate,
      receivedDate,
      notes,
    } = req.body

    if (!contactId) {
      return res.status(400).json({ success: false, error: 'contactId is required' })
    }

    if (amount === undefined || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be greater than 0' })
    }

    const pledge = await pledgeModel.create({
      id: '',
      tenant_organization_id: req.user.organizationId,
      contact_id: contactId,
      deal_id: dealId,
      amount: Number(amount),
      currency,
      type: type || 'donation',
      status: status || 'pending',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      expected_date: expectedDate ? new Date(expectedDate) : undefined,
      received_date: receivedDate ? new Date(receivedDate) : undefined,
      notes,
      logged_by: req.user?.id,
    })

    const projectId = await getProjectIdFromContext(req.user.organizationId, contactId, dealId)
    await recalculateProjectIfNeeded(req.user.organizationId, projectId)

    return res.status(201).json({ success: true, data: pledge })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const updatePledge = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const currentPledge = await pledgeModel.getById(req.params.id, req.user.organizationId)

    if (!currentPledge) {
      return res.status(404).json({ success: false, error: 'Pledge not found' })
    }

    const updateData: any = {}

    if (req.body.amount !== undefined) {
      if (Number.isNaN(Number(req.body.amount)) || Number(req.body.amount) <= 0) {
        return res.status(400).json({ success: false, error: 'amount must be greater than 0' })
      }
      updateData.amount = Number(req.body.amount)
    }

    if (req.body.currency !== undefined) updateData.currency = req.body.currency
    if (req.body.type !== undefined) updateData.type = req.body.type
    if (req.body.status !== undefined) updateData.status = req.body.status
    if (req.body.paymentMethod !== undefined) updateData.payment_method = req.body.paymentMethod
    if (req.body.transactionId !== undefined) updateData.transaction_id = req.body.transactionId
    if (req.body.notes !== undefined) updateData.notes = req.body.notes
    if (req.body.contactId !== undefined) updateData.contact_id = req.body.contactId
    if (req.body.dealId !== undefined) updateData.deal_id = req.body.dealId
    if (req.body.expectedDate !== undefined) {
      updateData.expected_date = req.body.expectedDate ? new Date(req.body.expectedDate) : null
    }
    if (req.body.receivedDate !== undefined) {
      updateData.received_date = req.body.receivedDate ? new Date(req.body.receivedDate) : null
    }

    const pledge = await pledgeModel.update(req.params.id, updateData, req.user.organizationId)

    const oldProjectId = await getProjectIdFromContext(req.user.organizationId, currentPledge.contact_id, currentPledge.deal_id)
    const newProjectId = await getProjectIdFromContext(
      req.user.organizationId,
      (updateData.contact_id as string | undefined) || currentPledge.contact_id,
      (updateData.deal_id as string | undefined) || currentPledge.deal_id
    )

    await recalculateProjectIfNeeded(req.user.organizationId, oldProjectId)
    if (newProjectId && newProjectId !== oldProjectId) {
      await recalculateProjectIfNeeded(req.user.organizationId, newProjectId)
    }

    return res.json({ success: true, data: pledge })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const deletePledge = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const currentPledge = await pledgeModel.getById(req.params.id, req.user.organizationId)

    if (!currentPledge) {
      return res.status(404).json({ success: false, error: 'Pledge not found' })
    }

    const result = await pledgeModel.delete(req.params.id, req.user.organizationId)

    if (!result.success) {
      return res.status(404).json({ success: false, error: 'Pledge not found' })
    }

    const projectId = await getProjectIdFromContext(req.user.organizationId, currentPledge.contact_id, currentPledge.deal_id)
    await recalculateProjectIfNeeded(req.user.organizationId, projectId)

    return res.json({ success: true, message: 'Pledge deleted' })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const getPledgeStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { projectId } = req.query

    const stats = await pledgeModel.getStats(
      req.user.organizationId,
      typeof projectId === 'string' && projectId.length > 0 ? projectId : undefined
    )

    return res.json({ success: true, data: stats })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
