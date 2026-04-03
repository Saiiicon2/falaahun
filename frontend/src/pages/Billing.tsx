import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { billingService } from '../services/api'

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
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          </div>
          <p className="text-sm text-slate-600 mt-2">Manage your subscription and payment settings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {isSandbox && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Sandbox mode:</strong> Payments go to PayFast sandbox. Use test credentials to complete checkout. Set <code>PAYFAST_SANDBOX=false</code> on the backend to go live.
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-emerald-800">{success}</p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading billing status...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Organisation</p>
                <p className="text-slate-900 font-semibold">{statusData.organization?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Plan</p>
                <p className="text-slate-900 font-semibold">{activePlan}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-slate-900 font-semibold capitalize">{subscription?.status || 'not started'}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose a Plan</h2>
          <p className="text-sm text-slate-500 mb-4">All prices in ZAR (South African Rand). Billed monthly via PayFast.</p>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="text-slate-500 text-sm">No plans available. Check backend configuration.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.key} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
                <p className="text-sm uppercase tracking-wide text-slate-500 font-medium">{plan.key}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">R{plan.amount}<span className="text-base font-normal text-slate-500">/mo</span></p>
                <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => startCheckout(plan.key)}
                  disabled={redirecting}
                  className="mt-6 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {redirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Subscribe via PayFast
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Billing
