import { Request, Response } from 'express'
import { activityModel } from '../models/activity'

export const getActivitiesByContact = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const activities = await activityModel.getByContact(req.params.contactId, req.user.organizationId)
    res.json({ success: true, data: activities })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const activity = await activityModel.getById(req.params.id, req.user.organizationId)
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' })
    }
    res.json({ success: true, data: activity })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { contactId, type, title, description, date } = req.body
    
    if (!contactId || !type || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contact ID, type, and title are required' 
      })
    }

    const activity = await activityModel.create({
      contactId,
      type,
      title,
      description,
      date,
      createdBy: req.user?.id,
      tenantOrganizationId: req.user.organizationId
    })

    res.status(201).json({ success: true, data: activity })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const activity = await activityModel.update(req.params.id, req.body, req.user.organizationId)
    res.json({ success: true, data: activity })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    await activityModel.delete(req.params.id, req.user.organizationId)
    res.json({ success: true, message: 'Activity deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const activities = await activityModel.getRecentActivities(req.user.organizationId)
    res.json({ success: true, data: activities })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getActivityStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const stats = await activityModel.getActivityStats(req.user.organizationId)
    res.json({ success: true, data: stats })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
