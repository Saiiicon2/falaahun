import { useState, useEffect } from 'react'
import { Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [hubspotKey, setHubspotKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchIntegrationStatus()
  }, [])

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/integrations/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      setIntegrations(data.data || [])
    } catch (err: any) {
      setError('Failed to fetch integration status')
    }
  }

  const testHubSpot = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('http://localhost:3000/integrations/hubspot/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json()

      if (data.success) {
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

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  const getStatusBadgeColor = (connected: boolean) => {
    return connected
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900">Integration Settings</h1>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Connect your Falaahun to external platforms like HubSpot for seamless data syncing.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* HubSpot Integration Card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">HubSpot CRM</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Sync your contacts, deals, and activities to HubSpot
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  integrations.find(i => i.integration === 'hubspot')?.connected
                    ? getStatusBadgeColor(true)
                    : getStatusBadgeColor(false)
                }`}>
                  {integrations.find(i => i.integration === 'hubspot')?.connected
                    ? '✓ Connected'
                    : '✗ Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                HubSpot Private App API Key
              </label>
              <input
                type="password"
                value={hubspotKey}
                onChange={(e) => setHubspotKey(e.target.value)}
                placeholder="Enter your HubSpot API key"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
              />
              <p className="text-xs text-slate-500 mt-2">
                Get your API key from HubSpot Settings → Integrations → Private apps.
              </p>
            </div>

            {/* Feature List */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Synced Data</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700">Contacts → HubSpot Contacts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700">Pledges → HubSpot Deals</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700">Activities → HubSpot Tasks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700">Real-time sync capability</span>
                </li>
              </ul>
            </div>

            {/* Configuration Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Configuration Guide</h4>
              <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                <li>Go to HubSpot and create a Private App</li>
                <li>Give it these scopes: CRM contacts, deals, tasks</li>
                <li>Copy the API key and paste it above</li>
                <li>Click "Test Connection" to verify</li>
                <li>Once connected, data syncs automatically</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={testHubSpot}
                disabled={!hubspotKey || loading}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Last Sync Info */}
            {integrations.find(i => i.integration === 'hubspot')?.lastSync && (
              <div className="text-xs text-slate-500 pt-2">
                Last synced: {new Date(
                  integrations.find(i => i.integration === 'hubspot')?.lastSync
                ).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Manual Sync Section */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Manual Sync</h3>
          <p className="text-slate-600 mb-4">
            Manually sync specific contacts, pledges, or activities to HubSpot.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <button className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm font-medium">
              Sync Contact
            </button>
            <button className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 text-sm font-medium">
              Sync Pledge
            </button>
            <button className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 text-sm font-medium">
              Sync Activity
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.integration}
              className={`rounded-lg border p-4 ${getStatusColor(integration.connected)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 capitalize">
                    {integration.integration}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    integration.connected
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {integration.connected ? '✓ Connected' : '✗ Not Connected'}
                  </p>
                </div>
              </div>
              {integration.error && (
                <p className="text-xs text-red-700 mt-2">{integration.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IntegrationSettings
