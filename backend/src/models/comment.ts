import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

// Mock storage
const mockComments: any[] = []

export const commentModel = {
  async getByContact(contactId: string, tenantOrganizationId: string, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT c.*, u.name as author_name 
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.contact_id = $1 AND c.tenant_organization_id = $2
         ORDER BY c.created_at DESC 
         LIMIT $3 OFFSET $4`,
        [contactId, tenantOrganizationId, limit, offset]
      )
      return result.rows
    } catch (error) {
      return mockComments
        .filter(c => c.contact_id === contactId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit)
    }
  },

  async create(contactId: string, content: string, authorId: string, tenantOrganizationId: string) {
    const id = uuidv4()
    const comment = {
      id,
      tenant_organization_id: tenantOrganizationId,
      contact_id: contactId,
      activity_id: null,
      content,
      author_id: authorId,
      author_name: 'User',
      created_at: new Date(),
      updated_at: new Date()
    }

    try {
      await pool.query(
        `INSERT INTO comments (id, tenant_organization_id, contact_id, content, author_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, tenantOrganizationId, contactId, content, authorId]
      )
      const result = await pool.query(
        `SELECT c.*, u.name as author_name
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      mockComments.push(comment)
      return comment
    }
  },

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query('DELETE FROM comments WHERE id = $1 AND tenant_organization_id = $2', [id, tenantOrganizationId])
    } catch (error) {
      const index = mockComments.findIndex(c => c.id === id)
      if (index > -1) {
        mockComments.splice(index, 1)
      }
    }
  },

  async getById(id: string, tenantOrganizationId?: string) {
    try {
      if (tenantOrganizationId) {
        const result = await pool.query(
          `SELECT c.*, u.name as author_name 
           FROM comments c
           JOIN users u ON c.author_id = u.id
           WHERE c.id = $1 AND c.tenant_organization_id = $2`,
          [id, tenantOrganizationId]
        )
        return result.rows[0]
      }
      const result = await pool.query(
        `SELECT c.*, u.name as author_name 
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.id = $1`,
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockComments.find(c => c.id === id)
    }
  }
}
