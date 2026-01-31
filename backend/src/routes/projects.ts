import { Router } from 'express'
import * as projectController from '../controllers/project'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, projectController.getProjects)
router.post('/', authMiddleware, projectController.createProject)
router.get('/:id', authMiddleware, projectController.getProject)
router.put('/:id', authMiddleware, projectController.updateProject)
router.delete('/:id', authMiddleware, projectController.deleteProject)

router.get('/:projectId/stages', authMiddleware, projectController.getPipelineStages)
router.post('/:projectId/stages', authMiddleware, projectController.addPipelineStage)

router.get('/:projectId/deals', authMiddleware, projectController.getDeals)
router.post('/:projectId/deals', authMiddleware, projectController.createDeal)
router.get('/deals/:id', authMiddleware, projectController.getDeal)
router.put('/deals/:id', authMiddleware, projectController.updateDeal)
router.delete('/deals/:id', authMiddleware, projectController.deleteDeal)

export default router
