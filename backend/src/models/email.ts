import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

// Mock storage
const mockEmails: any[] = []

export const emailModel = {
  async getByContact(contactId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM email_logs 
         WHERE contact_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [contactId, limit]
      )
      return result.rows
    } catch (error) {
      return mockEmails
        .filter(e => e.contact_id === contactId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    }
  },

  async create(data: {
    contactId: string
    fromEmail: string
    toEmail: string
    subject: string
    body: string
    sentBy: string
  }) {
    const id = uuidv4()
    const email = {
      id,
      contact_id: data.contactId,
      from_email: data.fromEmail,
      to_email: data.toEmail,
      subject: data.subject,
      body: data.body,
      status: 'sent',
      opened: false,
      opened_at: null,
      sent_by: data.sentBy,
      external_id: null,
      created_at: new Date()
    }

    try {
      const result = await pool.query(
        `INSERT INTO email_logs (id, contact_id, from_email, to_email, subject, body, sent_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          data.contactId,
          data.fromEmail,
          data.toEmail,
          data.subject,
          data.body,
          data.sentBy
        ]
      )
      return result.rows[0]
    } catch (error) {
      mockEmails.push(email)
      return email
    }
  },

  async markAsOpened(id: string) {
    try {
      const result = await pool.query(
        `UPDATE email_logs 
         SET opened = true, opened_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      const email = mockEmails.find(e => e.id === id)
      if (email) {
        email.opened = true
        email.opened_at = new Date()
      }
      return email
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM email_logs WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockEmails.find(e => e.id === id)
    }
  },

  async getStats() {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN opened = true THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM email_logs`
      )
      return result.rows[0]
    } catch (error) {
      return {
        total: mockEmails.length,
        sent: mockEmails.filter(e => e.status === 'sent').length,
        opened: mockEmails.filter(e => e.opened).length,
        failed: mockEmails.filter(e => e.status === 'failed').length
      }
    }
  }
}
