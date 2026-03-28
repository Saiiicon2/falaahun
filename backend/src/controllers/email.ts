import { Request, Response } from 'express'
import { emailModel } from '../models/email'

export const getContactEmails = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { contactId } = req.params
    const { limit = 50 } = req.query

    const emails = await emailModel.getByContact(contactId, req.user.organizationId, parseInt(limit as string))

    res.json({ success: true, data: emails })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const sendEmail = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { contactId } = req.params
    const { toEmail, subject, body, fromEmail } = req.body

    if (!toEmail || !subject || !body || !fromEmail) {
      return res.status(400).json({
        success: false,
        error: 'toEmail, subject, body, and fromEmail are required'
      })
    }

    const email = await emailModel.create({
      contactId,
      fromEmail,
      toEmail,
      subject,
      body,
      sentBy: req.user.id,
      tenantOrganizationId: req.user.organizationId
    })

    res.status(201).json({
      success: true,
      data: email,
      message: 'Email logged and would be sent via email service'
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getEmailStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const stats = await emailModel.getStats(req.user.organizationId)
    res.json({ success: true, data: stats })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const markEmailAsOpened = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { id } = req.params

    const email = await emailModel.markAsOpened(id, req.user.organizationId)

    res.json({ success: true, data: email })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
