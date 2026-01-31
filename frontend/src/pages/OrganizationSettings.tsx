import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Settings, AlertCircle, CheckCircle } from 'lucide-react'

interface Organization {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  description?: string
  logo_url?: string
}

function OrganizationSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      setFormData({
        name: selectedOrg.name || '',
        email: selectedOrg.email || '',
        phone: selectedOrg.phone || '',
        address: selectedOrg.address || '',
        website: selectedOrg.website || '',
        description: selectedOrg.description || '',
      })
    }
  }, [selectedOrg])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/organizations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setOrganizations(data.data)
        setSelectedOrg(data.data[0])
      }
    } catch (err: any) {
      setError('Failed to fetch organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!selectedOrg) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formDataObj = new FormData()
    formDataObj.append('logo', file)

    try {
      const response = await fetch(
        `http://localhost:3000/organizations/${selectedOrg.id}/logo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formDataObj,
        }
      )

      const data = await response.json()

      if (data.success) {
        setSuccess('Logo uploaded successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to upload logo')
      }
    } catch (err: any) {
      setError('Error uploading logo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!selectedOrg) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `http://localhost:3000/organizations/${selectedOrg.id}/logo`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      const data = await response.json()

      if (data.success) {
        setSuccess('Logo deleted successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to delete logo')
      }
    } catch (err: any) {
      setError('Error deleting logo')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveOrganization = async () => {
    if (!selectedOrg) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `http://localhost:3000/organizations/${selectedOrg.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (data.success) {
        setSuccess('Organization updated successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to update organization')
      }
    } catch (err: any) {
      setError('Error updating organization')
    } finally {
      setLoading(false)
    }
  }

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Manage your organization profile and branding
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Messages */}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Organizations</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`w-full text-left px-6 py-3 transition ${
                      selectedOrg?.id === org.id
                        ? 'bg-emerald-50 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {org.logo_url && (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className={`text-sm font-medium ${
                        selectedOrg?.id === org.id ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {org.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Organization Details */}
          {selectedOrg && (
            <div className="lg:col-span-3 space-y-6">
              {/* Logo Section */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900">Organization Logo</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Logo Preview */}
                    {selectedOrg.logo_url ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={selectedOrg.logo_url}
                          alt={selectedOrg.name}
                          className="w-32 h-32 rounded-lg object-cover mb-4 border border-slate-200"
                        />
                        <button
                          onClick={() => handleDeleteLogo()}
                          disabled={loading || uploading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Logo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 px-6 border-2 border-dashed border-slate-300 rounded-lg">
                        <Upload className="w-12 h-12 text-slate-400 mb-2" />
                        <p className="text-slate-600 font-medium">No logo uploaded</p>
                        <p className="text-sm text-slate-500">Upload an image to get started</p>
                      </div>
                    )}

                    {/* Upload Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleLogoUpload(e.target.files[0])
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition font-medium"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </>
                      )}
                    </button>
                    <p className="text-xs text-slate-500">
                      Max size: 5MB. Supported formats: JPEG, PNG, WebP, SVG
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900">Organization Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSaveOrganization}
                    disabled={loading || uploading}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition font-medium"
                  >
                    {loading ? 'Saving...' : 'Save Organization Details'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrganizationSettings
