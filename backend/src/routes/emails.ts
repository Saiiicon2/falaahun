import { Router } from 'express'
import * as emailController from '../controllers/email'
import { authMiddleware } from '../middleware/auth'
import { requireActiveSubscription } from '../middleware/subscription'

const router = Router()

router.get('/contact/:contactId', authMiddleware, emailController.getContactEmails)
router.post('/send/:contactId', authMiddleware, emailController.sendEmail)
router.get('/stats', authMiddleware, requireActiveSubscription, emailController.getEmailStats)
router.put('/:id/opened', authMiddleware, emailController.markEmailAsOpened)

export default router
