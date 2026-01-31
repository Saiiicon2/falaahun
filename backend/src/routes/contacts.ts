import { Router } from 'express'
import * as contactController from '../controllers/contact'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, contactController.getContacts)
router.post('/', authMiddleware, contactController.createContact)
router.get('/search', authMiddleware, contactController.searchContacts)
router.get('/:id', authMiddleware, contactController.getContact)
router.put('/:id', authMiddleware, contactController.updateContact)
router.delete('/:id', authMiddleware, contactController.deleteContact)

export default router
