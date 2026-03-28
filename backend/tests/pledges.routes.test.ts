import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pledgeRoutes from '../src/routes/pledges'

const ORG_ID = 'org-1'

// Mock auth middleware
vi.mock('../src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', organizationId: ORG_ID, membershipRole: 'owner' }
    next()
  }
}))

// Mock models with hoisted factory function
const { pledgeModelMock, dealModelMock, projectModelMock, contactModelMock } = vi.hoisted(() => {
  return {
    pledgeModelMock: {
      getAll: vi.fn().mockResolvedValue([
        { id: 'pledge-1', contact_id: 'contact-1', amount: 100, status: 'pending', type: 'donation' },
        { id: 'pledge-2', contact_id: 'contact-2', amount: 250, status: 'received', type: 'pledge' }
      ]),
      getById: vi.fn().mockResolvedValue({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        deal_id: undefined, 
        amount: 100, 
        status: 'pending', 
        type: 'donation',
        currency: 'USD',
        payment_method: null,
        transaction_id: null,
        expected_date: null,
        received_date: null,
        notes: 'Test pledge'
      }),
      getByContact: vi.fn().mockResolvedValue([
        { id: 'pledge-1', contact_id: 'contact-1', amount: 100, status: 'pending', type: 'donation' }
      ]),
      getByDeal: vi.fn().mockResolvedValue([
        { id: 'pledge-2', deal_id: 'deal-1', amount: 250, status: 'received', type: 'pledge' }
      ]),
      getByProject: vi.fn().mockResolvedValue([
        { id: 'pledge-1', project_id: 'project-1', amount: 100, status: 'pending', type: 'donation' },
        { id: 'pledge-2', project_id: 'project-1', amount: 250, status: 'received', type: 'pledge' }
      ]),
      create: vi.fn().mockResolvedValue({ 
        id: 'pledge-new', 
        contact_id: 'contact-1', 
        amount: 500, 
        status: 'pending', 
        type: 'donation',
        currency: 'USD',
        notes: 'New pledge'
      }),
      update: vi.fn().mockResolvedValue({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        amount: 350, 
        status: 'received', 
        type: 'donation'
      }),
      delete: vi.fn().mockResolvedValue({ success: true }),
      getStats: vi.fn().mockResolvedValue({
        total_pledges: 2,
        total_amount: 350,
        received_amount: 250,
        pending_amount: 100,
        failed_amount: 0
      })
    },
    dealModelMock: {
      getById: vi.fn().mockResolvedValue({ id: 'deal-1', project_id: 'project-1' })
    },
    projectModelMock: {
      recalculateRaised: vi.fn().mockResolvedValue(undefined)
    },
    contactModelMock: {
      getById: vi.fn().mockResolvedValue({ id: 'contact-1', project_id: 'project-1' })
    }
  }
})

vi.mock('../src/models/pledge', () => ({
  pledgeModel: pledgeModelMock
}))

vi.mock('../src/models/project', () => ({
  dealModel: dealModelMock,
  projectModel: projectModelMock
}))

vi.mock('../src/models/contact', () => ({
  contactModel: contactModelMock
}))

