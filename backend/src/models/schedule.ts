import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

// Mock storage
const mockSchedules: any[] = []

export const scheduleModel = {
  async getByContact(contactId: string) {
    try {
      const result = await pool.query(
        `SELECT s.*, u.name as assigned_to_name, c.name as created_by_name
         FROM schedules s
         LEFT JOIN users u ON s.assigned_to = u.id
         LEFT JOIN users c ON s.created_by = c.id
         WHERE s.contact_id = $1
         ORDER BY s.start_time ASC`,
        [contactId]
      )
      return result.rows
    } catch (error) {
      return mockSchedules
        .filter(s => s.contact_id === contactId)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }
  },

  async getUpcoming(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT s.*, u.name as assigned_to_name, con.first_name, con.last_name
         FROM schedules s
         LEFT JOIN users u ON s.assigned_to = u.id
         LEFT JOIN contacts con ON s.contact_id = con.id
         WHERE s.start_time >= CURRENT_TIMESTAMP AND s.status = 'scheduled'
         ORDER BY s.start_time ASC
         LIMIT $1`,
        [limit]
      )
      return result.rows
    } catch (error) {
      return mockSchedules
        .filter(s => new Date(s.start_time) >= new Date() && s.status === 'scheduled')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, limit)
    }
  },

  async create(data: {
    contactId?: string
    projectId?: string
    title: string
    description?: string
    eventType: string
    startTime: Date
    endTime?: Date
    location?: string
    attendees?: string[]
    assignedTo: string
    createdBy: string
  }) {
    const id = uuidv4()
    const schedule = {
      id,
      contact_id: data.contactId,
      project_id: data.projectId,
      title: data.title,
      description: data.description,
      event_type: data.eventType,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location,
      attendees: data.attendees || [],
      assigned_to: data.assignedTo,
      status: 'scheduled',
      created_by: data.createdBy,
      created_at: new Date(),
      updated_at: new Date()
    }

    try {
      const result = await pool.query(
        `INSERT INTO schedules (id, contact_id, project_id, title, description, event_type, start_time, end_time, location, attendees, assigned_to, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          id,
          data.contactId,
          data.projectId,
          data.title,
          data.description,
          data.eventType,
          data.startTime,
          data.endTime,
          data.location,
          data.attendees,
          data.assignedTo,
          data.createdBy
        ]
      )
      return result.rows[0]
    } catch (error) {
      mockSchedules.push(schedule)
      return schedule
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        `SELECT s.*, u.name as assigned_to_name, c.name as created_by_name
         FROM schedules s
         LEFT JOIN users u ON s.assigned_to = u.id
         LEFT JOIN users c ON s.created_by = c.id
         WHERE s.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockSchedules.find(s => s.id === id)
    }
  },

  async update(id: string, data: Partial<any>) {
    try {
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (data.status) {
        updates.push(`status = $${paramCount++}`)
        values.push(data.status)
      }
      if (data.title) {
        updates.push(`title = $${paramCount++}`)
        values.push(data.title)
      }
      if (data.description) {
        updates.push(`description = $${paramCount++}`)
        values.push(data.description)
      }
      if (data.startTime) {
        updates.push(`start_time = $${paramCount++}`)
        values.push(data.startTime)
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const result = await pool.query(
        `UPDATE schedules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const schedule = mockSchedules.find(s => s.id === id)
      if (schedule) {
        Object.assign(schedule, data)
        schedule.updated_at = new Date()
      }
      return schedule
    }
  },

  async cancel(id: string) {
    return this.update(id, { status: 'cancelled' })
  }
}
