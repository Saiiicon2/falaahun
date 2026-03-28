import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
} from '../controllers/billing'

const router = Router()

router.use(authMiddleware)

router.get('/status', getBillingStatus)
router.post('/checkout-session', createCheckoutSession)
router.post('/portal-session', createPortalSession)

export default router
