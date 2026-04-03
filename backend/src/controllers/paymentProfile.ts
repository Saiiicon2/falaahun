import { Request, Response } from 'express'
import pool from '../db/connection'

// ---------------------------------------------------------------------------
// GET /payment-profiles
// Returns the logged-in org's donation payment gateway profile (if any)
// ---------------------------------------------------------------------------

export const getPaymentProfile = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context required' })
    }

    const result = await pool.query(
      `SELECT id, provider, mode, merchant_id, donations_enabled, created_at, updated_at
       FROM organization_payment_profiles
       WHERE organization_id = $1
       LIMIT 1`,
      [organizationId]
    )

    // Never return merchant_key or passphrase to the frontend
    res.json({ success: true, data: result.rows[0] || null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// ---------------------------------------------------------------------------
// PUT /payment-profiles
// Save or update the org's PayFast donation credentials
// ---------------------------------------------------------------------------

export const upsertPaymentProfile = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context required' })
    }

    const { merchant_id, merchant_key, passphrase, mode, donations_enabled } = req.body

    if (!merchant_id || !merchant_key) {
      return res.status(400).json({ success: false, error: 'merchant_id and merchant_key are required' })
    }

    // Validate mode
    const safeMode = mode === 'live' ? 'live' : 'sandbox'

    await pool.query(
      `INSERT INTO organization_payment_profiles
         (id, organization_id, provider, mode, merchant_id, merchant_key, passphrase, donations_enabled, created_at, updated_at)
       VALUES
         (gen_random_uuid(), $1, 'payfast', $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (organization_id, provider) DO UPDATE SET
         mode               = EXCLUDED.mode,
         merchant_id        = EXCLUDED.merchant_id,
         merchant_key       = EXCLUDED.merchant_key,
         passphrase         = EXCLUDED.passphrase,
         donations_enabled  = EXCLUDED.donations_enabled,
         updated_at         = CURRENT_TIMESTAMP`,
      [organizationId, safeMode, merchant_id, merchant_key, passphrase || null, donations_enabled === true]
    )

    res.json({ success: true, message: 'Payment profile saved' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// ---------------------------------------------------------------------------
// DELETE /payment-profiles
// Remove the org's payment profile
// ---------------------------------------------------------------------------

export const deletePaymentProfile = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context required' })
    }

    await pool.query(
      `DELETE FROM organization_payment_profiles
       WHERE organization_id = $1 AND provider = 'payfast'`,
      [organizationId]
    )

    res.json({ success: true, message: 'Payment profile removed' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
