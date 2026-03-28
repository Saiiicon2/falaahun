import { Router } from 'express'
import * as activityController from '../controllers/activity'
import { authMiddleware } from '../middleware/auth'
import { requireActiveSubscription } from '../middleware/subscription'

const router = Router()

router.get('/', authMiddleware, activityController.getRecentActivities)
router.get('/stats', authMiddleware, requireActiveSubscription, activityController.getActivityStats)
router.get('/contact/:contactId', authMiddleware, activityController.getActivitiesByContact)
router.get('/:id', authMiddleware, activityController.getActivity)
router.post('/', authMiddleware, activityController.createActivity)
router.put('/:id', authMiddleware, activityController.updateActivity)
router.delete('/:id', authMiddleware, activityController.deleteActivity)

export default router
