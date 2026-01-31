import { Request, Response } from 'express'
import { projectModel, dealModel } from '../models/project'

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const projects = await projectModel.getAll(Number(limit), Number(offset))
    res.json({ success: true, data: projects })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await projectModel.getById(req.params.id)
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
    const { name, description, budget } = req.body
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' })
    }

    const project = await projectModel.create({ name, description, budget })
    res.status(201).json({ success: true, data: project })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await projectModel.update(req.params.id, req.body)
    res.json({ success: true, data: project })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteProject = async (req: Request, res: Response) => {
  try {
    await projectModel.delete(req.params.id)
    res.json({ success: true, message: 'Project deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getPipelineStages = async (req: Request, res: Response) => {
  try {
    const stages = await projectModel.getPipelineStages(req.params.projectId)
    res.json({ success: true, data: stages })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const addPipelineStage = async (req: Request, res: Response) => {
  try {
    const { name, position, targetAmount } = req.body
    const stage = await projectModel.addPipelineStage(
      req.params.projectId,
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
    const deals = await dealModel.getByProject(req.params.projectId)
    res.json({ success: true, data: deals })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getDeal = async (req: Request, res: Response) => {
  try {
    const deal = await dealModel.getById(req.params.id)
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
    const { title, amount, stageId, contactId } = req.body
    
    if (!title || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and amount are required' 
      })
    }

    const deal = await dealModel.create({
      projectId: req.params.projectId,
      title,
      amount,
      id: stageId,
      createdAt: new Date()
    })

    res.status(201).json({ success: true, data: deal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const updateDeal = async (req: Request, res: Response) => {
  try {
    const deal = await dealModel.update(req.params.id, req.body)
    res.json({ success: true, data: deal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const deleteDeal = async (req: Request, res: Response) => {
  try {
    await dealModel.delete(req.params.id)
    res.json({ success: true, message: 'Deal deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
