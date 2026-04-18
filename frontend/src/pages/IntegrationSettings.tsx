import { useState, useEffect } from 'react'
import { integrationService, paymentProfileService } from '../services/api'
import { Settings, CheckCircle, AlertCircle, RefreshCw, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [hubspotKey, setHubspotKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // PayFast donation profile state
  const [pfProfile, setPfProfile] = useState<any>(null)
  const [pfForm, setPfForm] = useState({ merchant_id: '', merchant_key: '', passphrase: '', mode: 'sandbox' as 'sandbox' | 'live', donations_enabled: false })
  const [pfLoading, setPfLoading] = useState(false)
  const [pfSaved, setPfSaved] = useState(false)

  useEffect(() => {
    fetchIntegrationStatus()
    fetchPaymentProfile()
  }, [])

  const fetchPaymentProfile = async () => {
    try {
      const res = await paymentProfileService.get()
      const profile = res.data.data
      setPfProfile(profile)
      if (profile) {
        setPfForm({
          merchant_id: profile.merchant_id || '',
          merchant_key: '',           // never returned from backend
          passphrase: '',             // never returned from backend
          mode: profile.mode || 'sandbox',
          donations_enabled: profile.donations_enabled || false,
        })
      }
    } catch { /* silent */ }
  }

  const savePaymentProfile = async () => {
    if (!pfForm.merchant_id || !pfForm.merchant_key) {
      return
    }
    try {
      setPfLoading(true)
      await paymentProfileService.save(pfForm)
      setPfSaved(true)
      await fetchPaymentProfile()
      setTimeout(() => setPfSaved(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save payment profile')
    } finally {
      setPfLoading(false)
    }
  }

  const fetchIntegrationStatus = async () => {
    try {
      const response = await integrationService.getStatus()
      setIntegrations(response.data.data || [])
    } catch (err: any) {
      setError('Failed to fetch integration status')
    }
  }

  const testHubSpot = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await integrationService.testHubSpot()

      if (response.data.success) {
        setSuccess('✓ HubSpot connection successful!')
        await fetchIntegrationStatus()
      } else {
        setError('Failed to connect to HubSpot. Please check your API key.')
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Integration Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your Falaahun to external platforms like HubSpot for seamless data syncing.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-emerald-800 dark:text-emerald-200">{success}</p>
          </div>
        )}

        {/* HubSpot Integration Card */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">HubSpot CRM</CardTitle>
                <CardDescription className="mt-1">
                  Sync your contacts, deals, and activities to HubSpot
                </CardDescription>
              </div>
              <Badge variant={integrations.find(i => i.integration === 'hubspot')?.connected ? 'success' : 'destructive'}>
                {integrations.find(i => i.integration === 'hubspot')?.connected
                  ? '✓ Connected'
                  : '✗ Disconnected'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* API Key Input */}
            <div className="space-y-2">
              <Label>HubSpot Private App API Key</Label>
              <Input
                type="password"
                value={hubspotKey}
                onChange={(e) => setHubspotKey(e.target.value)}
                placeholder="Enter your HubSpot API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from HubSpot Settings → Integrations → Private apps.
              </p>
            </div>

            {/* Feature List */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Synced Data</h3>
              <ul className="space-y-2">
                {[
                  'Contacts → HubSpot Contacts',
                  'Pledges → HubSpot Deals',
                  'Activities → HubSpot Tasks',
                  'Real-time sync capability',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Configuration Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">Configuration Guide</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Go to HubSpot and create a Private App</li>
                <li>Give it these scopes: CRM contacts, deals, tasks</li>
                <li>Copy the API key and paste it above</li>
                <li>Click "Test Connection" to verify</li>
                <li>Once connected, data syncs automatically</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={testHubSpot}
                disabled={!hubspotKey || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {/* Last Sync Info */}
            {integrations.find(i => i.integration === 'hubspot')?.lastSync && (
              <p className="text-xs text-muted-foreground pt-2">
                Last synced: {new Date(
                  integrations.find(i => i.integration === 'hubspot')?.lastSync
                ).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Manual Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Sync</CardTitle>
            <CardDescription>
              Manually sync specific contacts, pledges, or activities to HubSpot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                Sync Contact
              </Button>
              <Button variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                Sync Pledge
              </Button>
              <Button variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                Sync Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PayFast Donation Gateway */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <CardTitle className="text-xl">Donation Payment Gateway</CardTitle>
                  <CardDescription className="mt-0.5">Connect your own PayFast merchant account to receive donations directly.</CardDescription>
                </div>
              </div>
              <Badge variant={pfProfile?.donations_enabled ? 'success' : 'secondary'}>
                {pfProfile?.donations_enabled ? '✓ Enabled' : 'Not configured'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merchant ID</Label>
                <Input
                  type="text"
                  value={pfForm.merchant_id}
                  onChange={(e) => setPfForm({ ...pfForm, merchant_id: e.target.value })}
                  placeholder="10000100"
                />
              </div>
              <div className="space-y-2">
                <Label>Merchant Key</Label>
                <Input
                  type="password"
                  value={pfForm.merchant_key}
                  onChange={(e) => setPfForm({ ...pfForm, merchant_key: e.target.value })}
                  placeholder={pfProfile ? '(stored securely, enter to update)' : 'Your merchant key'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passphrase (optional)</Label>
                <Input
                  type="password"
                  value={pfForm.passphrase}
                  onChange={(e) => setPfForm({ ...pfForm, passphrase: e.target.value })}
                  placeholder="Only if set in PayFast"
                />
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <select
                  value={pfForm.mode}
                  onChange={(e) => setPfForm({ ...pfForm, mode: e.target.value as 'sandbox' | 'live' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="live">Live</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="donations_enabled"
                type="checkbox"
                checked={pfForm.donations_enabled}
                onChange={(e) => setPfForm({ ...pfForm, donations_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-input text-primary"
              />
              <Label htmlFor="donations_enabled" className="font-normal">Enable donation payments for this organisation</Label>
            </div>
            <div className="pt-2">
              <Button
                onClick={savePaymentProfile}
                disabled={pfLoading || !pfForm.merchant_id || !pfForm.merchant_key}
              >
                {pfLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {pfSaved ? 'Saved!' : 'Save Gateway Credentials'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Credentials are stored encrypted per organisation and are never shared with other accounts.
              Get your merchant ID &amp; key from your PayFast dashboard → Integration → Merchant Details.
            </p>
          </CardContent>
        </Card>

        {/* Status Panel */}
        {integrations.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <Card
                key={integration.integration}
                className={integration.connected
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground capitalize">
                        {integration.integration}
                      </h4>
                      <Badge variant={integration.connected ? 'success' : 'destructive'} className="mt-1">
                        {integration.connected ? '✓ Connected' : '✗ Not Connected'}
                      </Badge>
                    </div>
                  </div>
                  {integration.error && (
                    <p className="text-xs text-red-700 dark:text-red-400 mt-2">{integration.error}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegrationSettings
