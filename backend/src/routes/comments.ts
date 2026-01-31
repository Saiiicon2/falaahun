import { Router } from 'express'
import * as commentController from '../controllers/comment'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/contact/:contactId', authMiddleware, commentController.getContactComments)
router.post('/contact/:contactId', authMiddleware, commentController.createComment)
router.delete('/:id', authMiddleware, commentController.deleteComment)

export default router
