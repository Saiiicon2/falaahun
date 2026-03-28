import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { contactService, pledgeService, projectService } from '../services/api'

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
      alert('Select a contact and enter a valid amount.')
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
    } catch (error: any) {
      console.error('Error creating pledge:', error)
      alert(error.response?.data?.error || 'Failed to create pledge')
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingPledge) return

    const amount = Number(editForm.amount)
    if (!editForm.contactId || Number.isNaN(amount) || amount <= 0) {
      alert('Select a contact and enter a valid amount.')
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
    } catch (error: any) {
      console.error('Error updating pledge:', error)
      alert(error.response?.data?.error || 'Failed to update pledge')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: PledgeStatus) => {
    try {
      await pledgeService.update(id, { status })
      setPledges((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update pledge status')
    }
  }

  const removePledge = async (id: string) => {
    if (!window.confirm('Delete this pledge permanently?')) return

    try {
      await pledgeService.delete(id)
      setPledges((prev) => prev.filter((row) => row.id !== id))
    } catch (error) {
      console.error('Error deleting pledge:', error)
      alert('Failed to delete pledge')
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
          <select
            value={form.contactId}
            onChange={(e) => setForm((prev) => ({ ...prev, contactId: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
            required
          >
            <option value="">Select contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
          <input
            type="text"
            value={form.currency}
            onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
            maxLength={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as PledgeType }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="donation">Donation</option>
            <option value="pledge">Pledge</option>
            <option value="zakat">Zakat</option>
            <option value="sadaqah">Sadaqah</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as PledgeStatus }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
          <input
            type="text"
            value={form.paymentMethod}
            onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
            placeholder="cash, bank, card"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expected Date</label>
          <input
            type="date"
            value={form.expectedDate}
            onChange={(e) => setForm((prev) => ({ ...prev, expectedDate: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Received Date</label>
          <input
            type="date"
            value={form.receivedDate}
            onChange={(e) => setForm((prev) => ({ ...prev, receivedDate: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
          <input
            type="text"
            value={form.transactionId}
            onChange={(e) => setForm((prev) => ({ ...prev, transactionId: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 resize-none"
          rows={3}
          placeholder="Add any notes about this pledge"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 text-slate-700 px-5 py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading pledges...</div>
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pledges</h1>
          <p className="text-slate-500 mt-1">Track donations, pledges, and fulfillment status.</p>
        </div>

        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Pledge
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Filtered Count</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{totals.count}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Total Amount</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Received</p>
          <p className="text-2xl font-semibold text-emerald-700 mt-2">{formatCurrency(totals.received)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-semibold text-amber-700 mt-2">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      {showCreate ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Pledge</h2>
          {renderPledgeForm(createForm, setCreateForm, submitCreate, 'Create Pledge', () => {
            setShowCreate(false)
            setCreateForm(defaultForm)
          })}
        </div>
      ) : null}

      {editingPledge ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Pledge</h2>
          {renderPledgeForm(editForm, setEditForm, submitEdit, 'Update Pledge', () => {
            setEditingPledge(null)
            setEditForm(defaultForm)
          })}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2"
            placeholder="Search by contact, notes, amount"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PledgeStatus)}
            className="border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | PledgeType)}
            className="border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="donation">Donation</option>
            <option value="pledge">Pledge</option>
            <option value="zakat">Zakat</option>
            <option value="sadaqah">Sadaqah</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Contacts</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredPledges.length === 0 ? (
          <p className="text-center py-10 text-slate-500">No pledges match the current filters.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Expected</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPledges.map((pledge) => {
                const contact = contactById.get(pledge.contact_id)
                const project = contact?.project_id ? projectById.get(contact.project_id) : undefined

                return (
                  <tr key={pledge.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown contact'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{project?.name || 'Unlinked'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {formatCurrency(pledge.amount, pledge.currency || 'USD')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">{pledge.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={pledge.status}
                        onChange={(e) => void updateStatus(pledge.id, e.target.value as PledgeStatus)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="received">Received</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pledge.expected_date ? new Date(pledge.expected_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(pledge.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(pledge)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void removePledge(pledge.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Pledges
