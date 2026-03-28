import { Request, Response } from 'express'
import { scheduleModel } from '../models/schedule'

export const getContactSchedules = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { contactId } = req.params

    const schedules = await scheduleModel.getByContact(contactId, req.user.organizationId)

    res.json({ success: true, data: schedules })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getUpcomingSchedules = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { limit = 20 } = req.query

    const schedules = await scheduleModel.getUpcoming(req.user.organizationId, parseInt(limit as string))

    res.json({ success: true, data: schedules })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { contactId } = req.params
    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      location,
      attendees,
      assignedTo,
      projectId
    } = req.body

    if (!title || !eventType || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'title, eventType, and startTime are required'
      })
    }

    const schedule = await scheduleModel.create({
      contactId,
      projectId: projectId || null,
      title,
      description: description || '',
      eventType,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : new Date(startTime),
      location: location || '',
      attendees: attendees || [],
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      tenantOrganizationId: req.user.organizationId
    })

    res.status(201).json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { id } = req.params
    const { status, title, description, startTime } = req.body

    const updateData: any = {}
    if (status) updateData.status = status
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (startTime) updateData.startTime = new Date(startTime)

    const schedule = await scheduleModel.update(id, updateData, req.user.organizationId)

    res.json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const cancelSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { id } = req.params

    const schedule = await scheduleModel.cancel(id, req.user.organizationId)

    res.json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }
    const { id } = req.params

    const schedule = await scheduleModel.getById(id, req.user.organizationId)

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' })
    }

    res.json({ success: true, data: schedule })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
