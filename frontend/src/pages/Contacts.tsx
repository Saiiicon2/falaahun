import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { contactService, projectService, organizationService } from '../services/api'

interface Organization {
  id: string
  name: string
  email?: string
}

interface Project {
  id: string
  name: string
  status: string
}

function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    labels: '',
    leadStatus: 'lead',
    company: '',
    project: ''
  })

  useEffect(() => {
    fetchContacts()
    fetchOrganizations()
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll()
      if (response.data.success && response.data.data) {
        setProjects(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAll()
      if (response.data.success && response.data.data) {
        setOrganizations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await contactService.getAll()
      setContacts(response.data.data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchContacts()
      return
    }
    try {
      const response = await contactService.search(searchQuery)
      setContacts(response.data.data || [])
    } catch (error) {
      console.error('Error searching contacts:', error)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Creating contact with data:', formData)
      const labels = formData.labels.split(',').map(l => l.trim()).filter(l => l)
      const response = await contactService.create({
        ...formData,
        labels,
        leadStatus: formData.leadStatus,
        company: formData.company || undefined,
        project: formData.project || undefined
      })
      console.log('Contact created successfully:', response.data)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', labels: '', leadStatus: 'lead', company: '', project: '' })
      setShowForm(false)
      fetchContacts()
    } catch (error: any) {
      console.error('Error adding contact:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to add contact: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactService.delete(id)
        fetchContacts()
      } catch (error) {
        console.error('Error deleting contact:', error)
      }
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 mt-1">Manage all your contacts and relationships</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">New Contact</h2>
          <form onSubmit={handleAddContact}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Status</label>
                <select
                  value={formData.leadStatus}
                  onChange={(e) => setFormData({ ...formData, leadStatus: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="past_customer">Past Customer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">Select organization (optional)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">Select project (optional)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Labels</label>
              <input
                type="text"
                placeholder="e.g., VIP, Donor, Volunteer (comma-separated)"
                value={formData.labels}
                onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium">
                Save Contact
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-2 rounded-lg hover:from-slate-800 hover:to-slate-900 font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-600 text-center py-12">Loading contacts...</p>
      ) : contacts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Organization</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Project</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Labels</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contacts.map((contact: any) => (
                <tr
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{contact.first_name} {contact.last_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.email || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.organization_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.project_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      contact.lead_status === 'customer' ? 'bg-green-100 text-green-700' :
                      contact.lead_status === 'prospect' ? 'bg-blue-100 text-blue-700' :
                      contact.lead_status === 'past_customer' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {contact.lead_status || 'lead'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.phone || '—'}</td>
                  <td className="px-6 py-4">
                    {contact.labels && contact.labels.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {contact.labels.map((label: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-600 font-medium">No contacts yet</p>
          <p className="text-slate-500 mt-1">Create your first contact to get started managing relationships</p>
        </div>
      )}
    </div>
  )
}

export default Contacts
