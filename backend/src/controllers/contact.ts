import { Request, Response } from 'express'
import { contactModel } from '../models/contact'

export const getContacts = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { 
      limit = 50, 
      offset = 0,
      leadStatus,
      labels,
      projectId,
      assignedTo,
      startDate,
      endDate,
      search
    } = req.query

    // Check if any filters are applied
    const hasFilters = leadStatus || labels || projectId || assignedTo || startDate || endDate || search

    if (hasFilters) {
      // Convert query params to proper types
      const leadStatusArray = leadStatus 
        ? (Array.isArray(leadStatus) ? (leadStatus as string[]) : [leadStatus as string])
        : undefined
      const labelsArray = labels
        ? (Array.isArray(labels) ? (labels as string[]) : [labels as string])
        : undefined

      // Use advanced filtering
      const contacts = await contactModel.filter({
        tenantOrganizationId: req.user.organizationId,
        leadStatus: leadStatusArray,
        labels: labelsArray,
        projectId: projectId as string | undefined,
        assignedTo: assignedTo as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string | undefined,
        limit: Number(limit),
        offset: Number(offset)
      })
      return res.json({ success: true, data: contacts })
    }

    // Default: get all contacts
    const contacts = await contactModel.getAll(req.user.organizationId, Number(limit), Number(offset))
    res.json({ success: true, data: contacts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getContact = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const contact = await contactModel.getById(req.params.id, req.user.organizationId)
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' })
    }
    res.json({ success: true, data: contact })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createContact = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { firstName, lastName, email, phone, company, labels, customFields } = req.body
    
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First and last name are required' })
    }

    const contact = await contactModel.create({
      firstName,
      lastName,
      email,
      phone,
      company,
      labels,
      customFields,
      tenantOrganizationId: req.user.organizationId,
    })

    res.status(201).json({ success: true, data: contact })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateContact = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const contact = await contactModel.update(req.params.id, req.body, req.user.organizationId)
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' })
    }
    res.json({ success: true, data: contact })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteContact = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    await contactModel.delete(req.params.id, req.user.organizationId)
    res.json({ success: true, message: 'Contact deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const searchContacts = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { q } = req.query
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' })
    }
    const contacts = await contactModel.search(String(q), req.user.organizationId)
    res.json({ success: true, data: contacts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
