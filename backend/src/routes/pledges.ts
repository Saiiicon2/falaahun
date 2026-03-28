import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { requireActiveSubscription } from '../middleware/subscription'
import * as pledgeController from '../controllers/pledge'

const router = Router()

router.use(authMiddleware)

router.get('/', pledgeController.getPledges)
router.get('/stats', requireActiveSubscription, pledgeController.getPledgeStats)
router.get('/:id', pledgeController.getPledge)
router.post('/', pledgeController.createPledge)
router.put('/:id', pledgeController.updatePledge)
router.delete('/:id', pledgeController.deletePledge)

export default router
