import { Request, Response, NextFunction } from 'express'
import pool from '../db/connection'

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.BILLING_BYPASS === 'true' || process.env.NODE_ENV === 'test') {
      return next()
    }

    const organizationId = req.user?.organizationId

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization context is required',
      })
    }

    const result = await pool.query(
      `SELECT status, plan_key, current_period_end
       FROM organization_subscriptions
       WHERE organization_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [organizationId]
    )

    const subscription = result.rows[0]

    if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required to access this feature',
        code: 'subscription_required',
        data: {
          billingPath: '/billing',
          subscriptionStatus: subscription?.status || 'none',
        },
      })
    }

    return next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
