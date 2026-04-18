import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Settings, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { organizationService, resolveApiUrl } from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

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
      const response = await organizationService.getAll()
      if (response.data.success && response.data.data.length > 0) {
        setOrganizations(response.data.data)
        setSelectedOrg(response.data.data[0])
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
      const response = await organizationService.uploadLogo(selectedOrg.id, file)

      if (response.data.success) {
        setSuccess('Logo uploaded successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? response.data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(response.data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.data.message || 'Failed to upload logo')
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
      const response = await organizationService.deleteLogo(selectedOrg.id)

      if (response.data.success) {
        setSuccess('Logo deleted successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? response.data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(response.data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.data.message || 'Failed to delete logo')
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
      const response = await organizationService.update(selectedOrg.id, formData)

      if (response.data.success) {
        setSuccess('Organization updated successfully!')
        const updatedOrgs = organizations.map((org) =>
          org.id === selectedOrg.id ? response.data.data : org
        )
        setOrganizations(updatedOrgs)
        setSelectedOrg(response.data.data)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.data.message || 'Failed to update organization')
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
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your organization profile and branding
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-emerald-800 dark:text-emerald-200">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Organizations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrg(org)}
                      className={`w-full text-left px-6 py-3 transition ${
                        selectedOrg?.id === org.id
                          ? 'bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {org.logo_url && (
                          <img
                            src={resolveApiUrl(org.logo_url)}
                            alt={org.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className={`text-sm font-medium ${
                          selectedOrg?.id === org.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {org.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization Details */}
          {selectedOrg && (
            <div className="lg:col-span-3 space-y-6">
              {/* Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization Logo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Logo Preview */}
                    {selectedOrg.logo_url ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={resolveApiUrl(selectedOrg.logo_url)}
                          alt={selectedOrg.name}
                          className="w-32 h-32 rounded-lg object-cover mb-4 border border-border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLogo()}
                          disabled={loading || uploading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 px-6 border-2 border-dashed border-border rounded-lg">
                        <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-foreground font-medium">No logo uploaded</p>
                        <p className="text-sm text-muted-foreground">Upload an image to get started</p>
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
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || loading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Max size: 5MB. Supported formats: JPEG, PNG, WebP, SVG
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSaveOrganization}
                    disabled={loading || uploading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Organization Details'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrganizationSettings
