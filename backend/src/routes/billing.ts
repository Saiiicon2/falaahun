import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getBillingStatus,
  createPayfastCheckout,
  handlePayfastItn,
  handlePayfastCancelItn,
  devSubscribe,
} from '../controllers/billing'

const router = Router()

// Public ITN endpoints – PayFast calls these directly, no auth token
router.post('/payfast/itn', handlePayfastItn)
router.post('/payfast/cancel-itn', handlePayfastCancelItn)

// Authenticated billing routes
router.use(authMiddleware)
router.get('/status', getBillingStatus)
router.post('/payfast/checkout', createPayfastCheckout)
router.post('/dev-subscribe', devSubscribe)

export default router
