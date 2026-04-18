import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { billingService } from '../services/api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Plan = {
  key: string
  label: string
  amount: string
  currency: string
  description: string
  features: string[]
}

type BillingStatus = {
  organization?: { id: string; name: string; email?: string }
  subscription?: {
    plan_key?: string
    status?: string
    current_period_end?: string
    cancel_at_period_end?: boolean
  }
  plans?: Plan[]
  sandbox?: boolean
}

// Descriptions & features keyed by plan key
const PLAN_META: Record<string, { description: string; features: string[] }> = {
  starter: {
    description: 'Everything you need to manage your contacts and donor relationships.',
    features: [
      'Full contacts management with filtering & labels',
      'Activity & pledge timeline per contact',
      'Call logging & team comments',
      'Scheduled meetings & task reminders',
      'Basic analytics dashboard',
    ],
  },
  pro: {
    description: 'Fundraising pipelines, financial reports, and third-party integrations.',
    features: [
      'Everything in Starter',
      'Fundraising project management',
      'Pipeline stages & deal tracking',
      'Financial reports & activity charts',
      'HubSpot manual sync',
    ],
  },
  team: {
    description: 'Collaborate across your organisation with shared access and role controls.',
    features: [
      'Everything in Pro',
      'Multiple team members per organisation',
      'Owner / Admin / Member roles',
      'Activity attribution (who did what)',
      'Priority support',
    ],
  },
}

function Billing() {
  const [loading, setLoading]       = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [statusData, setStatusData] = useState<BillingStatus>({})
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const loadStatus = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await billingService.getStatus()
      if (response.data.success) {
        setStatusData(response.data.data || {})
      } else {
        setError('Failed to load billing status')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load billing status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'premium') {
      setError('This is a premium feature. Upgrade your plan to unlock it.')
    }
    if (params.get('checkout') === 'success') {
      setSuccess('Payment successful! Your subscription is being activated — this may take a moment.')
    }
    if (params.get('checkout') === 'cancel') {
      setError('Checkout was cancelled. No charges were made.')
    }
  }, [])

  /**
   * Start PayFast checkout: get form fields from backend, build a hidden form,
   * and submit it to the PayFast checkout URL. PayFast requires a POST.
   */
  const startCheckout = async (planKey: string) => {
    try {
      setRedirecting(true)
      setError('')

      // In sandbox mode, bypass PayFast and activate directly
      if (isSandbox) {
        await billingService.devSubscribe(planKey)
        setSuccess(`Sandbox: "${planKey}" plan activated instantly. Refresh to see your subscription.`)
        setRedirecting(false)
        await loadStatus()
        return
      }

      const response = await billingService.createPayfastCheckout(
        planKey,
        `${window.location.origin}/billing?checkout=success`,
        `${window.location.origin}/billing?checkout=cancel`
      )
      const { checkoutUrl, fields } = response.data.data
      if (!checkoutUrl || !fields) throw new Error('Invalid checkout response from server')

      // Build and auto-submit a hidden form (PayFast requires POST)
      const form = document.createElement('form')
      form.method  = 'POST'
      form.action  = checkoutUrl
      form.style.display = 'none'
      Object.entries(fields as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type  = 'hidden'
        input.name  = name
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to start checkout')
      setRedirecting(false)
    }
  }

  const plans: (Plan & { description: string; features: string[] })[] = (
    statusData.plans || []
  ).map((p) => ({
    ...p,
    ...(PLAN_META[p.key] || { description: '', features: [] }),
  }))

  const subscription = statusData.subscription
  const activePlan   = subscription?.plan_key || 'No active plan'
  const isSandbox    = statusData.sandbox

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Manage your subscription and payment settings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {isSandbox && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <strong>Sandbox mode:</strong> Payments go to PayFast sandbox. Use test credentials to complete checkout. Set <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded text-xs">PAYFAST_SANDBOX=false</code> on the backend to go live.
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-emerald-800 dark:text-emerald-200">{success}</p>
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organisation</p>
                  <p className="text-foreground font-semibold">{statusData.organization?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-foreground font-semibold">{activePlan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={subscription?.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                    {subscription?.status || 'not started'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Choose a Plan</h2>
          <p className="text-sm text-muted-foreground mb-4">All prices in ZAR (South African Rand). Billed monthly via PayFast.</p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">No plans available. Check backend configuration.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <Card key={plan.key} className={idx === 1 ? 'border-primary shadow-md ring-1 ring-primary/20' : ''}>
                <CardHeader>
                  <CardDescription className="uppercase tracking-wide font-medium">{plan.key}</CardDescription>
                  <CardTitle className="text-3xl">
                    R{plan.amount}<span className="text-base font-normal text-muted-foreground">/mo</span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => startCheckout(plan.key)}
                    disabled={redirecting}
                    className="w-full"
                    variant={idx === 1 ? 'default' : 'outline'}
                  >
                    {redirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Subscribe via PayFast
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Billing
