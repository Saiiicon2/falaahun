import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

// Mock storage
const mockCallLogs: any[] = []

export const callLogModel = {
  async getByContact(contactId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT c.*, u.name as logged_by_name
         FROM call_logs c
         LEFT JOIN users u ON c.logged_by = u.id
         WHERE c.contact_id = $1
         ORDER BY c.call_date DESC
         LIMIT $2`,
        [contactId, limit]
      )
      return result.rows
    } catch (error) {
      return mockCallLogs
        .filter(c => c.contact_id === contactId)
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
        .slice(0, limit)
    }
  },

  async create(data: {
    contactId: string
    duration: number
    direction: 'inbound' | 'outbound'
    status: string
    notes: string
    callDate: Date
    loggedBy: string
  }) {
    const id = uuidv4()
    const callLog = {
      id,
      contact_id: data.contactId,
      duration: data.duration,
      direction: data.direction,
      status: data.status,
      notes: data.notes,
      call_date: data.callDate,
      logged_by: data.loggedBy,
      logged_by_name: 'User',
      recording_url: null,
      created_at: new Date(),
      updated_at: new Date()
    }

    try {
      await pool.query(
        `INSERT INTO call_logs (id, contact_id, duration, direction, status, notes, call_date, logged_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          data.contactId,
          data.duration,
          data.direction,
          data.status,
          data.notes,
          data.callDate,
          data.loggedBy
        ]
      )
      // Fetch the created record with logged_by_name
      const result = await pool.query(
        `SELECT c.*, u.name as logged_by_name
         FROM call_logs c
         LEFT JOIN users u ON c.logged_by = u.id
         WHERE c.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      mockCallLogs.push(callLog)
      return callLog
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        `SELECT c.*, u.name as logged_by_name
         FROM call_logs c
         LEFT JOIN users u ON c.logged_by = u.id
         WHERE c.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockCallLogs.find(c => c.id === id)
    }
  },

  async update(id: string, data: Partial<any>) {
    try {
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (data.notes) {
        updates.push(`notes = $${paramCount++}`)
        values.push(data.notes)
      }
      if (data.status) {
        updates.push(`status = $${paramCount++}`)
        values.push(data.status)
      }
      if (data.duration) {
        updates.push(`duration = $${paramCount++}`)
        values.push(data.duration)
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const result = await pool.query(
        `UPDATE call_logs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const log = mockCallLogs.find(c => c.id === id)
      if (log) {
        Object.assign(log, data)
        log.updated_at = new Date()
      }
      return log
    }
  }
}
