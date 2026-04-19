import { Request, Response } from 'express'
import Stripe from 'stripe'
import pool from '../db/connection'
import {
  buildCheckoutParams,
  verifyItn,
  PAYFAST_SANDBOX_URL,
  PAYFAST_LIVE_URL,
} from '../services/payfast'
import { notificationModel } from '../models/notification'

// Default to sandbox unless PAYFAST_SANDBOX is explicitly set to 'false'.
// This prevents accidental live transactions when env vars are missing.
const isSandbox = () => process.env.PAYFAST_SANDBOX !== 'false'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'zar').toLowerCase()

const getStripeMode = () => {
  if (!STRIPE_SECRET_KEY) return 'disabled'
  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) return 'sandbox'
  if (STRIPE_SECRET_KEY.startsWith('sk_live_')) return 'live'
  return process.env.STRIPE_SANDBOX !== 'false' ? 'sandbox' : 'live'
}

const getStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    return null
  }

  return new Stripe(STRIPE_SECRET_KEY)
}

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

const getBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:5173'

const getOrganizationById = async (organizationId: string) => {
  const result = await pool.query(
    'SELECT id, name, email, billing_email, stripe_customer_id FROM organizations WHERE id = $1',
    [organizationId]
  )
  return result.rows[0] || null
}

const createNotification = async (
  organizationId: string,
  type: string,
  message: string,
  referenceId?: string,
  payload?: Record<string, unknown>
) => {
  await notificationModel.create({
    organization_id: organizationId,
    type,
    message,
    reference_id: referenceId,
    payload_json: payload || {},
    read: false,
  })
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
  subscription: Stripe.Subscription,
  planKey?: string
) => {
  const line = subscription.items.data[0]
  const priceId = line?.price?.id || null
  const currentPeriodStart = (line as any)?.current_period_start || null
  const currentPeriodEnd = (line as any)?.current_period_end || null
  const resolvedPlanKey =
    planKey ||
    (subscription.metadata?.planKey as string) ||
    (line?.price?.product as Stripe.Product)?.name ||
    priceId ||
    'stripe'

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
      resolvedPlanKey,
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

const createStripeCustomerIfNeeded = async (stripe: Stripe, organizationId: string, org: any) => {
  if (org.stripe_customer_id) {
    return org.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email: org.email || org.billing_email || 'billing@falaahun.org',
    name: org.name,
    metadata: { organizationId },
  })

  await updateOrganizationCustomer(organizationId, customer.id)
  return customer.id
}

const processStripeSubscription = async (
  stripe: Stripe,
  organizationId: string,
  subscriptionId: string,
  planKey?: string
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null

  if (!customerId) return

  await updateOrganizationCustomer(organizationId, customerId)
  await upsertSubscriptionFromStripe(organizationId, customerId, subscription, planKey)
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
          currency: 'USD',
        })),
        sandbox: getStripeMode() === 'sandbox' || isSandbox(),
        stripeEnabled: !!STRIPE_SECRET_KEY,
        stripeMode: getStripeMode(),
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

