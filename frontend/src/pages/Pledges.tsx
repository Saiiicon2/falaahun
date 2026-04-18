import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, RotateCcw, DollarSign } from 'lucide-react'
import { contactService, pledgeService, projectService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableSkeleton } from '@/components/ui/loading-skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'

type PledgeStatus = 'pending' | 'received' | 'failed'
type PledgeType = 'donation' | 'pledge' | 'zakat' | 'sadaqah'

interface ContactOption {
  id: string
  first_name: string
  last_name: string
  project_id?: string
}

interface ProjectOption {
  id: string
  name: string
}

interface PledgeRow {
  id: string
  contact_id: string
  amount: number
  type: PledgeType
  status: PledgeStatus
  currency?: string
  payment_method?: string
  transaction_id?: string
  expected_date?: string
  received_date?: string
  notes?: string
  created_at: string
}

interface PledgeForm {
  contactId: string
  amount: string
  currency: string
  type: PledgeType
  status: PledgeStatus
  paymentMethod: string
  transactionId: string
  expectedDate: string
  receivedDate: string
  notes: string
}

const defaultForm: PledgeForm = {
  contactId: '',
  amount: '',
  currency: 'USD',
  type: 'donation',
  status: 'pending',
  paymentMethod: '',
  transactionId: '',
  expectedDate: '',
  receivedDate: '',
  notes: '',
}

