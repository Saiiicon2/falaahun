import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Activity } from '../types'

// In-memory store
const mockActivities: any[] = []

export const activityModel = {
  async getByContact(contactId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM activities WHERE contact_id = $1 ORDER BY date DESC LIMIT $2`,
        [contactId, limit]
      )
      return result.rows
    } catch (error) {
      return mockActivities.filter(a => a.contact_id === contactId).slice(0, limit)
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM activities WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockActivities.find(a => a.id === id)
    }
  },

  async create(data: Partial<Activity> & { contactId: string; createdBy?: string }) {
    const id = uuidv4()
    const activity = {
      id,
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
        `INSERT INTO activities (id, contact_id, type, title, description, date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
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

  async update(id: string, data: Partial<Activity>) {
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
      const result = await pool.query(
        `UPDATE activities SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
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

  async delete(id: string) {
    try {
      await pool.query('DELETE FROM activities WHERE id = $1', [id])
    } catch (error) {
      const index = mockActivities.findIndex(a => a.id === id)
      if (index > -1) {
        mockActivities.splice(index, 1)
      }
    }
  },

  async getRecentActivities(limit = 20) {
    try {
      const result = await pool.query(
        `SELECT a.*, c.first_name, c.last_name FROM activities a
         JOIN contacts c ON a.contact_id = c.id
         ORDER BY a.created_at DESC LIMIT $1`,
        [limit]
      )
      return result.rows
    } catch (error) {
      return mockActivities.slice(0, limit)
    }
  },

  async getActivityStats() {
    try {
      const result = await pool.query(
        `SELECT type, COUNT(*) as count FROM activities GROUP BY type`
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
