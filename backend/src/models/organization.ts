/**
 * Organization Model
 * Handles all database operations for organizations and logo management
 */

import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

interface Organization {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  description?: string
  logo_url?: string
  logo_key?: string // Key for cloud storage
  created_at?: Date
  updated_at?: Date
}

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Default Organization',
    email: 'org@falaahun.org',
    created_at: new Date(),
    updated_at: new Date(),
  },
]

const organizationModel = {
  async getAll() {
    try {
      const result = await pool.query('SELECT * FROM organizations ORDER BY created_at DESC')
      return result.rows
    } catch (error) {
      console.log('Using mock storage for organizations')
      return mockOrganizations
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id])
      return result.rows[0] || null
    } catch (error) {
      return mockOrganizations.find((org) => org.id === id) || null
    }
  },

  async create(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) {
    const id = uuidv4()
    const now = new Date()

    try {
      const result = await pool.query(
        `INSERT INTO organizations (id, name, email, phone, address, website, description, logo_url, logo_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id,
          organization.name,
          organization.email,
          organization.phone,
          organization.address,
          organization.website,
          organization.description,
          organization.logo_url,
          organization.logo_key,
          now,
          now,
        ]
      )
      return result.rows[0]
    } catch (error) {
      const newOrg = {
        id,
        ...organization,
        created_at: now,
        updated_at: now,
      }
      mockOrganizations.push(newOrg)
      return newOrg
    }
  },

  async update(id: string, organization: Partial<Organization>) {
    const now = new Date()

    try {
      const fields = Object.keys(organization)
        .filter((key) => key !== 'id')
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ')

      const values = Object.values(organization).filter((_, index, arr) => {
        const keys = Object.keys(organization)
        return keys[index] !== 'id'
      })

      const result = await pool.query(
        `UPDATE organizations SET ${fields}, updated_at = $${values.length + 1} WHERE id = $${values.length + 2} RETURNING *`,
        [...values, now, id]
      )
      return result.rows[0]
    } catch (error) {
      const index = mockOrganizations.findIndex((org) => org.id === id)
      if (index !== -1) {
        mockOrganizations[index] = {
          ...mockOrganizations[index],
          ...organization,
          updated_at: now,
        }
        return mockOrganizations[index]
      }
      return null
    }
  },

  async updateLogo(id: string, logoUrl: string, logoKey?: string) {
    const now = new Date()

    try {
      const result = await pool.query(
        `UPDATE organizations SET logo_url = $1, logo_key = $2, updated_at = $3 WHERE id = $4 RETURNING *`,
        [logoUrl, logoKey || null, now, id]
      )
      return result.rows[0]
    } catch (error) {
      const index = mockOrganizations.findIndex((org) => org.id === id)
      if (index !== -1) {
        mockOrganizations[index] = {
          ...mockOrganizations[index],
          logo_url: logoUrl,
          logo_key: logoKey,
          updated_at: now,
        }
        return mockOrganizations[index]
      }
      return null
    }
  },

  async delete(id: string) {
    try {
      await pool.query('DELETE FROM organizations WHERE id = $1', [id])
      return true
    } catch (error) {
      const index = mockOrganizations.findIndex((org) => org.id === id)
      if (index !== -1) {
        mockOrganizations.splice(index, 1)
        return true
      }
      return false
    }
  },
}

export default organizationModel