function Pledges() {
  const { toast } = useToast()
  const [pledges, setPledges] = useState<PledgeRow[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<PledgeForm>(defaultForm)

  const [editingPledge, setEditingPledge] = useState<PledgeRow | null>(null)
  const [editForm, setEditForm] = useState<PledgeForm>(defaultForm)

  const [statusFilter, setStatusFilter] = useState<'all' | PledgeStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | PledgeType>('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [contactFilter, setContactFilter] = useState('all')
  const [search, setSearch] = useState('')

  const contactById = useMemo(() => {
    const map = new Map<string, ContactOption>()
    contacts.forEach((contact) => map.set(contact.id, contact))
    return map
  }, [contacts])

  const projectById = useMemo(() => {
    const map = new Map<string, ProjectOption>()
    projects.forEach((project) => map.set(project.id, project))
    return map
  }, [projects])

  const filteredPledges = useMemo(() => {
    const query = search.trim().toLowerCase()

    return pledges.filter((pledge) => {
      const contact = contactById.get(pledge.contact_id)
      const fullName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim().toLowerCase()
      const projectId = contact?.project_id || ''
      const notes = (pledge.notes || '').toLowerCase()

      if (statusFilter !== 'all' && pledge.status !== statusFilter) return false
      if (typeFilter !== 'all' && pledge.type !== typeFilter) return false
      if (contactFilter !== 'all' && pledge.contact_id !== contactFilter) return false
      if (projectFilter !== 'all' && projectId !== projectFilter) return false

      if (!query) return true

      const amountText = String(pledge.amount || '')
      return (
        fullName.includes(query) ||
        notes.includes(query) ||
        pledge.type.toLowerCase().includes(query) ||
        pledge.status.toLowerCase().includes(query) ||
        amountText.includes(query)
      )
    })
  }, [pledges, contactById, statusFilter, typeFilter, contactFilter, projectFilter, search])

  const totals = useMemo(() => {
    return filteredPledges.reduce(
      (acc, row) => {
        acc.count += 1
        acc.total += Number(row.amount || 0)
        if (row.status === 'received') acc.received += Number(row.amount || 0)
        if (row.status === 'pending') acc.pending += Number(row.amount || 0)
        return acc
      },
      { count: 0, total: 0, received: 0, pending: 0 }
    )
  }, [filteredPledges])

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pledgesRes, contactsRes, projectsRes] = await Promise.all([
        pledgeService.getAll({ limit: 500 }),
        contactService.getAll(500),
        projectService.getAll(500),
      ])

      setPledges(pledgesRes.data.data || [])
      setContacts(contactsRes.data.data || [])
      setProjects(projectsRes.data.data || [])
    } catch (error) {
      console.error('Error loading pledge data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setProjectFilter('all')
    setContactFilter('all')
    setSearch('')
  }

  const formatCurrency = (value: number | string, currency = 'USD') => {
    const parsed = Number(value) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parsed)
  }

  const startEdit = (pledge: PledgeRow) => {
    setEditingPledge(pledge)
    setEditForm({
      contactId: pledge.contact_id,
      amount: String(pledge.amount || ''),
      currency: pledge.currency || 'USD',
      type: pledge.type || 'donation',
      status: pledge.status || 'pending',
      paymentMethod: pledge.payment_method || '',
      transactionId: pledge.transaction_id || '',
      expectedDate: pledge.expected_date ? pledge.expected_date.slice(0, 10) : '',
      receivedDate: pledge.received_date ? pledge.received_date.slice(0, 10) : '',
      notes: pledge.notes || '',
    })
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number(createForm.amount)
    if (!createForm.contactId || Number.isNaN(amount) || amount <= 0) {
      toast({ title: 'Select a contact and enter a valid amount', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      await pledgeService.create({
        contactId: createForm.contactId,
        amount,
        currency: createForm.currency,
        type: createForm.type,
        status: createForm.status,
        paymentMethod: createForm.paymentMethod || undefined,
        transactionId: createForm.transactionId || undefined,
        expectedDate: createForm.expectedDate || undefined,
        receivedDate: createForm.receivedDate || undefined,
        notes: createForm.notes || undefined,
      })

      setCreateForm(defaultForm)
      setShowCreate(false)
      await loadData()
      toast({ title: 'Pledge created', variant: 'success' })
    } catch (error: any) {
      console.error('Error creating pledge:', error)
      toast({ title: error.response?.data?.error || 'Failed to create pledge', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingPledge) return

    const amount = Number(editForm.amount)
    if (!editForm.contactId || Number.isNaN(amount) || amount <= 0) {
      toast({ title: 'Select a contact and enter a valid amount', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      await pledgeService.update(editingPledge.id, {
        contactId: editForm.contactId,
        amount,
        currency: editForm.currency,
        type: editForm.type,
        status: editForm.status,
        paymentMethod: editForm.paymentMethod || undefined,
        transactionId: editForm.transactionId || undefined,
        expectedDate: editForm.expectedDate || undefined,
        receivedDate: editForm.receivedDate || undefined,
        notes: editForm.notes || undefined,
      })

      setEditingPledge(null)
      setEditForm(defaultForm)
      await loadData()
      toast({ title: 'Pledge updated', variant: 'success' })
    } catch (error: any) {
      console.error('Error updating pledge:', error)
      toast({ title: error.response?.data?.error || 'Failed to update pledge', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: PledgeStatus) => {
    try {
      await pledgeService.update(id, { status })
      setPledges((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)))
      toast({ title: 'Status updated', variant: 'success' })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({ title: 'Failed to update status', variant: 'destructive' })
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const removePledge = async (id: string) => {
    try {
      await pledgeService.delete(id)
      setPledges((prev) => prev.filter((row) => row.id !== id))
      setDeleteTarget(null)
      toast({ title: 'Pledge deleted', variant: 'success' })
    } catch (error) {
      console.error('Error deleting pledge:', error)
      toast({ title: 'Failed to delete pledge', variant: 'destructive' })
    }
  }

  const renderPledgeForm = (
    form: PledgeForm,
    setForm: React.Dispatch<React.SetStateAction<PledgeForm>>,
    onSubmit: (e: React.FormEvent) => Promise<void>,
    submitLabel: string,
    onCancel?: () => void
  ) => (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact</Label>
          <select value={form.contactId} onChange={(e) => setForm((prev) => ({ ...prev, contactId: e.target.value }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" required>
            <option value="">Select contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} required />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input type="text" value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} maxLength={3} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as PledgeType }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
            <option value="donation">Donation</option>
            <option value="pledge">Pledge</option>
            <option value="zakat">Zakat</option>
            <option value="sadaqah">Sadaqah</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as PledgeStatus }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Input type="text" value={form.paymentMethod} onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} placeholder="cash, bank, card" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Expected Date</Label>
          <Input type="date" value={form.expectedDate} onChange={(e) => setForm((prev) => ({ ...prev, expectedDate: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Received Date</Label>
          <Input type="date" value={form.receivedDate} onChange={(e) => setForm((prev) => ({ ...prev, receivedDate: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Transaction ID</Label>
          <Input type="text" value={form.transactionId} onChange={(e) => setForm((prev) => ({ ...prev, transactionId: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Add any notes about this pledge" />
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  )

  if (loading) {
    return <div className="flex-1 p-6 bg-background"><TableSkeleton /></div>
  }

  return (
    <div className="flex-1 p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pledges</h1>
          <p className="text-muted-foreground text-sm mt-1">Track donations, pledges, and fulfillment status</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Pledge
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Filtered Count', value: totals.count, color: 'text-foreground' },
          { label: 'Total Amount', value: formatCurrency(totals.total), color: 'text-foreground' },
          { label: 'Received', value: formatCurrency(totals.received), color: 'text-emerald-600' },
          { label: 'Pending', value: formatCurrency(totals.pending), color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Pledge</DialogTitle></DialogHeader>
          {renderPledgeForm(createForm, setCreateForm, submitCreate, 'Create Pledge', () => { setShowCreate(false); setCreateForm(defaultForm) })}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPledge} onOpenChange={() => { setEditingPledge(null); setEditForm(defaultForm) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Pledge</DialogTitle></DialogHeader>
          {renderPledgeForm(editForm, setEditForm, submitEdit, 'Update Pledge', () => { setEditingPledge(null); setEditForm(defaultForm) })}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Pledge</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this pledge?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && removePledge(deleteTarget)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by contact, notes, amount" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | PledgeStatus)} className="bg-background border border-input rounded-md px-3 py-2 text-sm">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="failed">Failed</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | PledgeType)} className="bg-background border border-input rounded-md px-3 py-2 text-sm">
              <option value="all">All Types</option>
              <option value="donation">Donation</option>
              <option value="pledge">Pledge</option>
              <option value="zakat">Zakat</option>
              <option value="sadaqah">Sadaqah</option>
            </select>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="bg-background border border-input rounded-md px-3 py-2 text-sm">
              <option value="all">All Projects</option>
              {projects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
            </select>
            <select value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="bg-background border border-input rounded-md px-3 py-2 text-sm">
              <option value="all">All Contacts</option>
              {contacts.map((contact) => (<option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name}</option>))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-3 gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {filteredPledges.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={DollarSign} title="No pledges found" description="No pledges match the current filters" />
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {['Contact', 'Project', 'Amount', 'Type', 'Status', 'Expected', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPledges.map((pledge) => {
                  const contact = contactById.get(pledge.contact_id)
                  const project = contact?.project_id ? projectById.get(contact.project_id) : undefined

                  return (
                    <tr key={pledge.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{project?.name || 'Unlinked'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {formatCurrency(pledge.amount, pledge.currency || 'USD')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize text-xs">{pledge.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pledge.status}
                          onChange={(e) => void updateStatus(pledge.id, e.target.value as PledgeStatus)}
                          className="bg-background border border-input rounded-md px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="received">Received</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {pledge.expected_date ? new Date(pledge.expected_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(pledge.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(pledge)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(pledge.id)} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Pledges
