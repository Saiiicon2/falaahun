import { Request, Response } from 'express'
import { contactModel } from '../models/contact'

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const contacts = await contactModel.getAll(Number(limit), Number(offset))
    res.json({ success: true, data: contacts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getContact = async (req: Request, res: Response) => {
  try {
    const contact = await contactModel.getById(req.params.id)
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
      customFields
    })

    res.status(201).json({ success: true, data: contact })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateContact = async (req: Request, res: Response) => {
  try {
    const contact = await contactModel.update(req.params.id, req.body)
    res.json({ success: true, data: contact })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteContact = async (req: Request, res: Response) => {
  try {
    await contactModel.delete(req.params.id)
    res.json({ success: true, message: 'Contact deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const searchContacts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' })
    }
    const contacts = await contactModel.search(String(q))
    res.json({ success: true, data: contacts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
