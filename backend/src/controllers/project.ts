import { Request, Response } from 'express'
import { projectModel, dealModel } from '../models/project'

export const getProjects = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { limit = 50, offset = 0 } = req.query
    const projects = await projectModel.getAll(req.user.organizationId, Number(limit), Number(offset))
    res.json({ success: true, data: projects })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getProject = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const project = await projectModel.getById(req.params.id, req.user.organizationId)
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }
    res.json({ success: true, data: project })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createProject = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { name, description, budget } = req.body
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' })
    }

    const project = await projectModel.create({
      name,
      description,
      budget,
      tenantOrganizationId: req.user.organizationId,
    })
    res.status(201).json({ success: true, data: project })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateProject = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const project = await projectModel.update(req.params.id, req.body, req.user.organizationId)
    res.json({ success: true, data: project })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteProject = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    await projectModel.delete(req.params.id, req.user.organizationId)
    res.json({ success: true, message: 'Project deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getPipelineStages = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const stages = await projectModel.getPipelineStages(req.params.projectId, req.user.organizationId)
    res.json({ success: true, data: stages })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const addPipelineStage = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { name, position, targetAmount } = req.body
    const stage = await projectModel.addPipelineStage(
      req.params.projectId,
      req.user.organizationId,
      name,
      position,
      targetAmount
    )
    res.status(201).json({ success: true, data: stage })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getDeals = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const deals = await dealModel.getByProject(req.params.projectId, req.user.organizationId)
    res.json({ success: true, data: deals })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getDeal = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const deal = await dealModel.getById(req.params.id, req.user.organizationId)
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' })
    }
    res.json({ success: true, data: deal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createDeal = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const { title, amount, stageId, contactId } = req.body
    
    if (!title || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and amount are required' 
      })
    }

    const deal = await dealModel.create({
      tenantOrganizationId: req.user.organizationId,
      projectId: req.params.projectId,
      title,
      amount: Number(amount),
      stageId,
      contactId,
      status: 'pending'
    })

    res.status(201).json({ success: true, data: deal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateDeal = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const deal = await dealModel.update(req.params.id, {
      title: req.body.title,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
      stageId: req.body.stageId,
      contactId: req.body.contactId,
      status: req.body.status,
    }, req.user.organizationId)
    res.json({ success: true, data: deal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteDeal = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    await dealModel.delete(req.params.id, req.user.organizationId)
    res.json({ success: true, message: 'Deal deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
