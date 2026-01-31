import { Router } from 'express'
import * as activityController from '../controllers/activity'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, activityController.getRecentActivities)
router.get('/stats', authMiddleware, activityController.getActivityStats)
router.get('/:id', authMiddleware, activityController.getActivity)
router.post('/', authMiddleware, activityController.createActivity)
router.put('/:id', authMiddleware, activityController.updateActivity)
router.delete('/:id', authMiddleware, activityController.deleteActivity)

router.get('/contact/:contactId', authMiddleware, activityController.getActivitiesByContact)

export default router
