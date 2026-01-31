import { Router } from 'express'
import * as authController from '../controllers/auth'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/profile', authMiddleware, authController.getProfile)
router.get('/users', authMiddleware, authController.getUsers)

export default router
