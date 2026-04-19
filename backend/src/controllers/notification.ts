import { Request, Response } from 'express'
import { notificationModel } from '../models/notification'

export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const notifications = await notificationModel.getByOrganization(req.user.organizationId)
    res.json({ success: true, data: notifications })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { id } = req.params
    const notification = await notificationModel.markAsRead(id, req.user.organizationId)

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }

    res.json({ success: true, data: notification })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
