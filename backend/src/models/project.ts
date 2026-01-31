import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import { Project, Deal } from '../types'

// In-memory stores as fallback
const mockProjects: any[] = []
const mockDeals: any[] = []
const mockStages: any[] = []

export const projectModel = {
  async getAll(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      )
      return result.rows
    } catch (error) {
      console.log('📝 Using mock project data')
      return mockProjects.slice(offset, offset + limit)
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockProjects.find(p => p.id === id)
    }
  },

  async create(data: Partial<Project>) {
    const id = uuidv4()
    const project = {
      id,
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
        `INSERT INTO projects (id, name, description, budget, status, occurrence)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, data.name, data.description, data.budget || 0, data.status || 'active', data.occurrence || 'one-time']
      )
      return result.rows[0]
    } catch (error) {
      console.log('📝 Storing project in mock storage')
      mockProjects.push(project)
      return project
    }
  },

  async update(id: string, data: Partial<Project>) {
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
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const project = mockProjects.find(p => p.id === id)
      if (project) {
        Object.assign(project, data)
        project.updated_at = new Date()
      }
      return project
    }
  },

  async delete(id: string) {
    try {
      await pool.query('DELETE FROM projects WHERE id = $1', [id])
    } catch (error) {
      const index = mockProjects.findIndex(p => p.id === id)
      if (index > -1) {
        mockProjects.splice(index, 1)
      }
    }
  },

  async getPipelineStages(projectId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM pipeline_stages WHERE project_id = $1 ORDER BY position ASC',
        [projectId]
      )
      return result.rows
    } catch (error) {
      return mockStages.filter(s => s.project_id === projectId).sort((a, b) => a.position - b.position)
    }
  },

  async addPipelineStage(projectId: string, name: string, position: number, targetAmount?: number) {
    const id = uuidv4()
    const stage = {
      id,
      project_id: projectId,
      name,
      position,
      target_amount: targetAmount,
      created_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO pipeline_stages (id, project_id, name, position, target_amount)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, projectId, name, position, targetAmount]
      )
      return result.rows[0]
    } catch (error) {
      mockStages.push(stage)
      return stage
    }
  }
}

export const dealModel = {
  async getByProject(projectId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM deals WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      )
      return result.rows
    } catch (error) {
      return mockDeals.filter(d => d.project_id === projectId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  },

  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM deals WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockDeals.find(d => d.id === id)
    }
  },

  async create(data: Partial<Deal>) {
    const id = uuidv4()
    const deal = {
      id,
      project_id: data.projectId,
      title: data.title,
      amount: data.amount,
      stage_id: data.id,
      contact_id: data.id,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO deals (id, project_id, title, amount, stage_id, contact_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, data.projectId, data.title, data.amount, data.id, data.id, 'pending']
      )
      return result.rows[0]
    } catch (error) {
      mockDeals.push(deal)
      return deal
    }
  },

  async update(id: string, data: Partial<Deal>) {
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
    if (data.id) {
      updates.push(`stage_id = $${paramCount++}`)
      values.push(data.id)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    try {
      const result = await pool.query(
        `UPDATE deals SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )
      return result.rows[0]
    } catch (error) {
      const deal = mockDeals.find(d => d.id === id)
      if (deal) {
        Object.assign(deal, data)
        deal.updated_at = new Date()
      }
      return deal
    }
  },

  async delete(id: string) {
    try {
      await pool.query('DELETE FROM deals WHERE id = $1', [id])
    } catch (error) {
      const index = mockDeals.findIndex(d => d.id === id)
      if (index > -1) {
        mockDeals.splice(index, 1)
      }
    }
  }
}