export const createStripeCheckout = async (req: Request, res: Response) => {
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

    const stripe = getStripe()
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' })
    }

    const orgResult = await pool.query(
      'SELECT id, name, email, billing_email, stripe_customer_id FROM organizations WHERE id = $1',
      [organizationId]
    )
    const org = orgResult.rows[0]
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' })
    }

    const customerId = await createStripeCustomerIfNeeded(stripe, organizationId, org)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: {
              name: plan.label,
              metadata: { planKey },
            },
            recurring: { interval: 'month' },
            unit_amount: Math.round(Number(plan.amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing?checkout=success`,
      cancel_url:
        cancelUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing?checkout=cancel`,
      metadata: {
        organizationId,
        planKey,
      },
    })

    res.json({
      success: true,
      data: {
        url: session.url,
        sandbox: getStripeMode() === 'sandbox',
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const stripe = getStripe()
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, error: 'Stripe webhook is not configured.' })
    }

    const rawBody = (req as any).rawBody as Buffer | undefined
    const signature = req.headers['stripe-signature'] as string | undefined
    if (!rawBody || !signature) {
      return res.status(400).json({ success: false, error: 'Missing webhook payload or signature' })
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)

    await pool.query(
      `INSERT INTO webhook_events
         (id, organization_id, provider, event_type, provider_reference, payload_json, processed)
       VALUES (gen_random_uuid(), NULL, 'stripe', $1, $2, $3, true)
       ON CONFLICT (provider, provider_reference) DO NOTHING`,
      [event.type, event.id, JSON.stringify(event)]
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organizationId as string | undefined
      const planKey = session.metadata?.planKey as string | undefined
      const subscriptionId = session.subscription as string | undefined

      if (organizationId && subscriptionId) {
        await processStripeSubscription(stripe, organizationId, subscriptionId, planKey)
        console.log(`[Stripe Webhook] checkout.session.completed processed: org=${organizationId}`)
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

      if (customerId) {
        const orgResult = await pool.query(
          'SELECT id FROM organizations WHERE stripe_customer_id = $1',
          [customerId]
        )
        const organizationId = orgResult.rows[0]?.id
        if (organizationId) {
          const message = `Stripe payment failed for subscription ${subscriptionId || 'unknown'}; donor payment stopped or requires action.`
          await createNotification(organizationId, 'payment_failed', message, subscriptionId || undefined, {
            event: event.type,
            invoice_id: invoice.id,
            subscription_id: subscriptionId,
          })
          console.log(`[Stripe Webhook] invoice.payment_failed: org=${organizationId}`)
        }
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
      if (customerId) {
        const orgResult = await pool.query(
          'SELECT id FROM organizations WHERE stripe_customer_id = $1',
          [customerId]
        )
        const organizationId = orgResult.rows[0]?.id
        if (organizationId) {
          await upsertSubscriptionFromStripe(
            organizationId,
            customerId,
            subscription,
            subscription.metadata?.planKey as string | undefined
          )

          if (event.type === 'customer.subscription.deleted') {
            await createNotification(
              organizationId,
              'subscription_canceled',
              `Stripe subscription ${subscription.id} was canceled. Donor payment has stopped.`,
              subscription.id,
              { event: event.type }
            )
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            await createNotification(
              organizationId,
              'subscription_past_due',
              `Stripe subscription ${subscription.id} is ${subscription.status}. Donor payment is delayed or failed.`,
              subscription.id,
              { status: subscription.status, event: event.type }
            )
          }

          console.log(`[Stripe Webhook] subscription updated: org=${organizationId}`)
        }
      }
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error.message)
    res.status(400).json({ success: false, error: error.message })
  }
}

// ---------------------------------------------------------------------------
// POST /billing/dev-subscribe  (sandbox-only: instantly activate a plan)
// ---------------------------------------------------------------------------

export const devSubscribe = async (req: Request, res: Response) => {
  if (!isSandbox()) {
    return res.status(403).json({ success: false, error: 'Only available in sandbox mode' })
  }
  try {
    const organizationId = req.user?.organizationId
    const { planKey } = req.body
    if (!organizationId) return res.status(400).json({ success: false, error: 'No org context' })
    if (!PLANS[planKey as string]) return res.status(400).json({ success: false, error: `Unknown plan: ${planKey}` })

    const subscriptionId = `dev_${organizationId}_${planKey}`
    await pool.query(
      `INSERT INTO organization_subscriptions
         (id, organization_id, provider, provider_subscription_id,
          plan_key, status, metadata, created_at, updated_at)
       VALUES
         (gen_random_uuid(), $1, 'payfast', $2, $3, 'active', '{}',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (provider_subscription_id) DO UPDATE SET
         status     = 'active',
         plan_key   = EXCLUDED.plan_key,
         updated_at = CURRENT_TIMESTAMP`,
      [organizationId, subscriptionId, planKey]
    )
    console.log(`[DevSubscribe] ✅ Sandbox subscription activated: org=${organizationId} plan=${planKey}`)
    res.json({ success: true, data: { planKey, status: 'active' } })
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
