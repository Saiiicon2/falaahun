import { Request, Response } from 'express'
import Stripe from 'stripe'
import pool from '../db/connection'
import {
  buildCheckoutParams,
  verifyItn,
  PAYFAST_SANDBOX_URL,
  PAYFAST_LIVE_URL,
} from '../services/payfast'

// Default to sandbox unless PAYFAST_SANDBOX is explicitly set to 'false'.
// This prevents accidental live transactions when env vars are missing.
const isSandbox = () => process.env.PAYFAST_SANDBOX !== 'false'

const PLANS: Record<string, { label: string; amount: string }> = {
  starter: {
    label:  'Falaahun CRM – Starter',
    amount: process.env.PAYFAST_PLAN_STARTER_AMOUNT || '350.00',
  },
  pro: {
    label:  'Falaahun CRM – Pro',
    amount: process.env.PAYFAST_PLAN_PRO_AMOUNT || '900.00',
  },
  team: {
    label:  'Falaahun CRM – Team',
    amount: process.env.PAYFAST_PLAN_TEAM_AMOUNT || '1800.00',
  },
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const getStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    return null
  }

  return new Stripe(STRIPE_SECRET_KEY)
}

const getBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:5173'

const getOrganizationById = async (organizationId: string) => {
  const result = await pool.query(
    'SELECT id, name, email, stripe_customer_id FROM organizations WHERE id = $1',
    [organizationId]
  )
  return result.rows[0] || null
}

const updateOrganizationCustomer = async (organizationId: string, customerId: string) => {
  await pool.query(
    'UPDATE organizations SET stripe_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [customerId, organizationId]
  )
}

const upsertSubscriptionFromStripe = async (
  organizationId: string,
  providerCustomerId: string | null,
  subscription: Stripe.Subscription
) => {
  const line = subscription.items.data[0]
  const priceId = line?.price?.id || null
  const currentPeriodStart = (line as any)?.current_period_start || null
  const currentPeriodEnd = (line as any)?.current_period_end || null

  await pool.query(
    `INSERT INTO organization_subscriptions (
       organization_id,
       provider,
       provider_customer_id,
       provider_subscription_id,
       plan_key,
       status,
       current_period_start,
       current_period_end,
       cancel_at_period_end,
       canceled_at,
       trial_end,
       metadata,
       created_at,
       updated_at
     )
     VALUES (
       $1,
       'stripe',
       $2,
       $3,
       $4,
       $5,
       to_timestamp($6),
       to_timestamp($7),
       $8,
       CASE WHEN $9 IS NULL THEN NULL ELSE to_timestamp($9) END,
       CASE WHEN $10 IS NULL THEN NULL ELSE to_timestamp($10) END,
       $11,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
     )
     ON CONFLICT (provider_subscription_id)
     DO UPDATE SET
       organization_id = EXCLUDED.organization_id,
       provider_customer_id = EXCLUDED.provider_customer_id,
       plan_key = EXCLUDED.plan_key,
       status = EXCLUDED.status,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       canceled_at = EXCLUDED.canceled_at,
       trial_end = EXCLUDED.trial_end,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP`,
    [
      organizationId,
      providerCustomerId,
      subscription.id,
      priceId,
      subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      subscription.cancel_at_period_end,
      subscription.canceled_at,
      subscription.trial_end,
      JSON.stringify(subscription.metadata || {}),
    ]
  )
}

