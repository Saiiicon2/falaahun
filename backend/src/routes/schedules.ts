import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getContactSchedules,
  getUpcomingSchedules,
  createSchedule,
  updateSchedule,
  cancelSchedule,
  getSchedule
} from '../controllers/schedule'

const router = Router()

router.use(authMiddleware)

// Get upcoming schedules dashboard
router.get('/upcoming/list', getUpcomingSchedules)

// Get all schedules for a contact
router.get('/contact/:contactId', getContactSchedules)

// Create a schedule for a contact
router.post('/contact/:contactId', createSchedule)

// Get a specific schedule
router.get('/:id', getSchedule)

// Update a schedule
router.put('/:id', updateSchedule)

// Cancel a schedule
router.delete('/:id/cancel', cancelSchedule)

export default router
