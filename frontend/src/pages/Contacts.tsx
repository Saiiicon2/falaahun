import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, X, ChevronDown, Filter, MoreHorizontal } from 'lucide-react'
import { contactService, projectService, organizationService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TableSkeleton } from '@/components/ui/loading-skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'

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

interface FilterState {
  leadStatus: string[]
  labels: string[]
  projectId: string
  dateRange: { start: string; end: string }
  search: string
}

const LEAD_STATUS_OPTIONS = ['lead', 'prospect', 'customer', 'past_customer']
const LABEL_OPTIONS = ['VIP', 'Donor', 'Volunteer', 'Partner', 'Influencer', 'Active', 'Inactive']

const statusConfig: Record<string, { variant: 'success' | 'info' | 'warning' | 'secondary'; label: string }> = {
  customer: { variant: 'success', label: 'Customer' },
  prospect: { variant: 'info', label: 'Prospect' },
  past_customer: { variant: 'secondary', label: 'Past Customer' },
  lead: { variant: 'warning', label: 'Lead' },
}

function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<FilterState>({
    leadStatus: [],
    labels: [],
    projectId: '',
    dateRange: { start: '', end: '' },
    search: ''
  })

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

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.leadStatus.length > 0) count++
    if (filters.labels.length > 0) count++
    if (filters.projectId) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    return count
  }, [filters])

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

  const fetchContacts = async (filterState: FilterState = filters) => {
    try {
      let params: any = {}
      if (filterState.leadStatus.length > 0) params.leadStatus = filterState.leadStatus
      if (filterState.labels.length > 0) params.labels = filterState.labels
      if (filterState.projectId) params.projectId = filterState.projectId
      if (filterState.dateRange.start) params.startDate = filterState.dateRange.start
      if (filterState.dateRange.end) params.endDate = filterState.dateRange.end
      if (filterState.search) params.search = filterState.search

      const response = await contactService.getAll(params)
      const contactsData = response.data.data?.contacts || response.data.data || []
      setContacts(contactsData)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setLoading(true)
    fetchContacts(newFilters)
  }

  const handleToggleLeadStatus = (status: string) => {
    const newStatuses = filters.leadStatus.includes(status)
      ? filters.leadStatus.filter(s => s !== status)
      : [...filters.leadStatus, status]
    handleFilterChange({ ...filters, leadStatus: newStatuses })
  }

  const handleToggleLabel = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label]
    handleFilterChange({ ...filters, labels: newLabels })
  }

  const clearAllFilters = () => {
    handleFilterChange({ leadStatus: [], labels: [], projectId: '', dateRange: { start: '', end: '' }, search: '' })
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const labels = formData.labels.split(',').map(l => l.trim()).filter(l => l)
      await contactService.create({
        ...formData,
        labels,
        leadStatus: formData.leadStatus,
        company: formData.company || undefined,
        project: formData.project || undefined
      })
      setFormData({ firstName: '', lastName: '', email: '', phone: '', labels: '', leadStatus: 'lead', company: '', project: '' })
      setShowForm(false)
      toast({ title: 'Contact created', description: `${formData.firstName} ${formData.lastName} has been added.`, variant: 'success' })
      fetchContacts(filters)
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to add contact', variant: 'destructive' })
    }
  }

  const handleDeleteContact = async () => {
    if (!deleteId) return
    try {
      await contactService.delete(deleteId)
      setDeleteId(null)
      toast({ title: 'Contact deleted', description: 'The contact has been removed.', variant: 'success' })
      fetchContacts(filters)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' })
    }
  }

  const getInitials = (first: string, last: string) => {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage all your contacts and relationships</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-1.5" /> Add Contact
        </Button>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>Fill in the details below to create a new contact.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddContact}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Lead Status</Label>
                <select value={formData.leadStatus} onChange={(e) => setFormData({ ...formData, leadStatus: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="past_customer">Past Customer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <select value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select organization</option>
                  {organizations.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <select value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select project</option>
                  {projects.map((proj) => (<option key={proj.id} value={proj.id}>{proj.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Labels</Label>
                <Input placeholder="VIP, Donor (comma-separated)" value={formData.labels} onChange={(e) => setFormData({ ...formData, labels: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Contact</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>Are you sure you want to delete this contact? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteContact}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search & Filters */}
      <Card className="mb-6 p-4">
        <div className="flex gap-3 mb-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, email, or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="border-t mt-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Lead Status</label>
                <div className="space-y-2">
                  {LEAD_STATUS_OPTIONS.map(status => (
                    <label key={status} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={filters.leadStatus.includes(status)} onChange={() => handleToggleLeadStatus(status)} className="w-4 h-4 rounded border-input text-primary cursor-pointer focus:ring-ring" />
                      <span className="text-sm text-foreground capitalize group-hover:text-primary transition-colors">{status.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Labels</label>
                <div className="space-y-2">
                  {LABEL_OPTIONS.map(label => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={filters.labels.includes(label)} onChange={() => handleToggleLabel(label)} className="w-4 h-4 rounded border-input text-primary cursor-pointer focus:ring-ring" />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Project</label>
                <select value={filters.projectId} onChange={(e) => handleFilterChange({ ...filters, projectId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All Projects</option>
                  {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Date Range</label>
                <div className="space-y-2">
                  <Input type="date" value={filters.dateRange.start} onChange={(e) => handleFilterChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })} />
                  <Input type="date" value={filters.dateRange.end} onChange={(e) => handleFilterChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })} />
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="border-t pt-3">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearAllFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Contacts Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : contacts.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Labels</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contacts.map((contact: any) => {
                  const status = statusConfig[contact.lead_status] || statusConfig.lead
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(contact.first_name, contact.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {contact.first_name} {contact.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{contact.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{contact.organization_name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{contact.phone || '—'}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {contact.labels && contact.labels.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {contact.labels.slice(0, 2).map((label: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px]">{label}</Badge>
                            ))}
                            {contact.labels.length > 2 && (
                              <Badge variant="outline" className="text-[10px]">+{contact.labels.length - 2}</Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>
                              <Edit2 className="w-3.5 h-3.5 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(contact.id)}>
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/30">
            <p className="text-xs text-muted-foreground">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon="contacts"
            title="No contacts found"
            description={activeFilterCount > 0 ? "No contacts match your current filters. Try adjusting or clearing them." : "Create your first contact to start managing relationships."}
            actionLabel={activeFilterCount > 0 ? "Clear Filters" : "Add Contact"}
            onAction={activeFilterCount > 0 ? clearAllFilters : () => setShowForm(true)}
          />
        </Card>
      )}
    </div>
  )
}

export default Contacts