describe('Pledges Routes - Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use('/pledges', pledgeRoutes)
    
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('GET /pledges', () => {
    it('should return all pledges with default pagination', async () => {
      const response = await request(app)
        .get('/pledges')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(pledgeModelMock.getAll).toHaveBeenCalledWith(ORG_ID, 50, 0)
    })
    it('should return pledges with custom limit and offset', async () => {
      const response = await request(app)
        .get('/pledges?limit=10&offset=5')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getAll).toHaveBeenCalledWith(ORG_ID, 10, 5)
    })

    it('should filter pledges by contactId', async () => {
      const response = await request(app)
        .get('/pledges?contactId=contact-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getByContact).toHaveBeenCalledWith('contact-1', ORG_ID, 50)
    })

    it('should filter pledges by projectId', async () => {
      const response = await request(app)
        .get('/pledges?projectId=project-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getByProject).toHaveBeenCalledWith('project-1', ORG_ID, 50, 0)
    })

    it('should filter pledges by dealId', async () => {
      const response = await request(app)
        .get('/pledges?dealId=deal-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getByDeal).toHaveBeenCalledWith('deal-1', ORG_ID, 50)
    })

    it('should handle database errors gracefully', async () => {
      pledgeModelMock.getAll.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .get('/pledges')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Database connection failed')
    })
  })

  describe('GET /pledges/:id', () => {
    it('should return a single pledge by id', async () => {
      const response = await request(app)
        .get('/pledges/pledge-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id', 'pledge-1')
      expect(pledgeModelMock.getById).toHaveBeenCalledWith('pledge-1', ORG_ID)
    })

    it('should return 404 when pledge not found', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce(null)

      const response = await request(app)
        .get('/pledges/pledge-nonexistent')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Pledge not found')
    })

    it('should handle database errors for getById', async () => {
      pledgeModelMock.getById.mockRejectedValueOnce(new Error('Query failed'))

      const response = await request(app)
        .get('/pledges/pledge-1')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Query failed')
    })
  })

  describe('POST /pledges', () => {
    it('should create a pledge with valid data', async () => {
      const pledgeData = {
        contactId: 'contact-1',
        amount: 500,
        currency: 'USD',
        type: 'donation',
        status: 'pending',
        notes: 'Test pledge'
      }

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id', 'pledge-new')
      expect(pledgeModelMock.create).toHaveBeenCalled()
      expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
    })

    it('should reject pledge without contactId', async () => {
      const pledgeData = {
        amount: 500,
        currency: 'USD',
        type: 'donation'
      }

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'contactId is required')
      expect(pledgeModelMock.create).not.toHaveBeenCalled()
    })

    it('should reject pledge with invalid amount', async () => {
      const pledgeData = {
        contactId: 'contact-1',
        amount: 0,
        currency: 'USD'
      }

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toContain('amount must be greater than 0')
    })

    it('should reject pledge with negative amount', async () => {
      const pledgeData = {
        contactId: 'contact-1',
        amount: -100,
        currency: 'USD'
      }

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toContain('amount must be greater than 0')
    })

    it('should create pledge with dealId and contact context', async () => {
      const pledgeData = {
        contactId: 'contact-1',
        dealId: 'deal-1',
        amount: 750,
        currency: 'USD',
        type: 'pledge'
      }

      contactModelMock.getById.mockResolvedValueOnce({ id: 'contact-1', project_id: 'project-1' })

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
    })

    it('should handle database errors during creation', async () => {
      pledgeModelMock.create.mockRejectedValueOnce(new Error('Unique constraint violation'))

      const pledgeData = {
        contactId: 'contact-1',
        amount: 500
      }

      const response = await request(app)
        .post('/pledges')
        .send(pledgeData)
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Unique constraint violation')
    })
  })

  describe('PUT /pledges/:id', () => {
    it('should update pledge with valid data', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        deal_id: undefined, 
        amount: 100, 
        status: 'pending',
        type: 'donation'
      })

      const updateData = {
        amount: 350,
        status: 'received'
      }

      const response = await request(app)
        .put('/pledges/pledge-1')
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('amount', 350)
      expect(pledgeModelMock.update).toHaveBeenCalledWith('pledge-1', expect.objectContaining(updateData), ORG_ID)
    })

    it('should return 404 when updating non-existent pledge', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce(null)

      const updateData = { amount: 200 }

      const response = await request(app)
        .put('/pledges/pledge-nonexistent')
        .send(updateData)
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Pledge not found')
    })

    it('should reject update with invalid amount', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        amount: 100 
      })

      const updateData = { amount: -50 }

      const response = await request(app)
        .put('/pledges/pledge-1')
        .send(updateData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toContain('amount must be greater than 0')
    })

    it('should recalculate both projects when deal changes', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        deal_id: 'deal-1'
      })

      dealModelMock.getById
        .mockResolvedValueOnce({ id: 'deal-1', project_id: 'project-1' })
        .mockResolvedValueOnce({ id: 'deal-2', project_id: 'project-2' })

      const updateData = { dealId: 'deal-2' }

      const response = await request(app)
        .put('/pledges/pledge-1')
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
      expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-2', ORG_ID)
    })

    it('should handle database errors during update', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        amount: 100 
      })
      pledgeModelMock.update.mockRejectedValueOnce(new Error('Update failed'))

      const updateData = { amount: 200 }

      const response = await request(app)
        .put('/pledges/pledge-1')
        .send(updateData)
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Update failed')
    })
  })

  describe('DELETE /pledges/:id', () => {
    it('should delete a pledge successfully', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1', 
        deal_id: undefined 
      })
      pledgeModelMock.delete.mockResolvedValueOnce({ success: true })

      const response = await request(app)
        .delete('/pledges/pledge-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'Pledge deleted')
      expect(pledgeModelMock.delete).toHaveBeenCalledWith('pledge-1', ORG_ID)
      expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
    })

    it('should return 404 when deleting non-existent pledge', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce(null)

      const response = await request(app)
        .delete('/pledges/pledge-nonexistent')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Pledge not found')
      expect(pledgeModelMock.delete).not.toHaveBeenCalled()
    })

    it('should handle deletion failure from model', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1' 
      })
      pledgeModelMock.delete.mockResolvedValueOnce({ success: false })

      const response = await request(app)
        .delete('/pledges/pledge-1')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Pledge not found')
    })

    it('should handle database errors during deletion', async () => {
      pledgeModelMock.getById.mockResolvedValueOnce({ 
        id: 'pledge-1', 
        contact_id: 'contact-1' 
      })
      pledgeModelMock.delete.mockRejectedValueOnce(new Error('Delete failed'))

      const response = await request(app)
        .delete('/pledges/pledge-1')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Delete failed')
    })
  })

  describe('GET /pledges/stats', () => {
    it('should return pledge statistics for all pledges', async () => {
      const response = await request(app)
        .get('/pledges/stats')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('total_pledges', 2)
      expect(response.body.data).toHaveProperty('total_amount', 350)
      expect(response.body.data).toHaveProperty('received_amount', 250)
      expect(response.body.data).toHaveProperty('pending_amount', 100)
      expect(pledgeModelMock.getStats).toHaveBeenCalledWith(ORG_ID, undefined)
    })

    it('should return pledge statistics for specific project', async () => {
      const response = await request(app)
        .get('/pledges/stats?projectId=project-1')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getStats).toHaveBeenCalledWith(ORG_ID, 'project-1')
    })

    it('should handle database errors for stats', async () => {
      pledgeModelMock.getStats.mockRejectedValueOnce(new Error('Stats query failed'))

      const response = await request(app)
        .get('/pledges/stats')
        .expect(500)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Stats query failed')
    })
  })

  describe('Auth Middleware', () => {
    it('should apply auth middleware to all routes', async () => {
      // The authMiddleware mock is already applied, so all requests should have req.user set
      // This test verifies the middleware is in the route chain
      const response = await request(app)
        .get('/pledges')
        .expect(200)

      // If auth middleware is working, request succeeds
      // If auth middleware were missing, the route might behave differently
      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)

      // Express should return 400 for invalid JSON
      expect(response.status).toBe(400)
    })

    it('should handle missing required query parameters gracefully', async () => {
      const response = await request(app)
        .get('/pledges?invalidParam=test')
        .expect(200)

      // Should still return pledges with default params, ignoring invalid ones
      expect(response.body).toHaveProperty('success', true)
      expect(pledgeModelMock.getAll).toHaveBeenCalledWith(ORG_ID, 50, 0)
    })
  })
})
