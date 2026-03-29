import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

export interface OrganizationMembership {
  id: string
  organization_id: string
  user_id: string
  role: string
  status: string
  created_at?: Date
  updated_at?: Date
}

const mockMemberships: OrganizationMembership[] = []
const canUseMockFallback = process.env.NODE_ENV !== 'production'

export const organizationMembershipModel = {
  async create(organizationId: string, userId: string, role = 'member') {
    const membership: OrganizationMembership = {
      id: uuidv4(),
      organization_id: organizationId,
      user_id: userId,
      role,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }

    try {
      const result = await pool.query(
        `INSERT INTO organization_memberships (id, organization_id, user_id, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          membership.id,
          membership.organization_id,
          membership.user_id,
          membership.role,
          membership.status,
          membership.created_at,
          membership.updated_at,
        ]
      )

      return result.rows[0]
    } catch (error) {
      if (!canUseMockFallback) throw error
      mockMemberships.push(membership)
      return membership
    }
  },

  async getByUserId(userId: string) {
    try {
      const result = await pool.query(
        `SELECT om.*, o.name as organization_name, o.slug as organization_slug
         FROM organization_memberships om
         INNER JOIN organizations o ON o.id = om.organization_id
         WHERE om.user_id = $1 AND om.status = 'active'
         ORDER BY om.created_at ASC`,
        [userId]
      )

      return result.rows
    } catch (error) {
      if (!canUseMockFallback) throw error
      return mockMemberships.filter((membership) => membership.user_id === userId && membership.status === 'active')
    }
  },

  async getByUserAndOrganization(userId: string, organizationId: string) {
    try {
      const result = await pool.query(
        `SELECT *
         FROM organization_memberships
         WHERE user_id = $1 AND organization_id = $2 AND status = 'active'`,
        [userId, organizationId]
      )

      return result.rows[0] || null
    } catch (error) {
      if (!canUseMockFallback) throw error
      return (
        mockMemberships.find(
          (membership) =>
            membership.user_id === userId &&
            membership.organization_id === organizationId &&
            membership.status === 'active'
        ) || null
      )
    }
  },
}