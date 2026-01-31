/**
 * Integration Routes
 * API endpoints for managing CRM integrations and syncing data
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { syncService } from '../services/syncService'

const router = Router()

// Protect all integration routes with authentication
router.use(authMiddleware)

/**
 * GET /integrations/status
 * Get the connection status of all integrations
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const statuses = await syncService.getIntegrationStatuses()
    res.json({
      success: true,
      data: statuses,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /integrations/:name/test
 * Test connection to a specific integration
 */
router.post('/:name/test', async (req: Request, res: Response) => {
  try {
    const { name } = req.params

    if (!syncService.isIntegrationAvailable(name)) {
      return res.status(404).json({
        success: false,
        error: `Integration ${name} not found or not enabled`,
      })
    }

    const result = await syncService.testIntegration(name)

    res.json({
      success: result.connected,
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /integrations/sync/contact/:contactId
 * Manually sync a contact to all enabled integrations
 */
router.post('/sync/contact/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required',
      })
    }

    const results = await syncService.syncContact(contactId)

    const allSuccessful = results.every((r) => r.success)

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      data: results,
      message: allSuccessful
        ? 'Contact synced to all integrations'
        : 'Contact synced with some failures',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /integrations/sync/pledge/:pledgeId
 * Manually sync a pledge to all enabled integrations
 */
router.post('/sync/pledge/:pledgeId', async (req: Request, res: Response) => {
  try {
    const { pledgeId } = req.params

    if (!pledgeId) {
      return res.status(400).json({
        success: false,
        error: 'Pledge ID is required',
      })
    }

    const results = await syncService.syncPledge(pledgeId)

    const allSuccessful = results.every((r) => r.success)

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      data: results,
      message: allSuccessful
        ? 'Pledge synced to all integrations'
        : 'Pledge synced with some failures',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /integrations/sync/activity/:activityId
 * Manually sync an activity to all enabled integrations
 */
router.post('/sync/activity/:activityId', async (req: Request, res: Response) => {
  try {
    const { activityId } = req.params

    if (!activityId) {
      return res.status(400).json({
        success: false,
        error: 'Activity ID is required',
      })
    }

    const results = await syncService.syncActivity(activityId)

    const allSuccessful = results.every((r) => r.success)

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      data: results,
      message: allSuccessful
        ? 'Activity synced to all integrations'
        : 'Activity synced with some failures',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /integrations/webhooks/hubspot
 * Receive incoming webhooks from HubSpot
 */
router.post('/webhooks/hubspot', async (req: Request, res: Response) => {
  try {
    const event = req.body

    // Verify webhook signature (important!)
    // TODO: Implement HubSpot webhook signature verification

    const integration = syncService.getIntegration('hubspot')
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'HubSpot integration not available',
      })
    }

    await integration.handleWebhook({
      id: event.objectId || '',
      type: event.subscriptionType || 'unknown',
      timestamp: new Date(event.timestamp || Date.now()),
      data: event,
    })

    res.json({
      success: true,
      message: 'Webhook processed',
    })
  } catch (error: any) {
    console.error('Error processing HubSpot webhook:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
