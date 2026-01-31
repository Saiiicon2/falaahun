import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Contact } from '../types'

// In-memory store as fallback when database is unavailable
const mockContacts: any[] = []

export const contactModel = {
  async getAll(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT * FROM contacts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      )
      return result.rows
    } catch (error) {
      console.log('📝 Using mock contact data (database unavailable)')
      return mockContacts.slice(offset, offset + limit)
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM contacts WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockContacts.find(c => c.id === id)
    }
  },

  async create(data: Partial<Contact> & { leadStatus?: string; assignedTo?: string; project?: string }) {
    const id = uuidv4()
    const contact = {
      id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      organization_id: data.company,
      project_id: data.project,
      lead_status: data.leadStatus || 'lead',
      assigned_to: data.assignedTo,
      labels: data.labels || [],
      custom_fields: data.customFields || {},
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO contacts (id, first_name, last_name, email, phone, organization_id, project_id, lead_status, assigned_to, labels, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.company,
          data.project,
          data.leadStatus || 'lead',
          data.assignedTo,
          data.labels || [],
          JSON.stringify(data.customFields || {})
        ]
      )
      return result.rows[0]
    } catch (error) {
      console.log('📝 Storing contact in mock storage')
      mockContacts.push(contact)
      return contact
    }
  },

  async update(id: string, data: Partial<Contact>) {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.firstName) {
      updates.push(`first_name = $${paramCount++}`)
      values.push(data.firstName)
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramCount++}`)
      values.push(data.lastName)
    }
    if (data.email) {
      updates.push(`email = $${paramCount++}`)
      values.push(data.email)
    }
    if (data.phone) {
      updates.push(`phone = $${paramCount++}`)
      values.push(data.phone)
    }
    if (data.labels) {
      updates.push(`labels = $${paramCount++}`)
      values.push(data.labels)
    }
    if (data.customFields) {
      updates.push(`custom_fields = $${paramCount++}`)
      values.push(JSON.stringify(data.customFields))
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    try {
      const result = await pool.query(
        `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const contact = mockContacts.find(c => c.id === id)
      if (contact) {
        Object.assign(contact, data)
        contact.updated_at = new Date()
      }
      return contact
    }
  },

  async delete(id: string) {
    try {
      await pool.query('DELETE FROM contacts WHERE id = $1', [id])
    } catch (error) {
      const index = mockContacts.findIndex(c => c.id === id)
      if (index > -1) {
        mockContacts.splice(index, 1)
      }
    }
  },

  async search(query: string) {
    const searchTerm = `%${query}%`
    try {
      const result = await pool.query(
        `SELECT * FROM contacts WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`,
        [searchTerm]
      )
      return result.rows
    } catch (error) {
      return mockContacts.filter(c =>
        c.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.toLowerCase().includes(query.toLowerCase())
      )
    }
  }
}
