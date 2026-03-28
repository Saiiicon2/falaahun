import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Activity } from '../types'

// In-memory store
const mockActivities: any[] = []

export const activityModel = {
  async getByContact(contactId: string, tenantOrganizationId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM activities WHERE contact_id = $1 AND tenant_organization_id = $2 ORDER BY date DESC LIMIT $3`,
        [contactId, tenantOrganizationId, limit]
      )
      return result.rows
    } catch (error) {
      return mockActivities.filter(a => a.contact_id === contactId).slice(0, limit)
    }
  },

  async getById(id: string, tenantOrganizationId?: string) {
    try {
      if (tenantOrganizationId) {
        const result = await pool.query(
          'SELECT * FROM activities WHERE id = $1 AND tenant_organization_id = $2',
          [id, tenantOrganizationId]
        )
        return result.rows[0]
      }
      const result = await pool.query(
        'SELECT * FROM activities WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockActivities.find(a => a.id === id)
    }
  },

  async create(data: Partial<Activity> & { contactId: string; createdBy?: string; tenantOrganizationId: string }) {
    const id = uuidv4()
    const activity = {
      id,
      tenant_organization_id: data.tenantOrganizationId,
      contact_id: data.contactId,
      type: data.type,
      title: data.title,
      description: data.description,
      date: data.date || new Date(),
      created_by: data.createdBy,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO activities (id, tenant_organization_id, contact_id, type, title, description, date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          data.tenantOrganizationId,
          data.contactId,
          data.type,
          data.title,
          data.description,
          data.date || new Date(),
          data.createdBy
        ]
      )
      return result.rows[0]
    } catch (error) {
      mockActivities.push(activity)
      return activity
    }
  },

  async update(id: string, data: Partial<Activity>, tenantOrganizationId?: string) {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.type) {
      updates.push(`type = $${paramCount++}`)
      values.push(data.type)
    }
    if (data.title) {
      updates.push(`title = $${paramCount++}`)
      values.push(data.title)
    }
    if (data.description) {
      updates.push(`description = $${paramCount++}`)
      values.push(data.description)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    try {
      let query = `UPDATE activities SET ${updates.join(', ')} WHERE id = $${paramCount}`
      if (tenantOrganizationId) {
        query += ` AND tenant_organization_id = $${paramCount + 1}`
        values.push(tenantOrganizationId)
      }
      query += ' RETURNING *'
      const result = await pool.query(query, values)
      return result.rows[0]
    } catch (error) {
      const activity = mockActivities.find(a => a.id === id)
      if (activity) {
        Object.assign(activity, data)
        activity.updated_at = new Date()
      }
      return activity
    }
  },

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query('DELETE FROM activities WHERE id = $1 AND tenant_organization_id = $2', [id, tenantOrganizationId])
    } catch (error) {
      const index = mockActivities.findIndex(a => a.id === id)
      if (index > -1) {
        mockActivities.splice(index, 1)
      }
    }
  },

  async getRecentActivities(tenantOrganizationId: string, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT a.*, c.first_name, c.last_name FROM activities a
         JOIN contacts c ON a.contact_id = c.id
         WHERE a.tenant_organization_id = $1
         ORDER BY a.created_at DESC LIMIT $2`,
        [tenantOrganizationId, limit]
      )
      return result.rows
    } catch (error) {
      return mockActivities.slice(0, limit)
    }
  },

  async getActivityStats(tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        `SELECT type, COUNT(*) as count FROM activities WHERE tenant_organization_id = $1 GROUP BY type`,
        [tenantOrganizationId]
      )
      return result.rows
    } catch (error) {
      const stats: any = {}
      mockActivities.forEach(a => {
        stats[a.type] = (stats[a.type] || 0) + 1
      })
      return Object.entries(stats).map(([type, count]) => ({ type, count }))
    }
  }
}
