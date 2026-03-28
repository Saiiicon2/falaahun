import { Request, Response } from 'express'
import Stripe from 'stripe'
import pool from '../db/connection'

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

    const orgResult = await pool.query(
      'SELECT id, name, email, stripe_customer_id FROM organizations WHERE id = $1',
      [organizationId]
    )

    const subscriptionResult = await pool.query(
      `SELECT *
       FROM organization_subscriptions
       WHERE organization_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [organizationId]
    )

    res.json({
      success: true,
      data: {
        organization: orgResult.rows[0] || null,
        subscription: subscriptionResult.rows[0] || null,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    const { priceId, successUrl, cancelUrl } = req.body

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    if (!priceId) {
      return res.status(400).json({ success: false, error: 'priceId is required' })
    }

    const stripe = getStripe()
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' })
    }

    const organization = await getOrganizationById(organizationId)
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' })
    }

    let customerId: string = organization.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        email: organization.email || undefined,
        metadata: { organizationId },
      })
      customerId = customer.id
      await updateOrganizationCustomer(organizationId, customerId)
    }

    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${baseUrl}/billing?checkout=success`,
      cancel_url: cancelUrl || `${baseUrl}/billing?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        organizationId,
      },
      subscription_data: {
        metadata: {
          organizationId,
        },
      },
    })

    res.json({ success: true, data: { url: session.url, id: session.id } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const createPortalSession = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId
    const { returnUrl } = req.body

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const stripe = getStripe()
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' })
    }

    const organization = await getOrganizationById(organizationId)
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' })
    }

    if (!organization.stripe_customer_id) {
      return res.status(400).json({ success: false, error: 'No Stripe customer found. Start a subscription first.' })
    }

    const baseUrl = getBaseUrl()
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: returnUrl || `${baseUrl}/billing`,
    })

    res.json({ success: true, data: { url: session.url } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(500).send('Stripe is not configured')
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send('Webhook secret is not configured')
    }

    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      return res.status(400).send('Missing stripe-signature header')
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const metadataOrganizationId = subscription.metadata?.organizationId || session.metadata?.organizationId

          if (metadataOrganizationId) {
            await upsertSubscriptionFromStripe(
              metadataOrganizationId,
              typeof session.customer === 'string' ? session.customer : null,
              subscription
            )
          }
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const metadataOrganizationId = subscription.metadata?.organizationId

        if (metadataOrganizationId) {
          await upsertSubscriptionFromStripe(
            metadataOrganizationId,
            typeof subscription.customer === 'string' ? subscription.customer : null,
            subscription
          )
        }
        break
      }
      case 'invoice.payment_failed':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubscriptionId =
          typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : null

        if (stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
          const metadataOrganizationId = subscription.metadata?.organizationId
          if (metadataOrganizationId) {
            await upsertSubscriptionFromStripe(
              metadataOrganizationId,
              typeof subscription.customer === 'string' ? subscription.customer : null,
              subscription
            )
          }
        }
        break
      }
      default:
        break
    }

    return res.json({ received: true })
  } catch (error: any) {
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }
}
