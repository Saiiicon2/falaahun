import { Request, Response } from 'express'
import { commentModel } from '../models/comment'

export const getContactComments = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { limit = 50, offset = 0 } = req.query

    const comments = await commentModel.getByContact(
      contactId,
      parseInt(limit as string),
      parseInt(offset as string)
    )

    res.json({ success: true, data: comments })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createComment = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' })
    }

    const comment = await commentModel.create(contactId, content, req.user!.id)

    res.status(201).json({ success: true, data: comment })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await commentModel.delete(id)

    res.json({ success: true, message: 'Comment deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
