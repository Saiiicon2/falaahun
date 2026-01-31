import { Request, Response } from 'express'
import { activityModel } from '../models/activity'

export const getActivitiesByContact = async (req: Request, res: Response) => {
  try {
    const activities = await activityModel.getByContact(req.params.contactId)
    res.json({ success: true, data: activities })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityModel.getById(req.params.id)
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
      createdBy: req.user?.id
    })

    res.status(201).json({ success: true, data: activity })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateActivity = async (req: Request, res: Response) => {
  try {
    const activity = await activityModel.update(req.params.id, req.body)
    res.json({ success: true, data: activity })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    await activityModel.delete(req.params.id)
    res.json({ success: true, message: 'Activity deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const activities = await activityModel.getRecentActivities()
    res.json({ success: true, data: activities })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const stats = await activityModel.getActivityStats()
    res.json({ success: true, data: stats })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
