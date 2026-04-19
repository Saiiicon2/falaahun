import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getBillingStatus,
  createPayfastCheckout,
  createStripeCheckout,
  handlePayfastItn,
  handlePayfastCancelItn,
  handleStripeWebhook,
  devSubscribe,
} from '../controllers/billing'

const router = Router()

// Public ITN / webhook endpoints – PayFast and Stripe call these directly
router.post('/payfast/itn', handlePayfastItn)
router.post('/payfast/cancel-itn', handlePayfastCancelItn)
router.post('/stripe/webhook', handleStripeWebhook)

// Authenticated billing routes
router.use(authMiddleware)
router.get('/status', getBillingStatus)
router.post('/payfast/checkout', createPayfastCheckout)
router.post('/stripe/checkout', createStripeCheckout)
router.post('/dev-subscribe', devSubscribe)

export default router
