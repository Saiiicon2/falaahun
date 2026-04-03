import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getPaymentProfile,
  upsertPaymentProfile,
  deletePaymentProfile,
} from '../controllers/paymentProfile'

const router = Router()

router.use(authMiddleware)

router.get('/', getPaymentProfile)
router.put('/', upsertPaymentProfile)
router.delete('/', deletePaymentProfile)

export default router