export const getBillingStatus = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const [orgResult, subResult] = await Promise.all([
      pool.query(
        'SELECT id, name, email, billing_email FROM organizations WHERE id = $1',
        [organizationId]
      ),
      pool.query(
        `SELECT plan_key, status, current_period_end, cancel_at_period_end, subscription_token
         FROM organization_subscriptions
         WHERE organization_id = $1
         ORDER BY updated_at DESC
         LIMIT 1`,
        [organizationId]
      ),
    ])

    res.json({
      success: true,
      data: {
        organization: orgResult.rows[0] || null,
        subscription: subResult.rows[0] || null,
        plans: Object.entries(PLANS).map(([key, cfg]) => ({
          key,
          label:    cfg.label,
          amount:   cfg.amount,
          currency: 'ZAR',
        })),
        sandbox: isSandbox(),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createPayfastCheckout = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    const { planKey, successUrl, cancelUrl } = req.body

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const plan = PLANS[planKey as string]
    if (!plan) {
      return res.status(400).json({ success: false, error: `Unknown plan: ${planKey}` })
    }

    const merchantId  = process.env.PAYFAST_MERCHANT_ID
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY
    if (!merchantId || !merchantKey) {
      return res.status(500).json({
        success: false,
        error: 'PayFast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.',
      })
    }

    const orgResult = await pool.query(
      'SELECT id, name, email, billing_email FROM organizations WHERE id = $1',
      [organizationId]
    )
    const org = orgResult.rows[0]
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' })
    }

    const baseUrl    = process.env.CLIENT_URL || 'http://localhost:5173'
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`
    const notifyUrl  = process.env.PAYFAST_NOTIFY_URL || `${backendUrl}/billing/payfast/itn`
    const mPaymentId = `${organizationId}_${planKey}_${Date.now()}`

    const fields = buildCheckoutParams({
      merchantId,
      merchantKey,
      passphrase:  process.env.PAYFAST_PASSPHRASE || undefined,
      returnUrl:   successUrl || `${baseUrl}/billing?checkout=success`,
      cancelUrl:   cancelUrl  || `${baseUrl}/billing?checkout=cancel`,
      notifyUrl,
      nameFirst:   org.name || 'Organization',
      nameLast:    ' ',
      email:       org.billing_email || org.email || 'billing@falaahun.org',
      mPaymentId,
      amount:      plan.amount,
      itemName:    plan.label,
      isRecurring: true,
    })

    res.json({
      success: true,
      data: {
        checkoutUrl: isSandbox() ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL,
        fields,
        sandbox: isSandbox(),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// ---------------------------------------------------------------------------
// POST /billing/payfast/itn  (PayFast sends this, not the browser)
// Must respond 200 immediately; verification+processing is async.
// ---------------------------------------------------------------------------

export const handlePayfastItn = async (req: Request, res: Response) => {
  res.status(200).send('OK')

  try {
    const body: Record<string, string> = req.body
    const sandbox = isSandbox()

    // 1  Verify with PayFast
    const valid = await verifyItn(body, sandbox)
    if (!valid) {
      console.warn('[PayFast ITN] Verification failed', body)
      return
    }

    // 2  Only process completed payments
    if (body.payment_status !== 'COMPLETE') {
      console.log('[PayFast ITN] Non-complete status:', body.payment_status)
      return
    }

    // 3  Decode m_payment_id → organizationId + planKey
    //    Format: {uuid}_{planKey}_{timestamp}  (UUID uses hyphens only, safe split on _)
    const parts          = (body.m_payment_id || '').split('_')
    const organizationId = parts[0]
    const planKey        = parts[1]

    if (!organizationId || !planKey) {
      console.warn('[PayFast ITN] Cannot parse m_payment_id:', body.m_payment_id)
      return
    }

    // 4  Idempotency – skip if already processed
    const pfPaymentId = body.pf_payment_id
    if (pfPaymentId) {
      const insert = await pool.query(
        `INSERT INTO webhook_events
           (id, organization_id, provider, event_type, provider_reference, payload_json, processed)
         VALUES (gen_random_uuid(), $1, 'payfast', 'subscription_payment', $2, $3, true)
         ON CONFLICT (provider, provider_reference) DO NOTHING`,
        [organizationId, pfPaymentId, JSON.stringify(body)]
      )
      if (insert.rowCount === 0) {
        console.log('[PayFast ITN] Already processed, skipping:', pfPaymentId)
        return
      }
    }

    // 5  Upsert subscription
    const token          = body.token || null
    const subscriptionId = token || `pf_${pfPaymentId || Date.now()}`

    await pool.query(
      `INSERT INTO organization_subscriptions
         (id, organization_id, provider, provider_subscription_id,
          plan_key, status, subscription_token, metadata, created_at, updated_at)
       VALUES
         (gen_random_uuid(), $1, 'payfast', $2, $3, 'active', $4, $5,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (provider_subscription_id) DO UPDATE SET
         status             = 'active',
         plan_key           = EXCLUDED.plan_key,
         subscription_token = EXCLUDED.subscription_token,
         metadata           = EXCLUDED.metadata,
         updated_at         = CURRENT_TIMESTAMP`,
      [organizationId, subscriptionId, planKey, token, JSON.stringify(body)]
    )

    console.log(`[PayFast ITN] ✅ Subscription activated: org=${organizationId} plan=${planKey}`)
  } catch (error: any) {
    console.error('[PayFast ITN] Handler error:', error.message)
  }
}

// ---------------------------------------------------------------------------
// POST /billing/payfast/cancel-itn  (subscription cancellation notifications)
// ---------------------------------------------------------------------------

export const handlePayfastCancelItn = async (req: Request, res: Response) => {
  res.status(200).send('OK')
  try {
    const token = req.body?.token
    if (!token) return
    await pool.query(
      `UPDATE organization_subscriptions
       SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
       WHERE subscription_token = $1`,
      [token]
    )
    console.log('[PayFast Cancel ITN] Subscription canceled, token:', token)
  } catch (error: any) {
    console.error('[PayFast Cancel ITN] Error:', error.message)
  }
}
