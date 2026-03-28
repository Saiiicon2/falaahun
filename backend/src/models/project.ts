import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Project } from '../types'

// In-memory stores as fallback
const mockProjects: any[] = []
const mockDeals: any[] = []
const mockStages: any[] = []

export const projectModel = {
  async getAll(tenantOrganizationId: string, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT *
         FROM projects
         WHERE tenant_organization_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantOrganizationId, limit, offset]
      )
      return result.rows
    } catch (error) {
      console.log('📝 Using mock project data')
      return mockProjects
        .filter((project) => project.tenant_organization_id === tenantOrganizationId)
        .slice(offset, offset + limit)
    }
  },

  async getById(id: string, tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND tenant_organization_id = $2',
        [id, tenantOrganizationId]
      )
      return result.rows[0]
    } catch (error) {
      return mockProjects.find(p => p.id === id && p.tenant_organization_id === tenantOrganizationId)
    }
  },

  async create(data: Partial<Project> & { tenantOrganizationId: string }) {
    const id = uuidv4()
    const project = {
      id,
      tenant_organization_id: data.tenantOrganizationId,
      name: data.name,
      description: data.description,
      budget: data.budget || 0,
      raised: 0,
      status: data.status || 'active',
      occurrence: data.occurrence || 'one-time',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO projects (id, tenant_organization_id, name, description, budget, status, occurrence)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, data.tenantOrganizationId, data.name, data.description, data.budget || 0, data.status || 'active', data.occurrence || 'one-time']
      )
      return result.rows[0]
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error
      }

      console.log('📝 Storing project in mock storage')
      mockProjects.push(project)
      return project
    }
  },

  async update(id: string, data: Partial<Project>, tenantOrganizationId: string) {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.name) {
      updates.push(`name = $${paramCount++}`)
      values.push(data.name)
    }
    if (data.description) {
      updates.push(`description = $${paramCount++}`)
      values.push(data.description)
    }
    if (data.budget !== undefined) {
      updates.push(`budget = $${paramCount++}`)
      values.push(data.budget)
    }
    if (data.status) {
      updates.push(`status = $${paramCount++}`)
      values.push(data.status)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    try {
      const result = await pool.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_organization_id = $${paramCount + 1} RETURNING *`,
        [...values, id, tenantOrganizationId]
      )
      return result.rows[0]
    } catch (error) {
      const project = mockProjects.find(p => p.id === id && p.tenant_organization_id === tenantOrganizationId)
      if (project) {
        Object.assign(project, data)
        project.updated_at = new Date()
      }
      return project
    }
  },

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query('DELETE FROM projects WHERE id = $1 AND tenant_organization_id = $2', [id, tenantOrganizationId])
    } catch (error) {
      const index = mockProjects.findIndex(p => p.id === id && p.tenant_organization_id === tenantOrganizationId)
      if (index > -1) {
        mockProjects.splice(index, 1)
      }
    }
  },

  async getPipelineStages(projectId: string, tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM pipeline_stages WHERE project_id = $1 AND tenant_organization_id = $2 ORDER BY position ASC',
        [projectId, tenantOrganizationId]
      )
      return result.rows
    } catch (error) {
      return mockStages
        .filter(s => s.project_id === projectId && s.tenant_organization_id === tenantOrganizationId)
        .sort((a, b) => a.position - b.position)
    }
  },

  async addPipelineStage(projectId: string, tenantOrganizationId: string, name: string, position: number, targetAmount?: number) {
    const id = uuidv4()
    const stage = {
      id,
      tenant_organization_id: tenantOrganizationId,
      project_id: projectId,
      name,
      position,
      target_amount: targetAmount,
      created_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO pipeline_stages (id, tenant_organization_id, project_id, name, position, target_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, tenantOrganizationId, projectId, name, position, targetAmount]
      )
      return result.rows[0]
    } catch (error) {
      mockStages.push(stage)
      return stage
    }
  },

  async recalculateRaised(projectId: string, tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        `SELECT COALESCE(SUM(p.amount), 0) as total_received
         FROM pledges p
         LEFT JOIN deals d ON p.deal_id = d.id
         LEFT JOIN contacts c ON p.contact_id = c.id
         WHERE p.status = 'received'
           AND p.tenant_organization_id = $1
           AND (d.project_id = $2 OR (p.deal_id IS NULL AND c.project_id = $2))`,
        [tenantOrganizationId, projectId]
      )

      const totalReceived = Number(result.rows[0]?.total_received || 0)

      await pool.query(
        `UPDATE projects
         SET raised = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND tenant_organization_id = $3`,
        [totalReceived, projectId, tenantOrganizationId]
      )

      return totalReceived
    } catch (error) {
      return null
    }
  }
}

interface DealInput {
  tenantOrganizationId: string
  projectId: string
  title: string
  amount: number
  stageId?: string
  contactId?: string
  status?: string
}

interface DealUpdateInput {
  title?: string
  amount?: number
  stageId?: string
  contactId?: string
  status?: string
}

export const dealModel = {
  async getByProject(projectId: string, tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM deals WHERE project_id = $1 AND tenant_organization_id = $2 ORDER BY created_at DESC',
        [projectId, tenantOrganizationId]
      )
      return result.rows
    } catch (error) {
      return mockDeals
        .filter(d => d.project_id === projectId && d.tenant_organization_id === tenantOrganizationId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  },

  async getById(id: string, tenantOrganizationId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM deals WHERE id = $1 AND tenant_organization_id = $2',
        [id, tenantOrganizationId]
      )
      return result.rows[0]
    } catch (error) {
      return mockDeals.find(d => d.id === id && d.tenant_organization_id === tenantOrganizationId)
    }
  },

  async create(data: DealInput) {
    const id = uuidv4()
    const deal = {
      id,
      tenant_organization_id: data.tenantOrganizationId,
      project_id: data.projectId,
      title: data.title,
      amount: data.amount,
      stage_id: data.stageId,
      contact_id: data.contactId,
      status: data.status || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO deals (id, tenant_organization_id, project_id, title, amount, stage_id, contact_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, data.tenantOrganizationId, data.projectId, data.title, data.amount, data.stageId, data.contactId, data.status || 'pending']
      )
      return result.rows[0]
    } catch (error) {
      mockDeals.push(deal)
      return deal
    }
  },

  async update(id: string, data: DealUpdateInput, tenantOrganizationId: string) {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.title) {
      updates.push(`title = $${paramCount++}`)
      values.push(data.title)
    }
    if (data.amount !== undefined) {
      updates.push(`amount = $${paramCount++}`)
      values.push(data.amount)
    }
    if (data.stageId) {
      updates.push(`stage_id = $${paramCount++}`)
      values.push(data.stageId)
    }
    if (data.contactId) {
      updates.push(`contact_id = $${paramCount++}`)
      values.push(data.contactId)
    }
    if (data.status) {
      updates.push(`status = $${paramCount++}`)
      values.push(data.status)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    try {
      const result = await pool.query(
        `UPDATE deals SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_organization_id = $${paramCount + 1} RETURNING *`,
        [...values, id, tenantOrganizationId]
      )
      return result.rows[0]
    } catch (error) {
      const deal = mockDeals.find(d => d.id === id && d.tenant_organization_id === tenantOrganizationId)
      if (deal) {
        Object.assign(deal, data)
        deal.updated_at = new Date()
      }
      return deal
    }
  },

  async delete(id: string, tenantOrganizationId: string) {
    try {
      await pool.query('DELETE FROM deals WHERE id = $1 AND tenant_organization_id = $2', [id, tenantOrganizationId])
    } catch (error) {
      const index = mockDeals.findIndex(d => d.id === id && d.tenant_organization_id === tenantOrganizationId)
      if (index > -1) {
        mockDeals.splice(index, 1)
      }
    }
  }
}
