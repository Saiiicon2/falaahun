/**
 * Pledge Model
 * Handles all database operations for pledges and donations
 */

import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

export interface Pledge {
  id: string
  tenant_organization_id?: string
  contact_id: string
  deal_id?: string
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
  async getByContact(contactId: string, tenantOrganizationId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         WHERE p.contact_id = $1 AND p.tenant_organization_id = $2
         ORDER BY p.created_at DESC
         LIMIT $3`,
        [contactId, tenantOrganizationId, limit]
      )
      return result.rows
    } catch (error) {
      return mockPledges.filter((p) => p.contact_id === contactId && p.tenant_organization_id === tenantOrganizationId).slice(0, limit)
    }
  },

  async getAll(tenantOrganizationId: string, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         WHERE p.tenant_organization_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantOrganizationId, limit, offset]
      )
      return result.rows
    } catch (error) {
      return mockPledges
        .filter((pledge) => pledge.tenant_organization_id === tenantOrganizationId)
        .slice(offset, offset + limit)
    }
  },

  async getByDeal(dealId: string, tenantOrganizationId: string, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         WHERE p.deal_id = $1 AND p.tenant_organization_id = $2
         ORDER BY p.created_at DESC
         LIMIT $3`,
        [dealId, tenantOrganizationId, limit]
      )
      return result.rows
    } catch (error) {
      return mockPledges.filter((p) => p.deal_id === dealId && p.tenant_organization_id === tenantOrganizationId).slice(0, limit)
    }
  },

  async getByProject(projectId: string, tenantOrganizationId: string, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as logged_by_name, d.title as deal_title
         FROM pledges p
         LEFT JOIN users u ON p.logged_by = u.id
         LEFT JOIN deals d ON p.deal_id = d.id
         LEFT JOIN contacts c ON p.contact_id = c.id
         WHERE p.tenant_organization_id = $1
           AND (d.project_id = $2 OR (p.deal_id IS NULL AND c.project_id = $2))
         ORDER BY p.created_at DESC
         LIMIT $3 OFFSET $4`,
        [tenantOrganizationId, projectId, limit, offset]
      )
      return result.rows
    } catch (error) {
      return mockPledges
        .filter((p: any) => p.project_id === projectId && p.tenant_organization_id === tenantOrganizationId)
        .slice(offset, offset + limit)
    }
  },

  async getById(id: string, tenantOrganizationId?: string) {
    try {
      const result = tenantOrganizationId
        ? await pool.query(
            `SELECT p.*, u.name as logged_by_name
             FROM pledges p
             LEFT JOIN users u ON p.logged_by = u.id
             WHERE p.id = $1 AND p.tenant_organization_id = $2`,
            [id, tenantOrganizationId]
          )
        : await pool.query(
            `SELECT p.*, u.name as logged_by_name
             FROM pledges p
             LEFT JOIN users u ON p.logged_by = u.id
             WHERE p.id = $1`,
            [id]
          )
      return result.rows[0]
    } catch (error) {
      return mockPledges.find((p) => p.id === id && (!tenantOrganizationId || p.tenant_organization_id === tenantOrganizationId))
    }
  },

  async create(pledge: Pledge) {
    const id = uuidv4()
    const now = new Date()

    try {
      const result = await pool.query(
        `INSERT INTO pledges (
          id, tenant_organization_id, contact_id, amount, currency, type, status,
          payment_method, transaction_id, deal_id, expected_date, received_date,
          notes, logged_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          id,
          pledge.tenant_organization_id,
          pledge.contact_id,
          pledge.amount,
          pledge.currency || 'USD',
          pledge.type || 'donation',
          pledge.status || 'pending',
          pledge.payment_method,
          pledge.transaction_id,
          pledge.deal_id,
          pledge.expected_date,
          pledge.received_date,
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
        tenant_organization_id: pledge.tenant_organization_id,
        contact_id: pledge.contact_id,
        deal_id: pledge.deal_id,
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

  async update(id: string, data: Partial<Pledge>, tenantOrganizationId?: string) {
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
      const result = tenantOrganizationId
        ? await pool.query(
            `UPDATE pledges SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_organization_id = $${paramCount + 1} RETURNING *`,
            [...values, id, tenantOrganizationId]
          )
        : await pool.query(
            `UPDATE pledges SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            [...values, id]
          )
      return result.rows[0]
    } catch (error) {
      const pledgeIndex = mockPledges.findIndex((p) => p.id === id && (!tenantOrganizationId || p.tenant_organization_id === tenantOrganizationId))
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

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query(`DELETE FROM pledges WHERE id = $1 AND tenant_organization_id = $2`, [id, tenantOrganizationId])
      return { success: true }
    } catch (error) {
      const index = mockPledges.findIndex((p) => p.id === id && p.tenant_organization_id === tenantOrganizationId)
      if (index > -1) {
        mockPledges.splice(index, 1)
        return { success: true }
      }
      return { success: false }
    }
  },

  async getStats(tenantOrganizationId: string, projectId?: string) {
    const whereClause = projectId
      ? `
        WHERE p.tenant_organization_id = $1
          AND (d.project_id = $2 OR (p.deal_id IS NULL AND c.project_id = $2))
      `
      : 'WHERE p.tenant_organization_id = $1'

    const params = projectId ? [tenantOrganizationId, projectId] : [tenantOrganizationId]

    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_pledges,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as total_received,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
          AVG(amount) as average_amount
         FROM pledges p
         LEFT JOIN deals d ON p.deal_id = d.id
         LEFT JOIN contacts c ON p.contact_id = c.id
         ${whereClause}`,
        params
      )
      return result.rows[0]
    } catch (error) {
      const filtered = projectId
        ? mockPledges.filter((p: any) => p.project_id === projectId && p.tenant_organization_id === tenantOrganizationId)
        : mockPledges.filter((p) => p.tenant_organization_id === tenantOrganizationId)

      const totalReceived = filtered
        .filter((p) => p.status === 'received')
        .reduce((sum, p) => sum + p.amount, 0)

      const totalPending = filtered
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)

      const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0)

      return {
        total_pledges: filtered.length,
        total_amount: totalAmount,
        total_received: totalReceived,
        total_pending: totalPending,
        average_amount:
          filtered.length > 0
            ? filtered.reduce((sum, p) => sum + p.amount, 0) / filtered.length
            : 0,
      }
    }
  },
}
