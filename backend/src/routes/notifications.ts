import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { getNotifications, markNotificationRead } from '../controllers/notification'

const router = Router()

router.use(authMiddleware)
router.get('/', getNotifications)
router.put('/:id/read', markNotificationRead)

export default router
