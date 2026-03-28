import { describe, it, expect, beforeEach, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../src/db/connection', () => ({
  default: {
    query: queryMock,
  },
}))

import { projectModel } from '../src/models/project'

const ORG_ID = 'org-1'

describe('projectModel.recalculateRaised', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('updates project raised amount from received pledges total', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ total_received: '1250.50' }] })
    queryMock.mockResolvedValueOnce({ rows: [] })

    const result = await projectModel.recalculateRaised('project-1', ORG_ID)

    expect(result).toBe(1250.5)
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("WHERE p.status = 'received'"),
      [ORG_ID, 'project-1']
    )
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE projects'),
      [1250.5, 'project-1', ORG_ID]
    )
  })

  it('returns null when database call fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('db down'))

    const result = await projectModel.recalculateRaised('project-2', ORG_ID)

    expect(result).toBeNull()
  })
})
