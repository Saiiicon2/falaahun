import pool from '../db/connection'

export interface Notification {
  id: string
  organization_id: string
  type: string
  message: string
  reference_id?: string
  payload_json?: Record<string, unknown>
  read?: boolean
  created_at?: Date
}

export const notificationModel = {
  async create(notification: Omit<Notification, 'id' | 'created_at'>) {
    const result = await pool.query(
      `INSERT INTO notifications
         (organization_id, type, message, reference_id, payload_json, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        notification.organization_id,
        notification.type,
        notification.message,
        notification.reference_id || null,
        JSON.stringify(notification.payload_json || {}),
        notification.read || false,
      ]
    )
    return result.rows[0]
  },

  async getByOrganization(organizationId: string, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [organizationId, limit]
    )
    return result.rows
  },

  async markAsRead(notificationId: string, organizationId: string) {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [notificationId, organizationId]
    )
    return result.rows[0]
  },
}
