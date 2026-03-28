import { describe, it, expect, beforeEach, vi } from 'vitest'

const { pledgeModelMock, dealModelMock, projectModelMock, contactModelMock } = vi.hoisted(() => ({
  pledgeModelMock: {
    getByContact: vi.fn(),
    getByDeal: vi.fn(),
    getByProject: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
  },
  dealModelMock: {
    getById: vi.fn(),
  },
  projectModelMock: {
    recalculateRaised: vi.fn(),
  },
  contactModelMock: {
    getById: vi.fn(),
  },
}))

vi.mock('../src/models/pledge', () => ({
  pledgeModel: pledgeModelMock,
}))

vi.mock('../src/models/project', () => ({
  dealModel: dealModelMock,
  projectModel: projectModelMock,
}))

vi.mock('../src/models/contact', () => ({
  contactModel: contactModelMock,
}))

import {
  createPledge,
  updatePledge,
  deletePledge,
  getPledges,
  getPledgeStats,
} from '../src/controllers/pledge'

const ORG_ID = 'org-1'

const makeRes = () => {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('pledge controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createPledge returns 400 when contactId is missing', async () => {
    const req: any = { body: { amount: 100 }, user: { id: 'user-1', organizationId: ORG_ID } }
    const res = makeRes()

    await createPledge(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'contactId is required' })
  })

  it('createPledge creates record and recalculates project from contact context', async () => {
    const req: any = {
      body: {
        contactId: 'contact-1',
        amount: 250,
        type: 'pledge',
      },
      user: { id: 'user-1', organizationId: ORG_ID },
    }
    const res = makeRes()

    pledgeModelMock.create.mockResolvedValueOnce({ id: 'pledge-1' })
    contactModelMock.getById.mockResolvedValueOnce({ id: 'contact-1', project_id: 'project-1' })
    projectModelMock.recalculateRaised.mockResolvedValueOnce(250)

    await createPledge(req, res)

    expect(pledgeModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_id: 'contact-1',
        amount: 250,
        type: 'pledge',
        logged_by: 'user-1',
      })
    )
    expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('updatePledge recalculates both old and new project when deal changes', async () => {
    const req: any = {
      params: { id: 'pledge-1' },
      body: { dealId: 'deal-new', amount: 500 },
      user: { id: 'user-1', organizationId: ORG_ID },
    }
    const res = makeRes()

    pledgeModelMock.getById.mockResolvedValueOnce({
      id: 'pledge-1',
      contact_id: 'contact-1',
      deal_id: 'deal-old',
    })
    pledgeModelMock.update.mockResolvedValueOnce({ id: 'pledge-1' })

    dealModelMock.getById
      .mockResolvedValueOnce({ id: 'deal-old', project_id: 'project-old' })
      .mockResolvedValueOnce({ id: 'deal-new', project_id: 'project-new' })

    await updatePledge(req, res)

    expect(projectModelMock.recalculateRaised).toHaveBeenNthCalledWith(1, 'project-old', ORG_ID)
    expect(projectModelMock.recalculateRaised).toHaveBeenNthCalledWith(2, 'project-new', ORG_ID)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'pledge-1' } })
  })

  it('deletePledge recalculates project after successful deletion', async () => {
    const req: any = { params: { id: 'pledge-1' }, user: { id: 'user-1', organizationId: ORG_ID } }
    const res = makeRes()

    pledgeModelMock.getById.mockResolvedValueOnce({
      id: 'pledge-1',
      contact_id: 'contact-1',
      deal_id: 'deal-1',
    })
    pledgeModelMock.delete.mockResolvedValueOnce({ success: true })
    dealModelMock.getById.mockResolvedValueOnce({ id: 'deal-1', project_id: 'project-1' })

    await deletePledge(req, res)

    expect(projectModelMock.recalculateRaised).toHaveBeenCalledWith('project-1', ORG_ID)
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Pledge deleted' })
  })

  it('getPledges routes project filter to model', async () => {
    const req: any = {
      query: { projectId: 'project-77', limit: '10', offset: '3' },
      user: { id: 'user-1', organizationId: ORG_ID },
    }
    const res = makeRes()

    pledgeModelMock.getByProject.mockResolvedValueOnce([{ id: 'p1' }])

    await getPledges(req, res)

    expect(pledgeModelMock.getByProject).toHaveBeenCalledWith('project-77', ORG_ID, 10, 3)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'p1' }] })
  })

  it('getPledgeStats forwards optional projectId', async () => {
    const req: any = { query: { projectId: 'project-2' }, user: { id: 'user-1', organizationId: ORG_ID } }
    const res = makeRes()

    pledgeModelMock.getStats.mockResolvedValueOnce({ total_pledges: 4 })

    await getPledgeStats(req, res)

    expect(pledgeModelMock.getStats).toHaveBeenCalledWith(ORG_ID, 'project-2')
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { total_pledges: 4 } })
  })
})
