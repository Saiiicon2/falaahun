import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Contact } from '../types'

// In-memory store as fallback when database is unavailable
const mockContacts: any[] = []

const isUuid = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

type ContactCreateInput = Partial<Contact> & {
  leadStatus?: string
  assignedTo?: string
  project?: string
  tenantOrganizationId?: string
}

type ContactFilterInput = {
  tenantOrganizationId: string
  leadStatus?: string | string[]
  labels?: string | string[]
  projectId?: string
  assignedTo?: string
  startDate?: Date
  endDate?: Date
  search?: string
  limit?: number
  offset?: number
}

export const contactModel = {
  async getAll(tenantOrganizationId: string, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT *
         FROM contacts
         WHERE tenant_organization_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantOrganizationId, limit, offset]
      )
      return result.rows
    } catch (error: any) {
      return mockContacts
        .filter((contact) => contact.tenant_organization_id === tenantOrganizationId)
        .slice(offset, offset + limit)
    }
  },

  async getById(id: string, tenantOrganizationId?: string) {
    try {
      const result = tenantOrganizationId
        ? await pool.query(
            'SELECT * FROM contacts WHERE id = $1 AND tenant_organization_id = $2',
            [id, tenantOrganizationId]
          )
        : await pool.query('SELECT * FROM contacts WHERE id = $1', [id])
      return result.rows[0]
    } catch (error) {
      return mockContacts.find(
        (contact) => contact.id === id && (!tenantOrganizationId || contact.tenant_organization_id === tenantOrganizationId)
      )
    }
  },

  async create(data: ContactCreateInput) {
    const id = uuidv4()
    const organizationId = isUuid(data.company) ? data.company : null
    const projectId = isUuid(data.project) ? data.project : null
    const assignedTo = isUuid(data.assignedTo) ? data.assignedTo : null

    const contact = {
      id,
      tenant_organization_id: data.tenantOrganizationId,
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
      updated_at: new Date(),
    }

    try {
      const result = await pool.query(
        `INSERT INTO contacts (
          id, tenant_organization_id, first_name, last_name, email, phone,
          organization_id, project_id, lead_status, assigned_to, labels, custom_fields
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          id,
          data.tenantOrganizationId,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          organizationId,
          projectId,
          data.leadStatus || 'lead',
          assignedTo,
          data.labels || [],
          JSON.stringify(data.customFields || {}),
        ]
      )
      return result.rows[0]
    } catch (error: any) {
      if (process.env.NODE_ENV === 'production') {
        throw error
      }

      mockContacts.push(contact)
      return contact
    }
  },

  async update(id: string, data: Partial<Contact>, tenantOrganizationId?: string) {
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

    updates.push('updated_at = CURRENT_TIMESTAMP')

    try {
      const result = tenantOrganizationId
        ? await pool.query(
            `UPDATE contacts
             SET ${updates.join(', ')}
             WHERE id = $${paramCount++} AND tenant_organization_id = $${paramCount}
             RETURNING *`,
            [...values, id, tenantOrganizationId]
          )
        : await pool.query(
            `UPDATE contacts
             SET ${updates.join(', ')}
             WHERE id = $${paramCount}
             RETURNING *`,
            [...values, id]
          )
      return result.rows[0] || null
    } catch (error) {
      const contact = mockContacts.find(
        (item) => item.id === id && (!tenantOrganizationId || item.tenant_organization_id === tenantOrganizationId)
      )
      if (contact) {
        Object.assign(contact, data)
        contact.updated_at = new Date()
      }
      return contact || null
    }
  },

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query(
        'DELETE FROM contacts WHERE id = $1 AND tenant_organization_id = $2',
        [id, tenantOrganizationId]
      )
    } catch (error) {
      const index = mockContacts.findIndex(
        (contact) => contact.id === id && contact.tenant_organization_id === tenantOrganizationId
      )
      if (index > -1) {
        mockContacts.splice(index, 1)
      }
    }
  },

  async search(query: string, tenantOrganizationId: string) {
    const searchTerm = `%${query}%`
    try {
      const result = await pool.query(
        `SELECT *
         FROM contacts
         WHERE tenant_organization_id = $1
           AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`,
        [tenantOrganizationId, searchTerm]
      )
      return result.rows
    } catch (error) {
      return mockContacts.filter(
        (contact) =>
          contact.tenant_organization_id === tenantOrganizationId &&
          (
            contact.first_name?.toLowerCase().includes(query.toLowerCase()) ||
            contact.last_name?.toLowerCase().includes(query.toLowerCase()) ||
            contact.email?.toLowerCase().includes(query.toLowerCase()) ||
            contact.phone?.toLowerCase().includes(query.toLowerCase())
          )
      )
    }
  },

  async filter(filters: ContactFilterInput) {
    const {
      tenantOrganizationId,
      leadStatus,
      labels,
      projectId,
      assignedTo,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0,
    } = filters

    const conditions: string[] = ['tenant_organization_id = $1']
    const params: any[] = [tenantOrganizationId]
    let paramCount = 2

    if (leadStatus) {
      const statuses = Array.isArray(leadStatus) ? leadStatus : [leadStatus]
      if (statuses.length > 0) {
        const placeholders = statuses.map(() => `$${paramCount++}`).join(',')
        conditions.push(`lead_status IN (${placeholders})`)
        params.push(...statuses)
      }
    }

    if (labels) {
      const labelValues = Array.isArray(labels) ? labels : [labels]
      if (labelValues.length > 0) {
        conditions.push(`labels && $${paramCount++}`)
        params.push(labelValues)
      }
    }

    if (projectId) {
      conditions.push(`project_id = $${paramCount++}`)
      params.push(projectId)
    }

    if (assignedTo) {
      conditions.push(`assigned_to = $${paramCount++}`)
      params.push(assignedTo)
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramCount++}`)
      params.push(startDate)
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramCount++}`)
      params.push(endDate)
    }

    if (search) {
      conditions.push(
        `(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`
      )
      params.push(`%${search}%`)
      paramCount++
    }

    try {
      const result = await pool.query(
        `SELECT *
         FROM contacts
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT $${paramCount++}
         OFFSET $${paramCount++}`,
        [...params, limit, offset]
      )
      return result.rows
    } catch (error: any) {
      return this._filterMockContacts(filters)
    }
  },

  _filterMockContacts(filters: ContactFilterInput) {
    const {
      tenantOrganizationId,
      leadStatus,
      labels,
      projectId,
      assignedTo,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0,
    } = filters

    let result = mockContacts.filter(
      (contact) => contact.tenant_organization_id === tenantOrganizationId
    )

    if (leadStatus) {
      const statuses = Array.isArray(leadStatus) ? leadStatus : [leadStatus]
      result = result.filter((contact) => statuses.includes(contact.lead_status))
    }

    if (labels) {
      const labelValues = Array.isArray(labels) ? labels : [labels]
      result = result.filter(
        (contact) => Array.isArray(contact.labels) && labelValues.some((label) => contact.labels.includes(label))
      )
    }

    if (projectId) {
      result = result.filter((contact) => contact.project_id === projectId)
    }

    if (assignedTo) {
      result = result.filter((contact) => contact.assigned_to === assignedTo)
    }

    if (startDate) {
      result = result.filter((contact) => new Date(contact.created_at) >= startDate)
    }

    if (endDate) {
      result = result.filter((contact) => new Date(contact.created_at) <= endDate)
    }

    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        (contact) =>
          contact.first_name?.toLowerCase().includes(query) ||
          contact.last_name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query)
      )
    }

    return result.slice(offset, offset + limit)
  },
}
