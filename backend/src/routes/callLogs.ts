import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getContactCallLogs,
  logCall,
  updateCallLog,
  getCallLog
} from '../controllers/callLog'

const router = Router()

router.use(authMiddleware)

// Get all call logs for a contact
router.get('/contact/:contactId', getContactCallLogs)

// Log a new call for a contact
router.post('/contact/:contactId', logCall)

// Get a specific call log
router.get('/:id', getCallLog)

// Update a call log
router.put('/:id', updateCallLog)

export default router
