import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Contact } from '../types'

// In-memory store as fallback when database is unavailable
const mockContacts: any[] = []

const isUuid = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export const contactModel = {
  async getAll(limit = 50, offset = 0) {
    try {
      console.log('🔍 Fetching contacts from database...')
      const result = await pool.query(
        'SELECT * FROM contacts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      )
      console.log(`✅ Found ${result.rows.length} contacts in database`)
      return result.rows
    } catch (error: any) {
      console.error('❌ Database query failed:', error.message)
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

    const organizationId = isUuid(data.company) ? data.company : null
    const projectId = isUuid(data.project) ? data.project : null
    const assignedTo = isUuid(data.assignedTo) ? data.assignedTo : null

    const contact = {
      id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      organization_id: organizationId,
      project_id: projectId,
      lead_status: data.leadStatus || 'lead',
      assigned_to: assignedTo,
      labels: data.labels || [],
      custom_fields: data.customFields || {},
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      console.log('💾 Inserting contact into database...', contact)
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
          organizationId,
          projectId,
          data.leadStatus || 'lead',
          assignedTo,
          data.labels || [],
          JSON.stringify(data.customFields || {})
        ]
      )
      console.log('✅ Contact inserted successfully:', result.rows[0])
      return result.rows[0]
    } catch (error: any) {
      console.error('❌ Failed to insert contact:', error.message)

      // In production, failing inserts should surface so we don't “pretend” data was saved.
      if (process.env.NODE_ENV === 'production') {
        throw error
      }

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
