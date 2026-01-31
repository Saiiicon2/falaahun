/**
 * Pledge Model
 * Handles all database operations for pledges and donations
 */

import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

interface Pledge {
  id: string
  contact_id: string
  amount: number
  currency?: string
  type: string // 'pledge', 'donation', 'zakat', 'sadaqah'
  status: string // 'pending', 'received', 'failed'
  payment_method?: string // 'cash', 'bank_transfer', 'stripe', 'paypal'
  expected_date?: Date
  received_date?: Date
  notes?: string
  transaction_id?: string
  logged_by?: string
  hubspot_deal_id?: string
  hubspot_sync_status?: string
  hubspot_last_synced?: Date
  created_at?: Date
  updated_at?: Date
}

const mockPledges: Pledge[] = []

export const pledgeModel = {
  async getByContact(contactId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         WHERE p.contact_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [contactId, limit]
      )
      return result.rows
    } catch (error) {
      return mockPledges.filter((p) => p.contact_id === contactId).slice(0, limit)
    }
  },

  async getAll(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      return result.rows
    } catch (error) {
      return mockPledges.slice(offset, offset + limit)
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         WHERE p.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockPledges.find((p) => p.id === id)
    }
  },

  async create(pledge: Pledge) {
    const id = uuidv4()
    const now = new Date()

    try {
      const result = await pool.query(
        `INSERT INTO pledges (
          id, contact_id, amount, currency, type, status,
          payment_method, expected_date, notes, logged_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          id,
          pledge.contact_id,
          pledge.amount,
          pledge.currency || 'USD',
          pledge.type || 'donation',
          pledge.status || 'pending',
          pledge.payment_method,
          pledge.expected_date,
          pledge.notes,
          pledge.logged_by,
          now,
          now,
        ]
      )
      return result.rows[0]
    } catch (error) {
      const newPledge = {
        id: id,
        contact_id: pledge.contact_id,
        amount: pledge.amount,
        currency: pledge.currency || 'USD',
        type: pledge.type || 'donation',
        status: pledge.status || 'pending',
        payment_method: pledge.payment_method,
        transaction_id: pledge.transaction_id,
        expected_date: pledge.expected_date,
        received_date: pledge.received_date,
        notes: pledge.notes,
        logged_by: pledge.logged_by,
        created_at: now,
        updated_at: now,
      }
      mockPledges.push(newPledge)
      return newPledge
    }
  },

  async update(id: string, data: Partial<Pledge>) {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`)
        values.push(value)
      }
    })

    updates.push(`updated_at = $${paramCount++}`)
    values.push(new Date())
    values.push(id)

    try {
      const result = await pool.query(
        `UPDATE pledges SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const pledgeIndex = mockPledges.findIndex((p) => p.id === id)
      if (pledgeIndex > -1) {
        mockPledges[pledgeIndex] = {
          ...mockPledges[pledgeIndex],
          ...data,
          updated_at: new Date(),
        }
        return mockPledges[pledgeIndex]
      }
      return null
    }
  },

  async delete(id: string) {
    try {
      await pool.query(`DELETE FROM pledges WHERE id = $1`, [id])
      return { success: true }
    } catch (error) {
      const index = mockPledges.findIndex((p) => p.id === id)
      if (index > -1) {
        mockPledges.splice(index, 1)
        return { success: true }
      }
      return { success: false }
    }
  },

  async getStats() {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_pledges,
          SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as total_received,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
          AVG(amount) as average_amount
         FROM pledges`
      )
      return result.rows[0]
    } catch (error) {
      const totalReceived = mockPledges
        .filter((p) => p.status === 'received')
        .reduce((sum, p) => sum + p.amount, 0)

      const totalPending = mockPledges
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)

      return {
        total_pledges: mockPledges.length,
        total_received: totalReceived,
        total_pending: totalPending,
        average_amount:
          mockPledges.length > 0
            ? mockPledges.reduce((sum, p) => sum + p.amount, 0) / mockPledges.length
            : 0,
      }
    }
  },
}
