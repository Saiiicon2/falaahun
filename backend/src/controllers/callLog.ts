import { Request, Response } from 'express'
import { callLogModel } from '../models/callLog'

export const getContactCallLogs = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { limit = 50 } = req.query

    const callLogs = await callLogModel.getByContact(contactId, parseInt(limit as string))

    res.json({ success: true, data: callLogs })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const logCall = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { duration, direction, status, notes } = req.body

    if (!direction || !status) {
      return res.status(400).json({
        success: false,
        error: 'direction and status are required'
      })
    }

    const callLog = await callLogModel.create({
      contactId,
      duration: duration || 0,
      direction,
      status,
      notes: notes || '',
      callDate: new Date(),
      loggedBy: req.user!.id
    })

    res.status(201).json({ success: true, data: callLog })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateCallLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, notes, duration } = req.body

    const callLog = await callLogModel.update(id, {
      status,
      notes,
      duration
    })

    res.json({ success: true, data: callLog })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getCallLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const callLog = await callLogModel.getById(id)

    if (!callLog) {
      return res.status(404).json({ success: false, error: 'Call log not found' })
    }

    res.json({ success: true, data: callLog })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
