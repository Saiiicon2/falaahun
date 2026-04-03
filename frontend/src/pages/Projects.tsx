import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronUp, X } from 'lucide-react'
import { projectService, contactService, pledgeService } from '../services/api'

interface Project {
  id: string
  name: string
  description?: string
  budget: number
  raised: number
  status: string
  occurrence?: string // 'one-time' or 'monthly'
  created_at: string
}

interface PipelineStage {
  id: string
  name: string
  target_amount?: number
  position: number
}

interface Deal {
  id: string
  title: string
  amount: number
  stage_id: string
  contact_id?: string
  status: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  lead_status?: string
}

interface ProjectContacts {
  [projectId: string]: Contact[]
}

interface PledgeStats {
  total_pledges: number
  total_amount: number
  total_received: number
  total_pending: number
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [_selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    occurrence: 'one-time'
  })
  
  const [projectStages, setProjectStages] = useState<Record<string, PipelineStage[]>>({})
  const [projectDeals, setProjectDeals] = useState<Record<string, Deal[]>>({})
  const [showStageForm, setShowStageForm] = useState<string | null>(null)
  const [stageFormData, setStageFormData] = useState({ name: '', target_amount: '' })
  const [showDealForm, setShowDealForm] = useState<{ projectId: string; stageId: string } | null>(null)
  const [dealFormData, setDealFormData] = useState({ title: '', amount: '', contact_id: '' })
  const [projectContacts, setProjectContacts] = useState<ProjectContacts>({})
  const [projectPledgeStats, setProjectPledgeStats] = useState<Record<string, PledgeStats>>({})

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll()
      const projectsData = response.data.data || []
      setProjects(projectsData)
      
      // Fetch contacts for each project
      projectsData.forEach((project: Project) => {
        fetchProjectContacts(project.id)
        fetchProjectPledgeStats(project.id)
      })
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectPledgeStats = async (projectId: string) => {
    try {
      const response = await pledgeService.getStats(projectId)
      if (response.data.success && response.data.data) {
        setProjectPledgeStats((prev) => ({
          ...prev,
          [projectId]: {
            total_pledges: Number(response.data.data.total_pledges || 0),
            total_amount: Number(response.data.data.total_amount || 0),
            total_received: Number(response.data.data.total_received || 0),
            total_pending: Number(response.data.data.total_pending || 0),
          },
        }))
      }
    } catch (error) {
      console.error('Error fetching pledge stats:', error)
    }
  }

  const fetchProjectContacts = async (projectId: string) => {
    try {
      const response = await contactService.getAll()
      if (response.data.success && response.data.data) {
        // Filter contacts that belong to this project
        const allContacts = response.data.data.contacts || response.data.data
        const linkedContacts = allContacts.filter((contact: any) => contact.project_id === projectId)
        setProjectContacts(prev => ({
          ...prev,
          [projectId]: linkedContacts
        }))
      }
    } catch (error) {
      console.error('Error fetching project contacts:', error)
    }
  }

  const fetchProjectStages = async (projectId: string) => {
    try {
      const response = await projectService.getStages(projectId)
      const stages = response.data.data || []
      setProjectStages(prev => ({ ...prev, [projectId]: stages }))
    } catch (error) {
      console.error('Error fetching stages:', error)
    }
  }

  const fetchProjectDeals = async (projectId: string) => {
    try {
      const response = await projectService.getDeals(projectId)
      const deals = response.data.data || []
      setProjectDeals(prev => ({ ...prev, [projectId]: deals }))
    } catch (error) {
      console.error('Error fetching deals:', error)
    }
  }

  const handleAddStage = async (projectId: string) => {
    if (!stageFormData.name.trim()) return
    try {
      await projectService.addStage(projectId, {
        name: stageFormData.name,
        target_amount: parseFloat(stageFormData.target_amount) || 0,
      })
      setStageFormData({ name: '', target_amount: '' })
      setShowStageForm(null)
      fetchProjectStages(projectId)
    } catch (error) {
      console.error('Error adding stage:', error)
    }
  }

  const handleAddDeal = async () => {
    if (!showDealForm || !dealFormData.title.trim()) return
    try {
      await projectService.createDeal(showDealForm.projectId, {
        title: dealFormData.title,
        amount: parseFloat(dealFormData.amount) || 0,
        stage_id: showDealForm.stageId,
        contact_id: dealFormData.contact_id || undefined,
      })
      setDealFormData({ title: '', amount: '', contact_id: '' })
      setShowDealForm(null)
      fetchProjectDeals(showDealForm.projectId)
    } catch (error) {
      console.error('Error adding deal:', error)
    }
  }

  const handleMoveDeal = async (dealId: string, newStageId: string, projectId: string) => {
    try {
      await projectService.updateDeal(dealId, { stage_id: newStageId })
      fetchProjectDeals(projectId)
    } catch (error) {
      console.error('Error moving deal:', error)
    }
  }

  const handleDeleteDeal = async (dealId: string, projectId: string) => {
    try {
      await projectService.deleteDeal(dealId)
      fetchProjectDeals(projectId)
    } catch (error) {
      console.error('Error deleting deal:', error)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await projectService.create({
        name: formData.name,
        description: formData.description,
        budget: parseFloat(formData.budget) || 0,
        occurrence: formData.occurrence
      })
      setFormData({ name: '', description: '', budget: '', occurrence: 'one-time' })
      setShowForm(false)
      fetchProjects()
    } catch (error) {
      console.error('Error adding project:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.delete(id)
        fetchProjects()
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
    const newExpanded = expandedProject === project.id ? null : project.id
    setExpandedProject(newExpanded)
    if (newExpanded) {
      fetchProjectStages(project.id)
      fetchProjectDeals(project.id)
      fetchProjectContacts(project.id)
    }
  }

  const getProgressPercentage = (raised: number, budget: number) => {
    if (!budget || budget === 0) return 0
    return Math.min((raised / budget) * 100, 100)
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects & Deals</h1>
          <p className="text-slate-500 mt-1">Manage fundraising projects and pipeline stages</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Project</h2>
          <form onSubmit={handleAddProject}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., Destination Dawah"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Occurrence Type</label>
                <select
                  value={formData.occurrence}
                  onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400"
                >
                  <option value="one-time">One Time Deal</option>
                  <option value="monthly">Monthly Recurring</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                placeholder="Project description and goals"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400 h-24"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Budget</label>
              <input
                type="number"
                placeholder="Total amount to raise"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium"
              >
                Create Project
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

      {loading ? (
        <p className="text-slate-600 text-center py-12">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => {
            const progress = getProgressPercentage(project.raised || 0, project.budget)
            return (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div 
                  onClick={() => handleProjectSelect(project)}
                  className="p-6 cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                          {project.occurrence === 'monthly' ? 'Monthly Recurring' : 'One Time'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedProject === project.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Funding Progress</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        ${(project.raised || 0).toLocaleString()} / ${(project.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{progress.toFixed(1)}% funded</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProject === project.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium">Status</p>
                        <p className="text-sm font-bold text-slate-900 mt-2 capitalize">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {project.status}
                          </span>
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium">Remaining</p>
                        <p className="text-sm font-bold text-slate-900 mt-2">
                          ${((project.budget || 0) - (project.raised || 0)).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium">Created</p>
                        <p className="text-sm font-bold text-slate-900 mt-2">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Pipeline Kanban Board */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-900">Pipeline & Deals</h4>
                        <button
                          onClick={() => setShowStageForm(showStageForm === project.id ? null : project.id)}
                          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add Stage
                        </button>
                      </div>

                      {showStageForm === project.id && (
                        <div className="p-4 bg-emerald-50 border-b border-slate-200">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-700 mb-1">Stage Name</label>
                              <input
                                type="text"
                                placeholder="e.g., Initial Contact"
                                value={stageFormData.name}
                                onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div className="w-40">
                              <label className="block text-xs font-medium text-slate-700 mb-1">Target Amount</label>
                              <input
                                type="number"
                                placeholder="Optional"
                                value={stageFormData.target_amount}
                                onChange={(e) => setStageFormData({ ...stageFormData, target_amount: e.target.value })}
                                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <button
                              onClick={() => handleAddStage(project.id)}
                              className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setShowStageForm(null)}
                              className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-sm hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!projectStages[project.id] || projectStages[project.id].length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                          No stages yet. Add your first pipeline stage above.
                        </div>
                      ) : (
                        <div className="p-4 overflow-x-auto">
                          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                            {[...(projectStages[project.id] || [])].sort((a, b) => a.position - b.position).map((stage) => {
                              const stageDeals = (projectDeals[project.id] || []).filter(d => d.stage_id === stage.id)
                              return (
                                <div key={stage.id} className="w-60 flex-shrink-0">
                                  <div className="bg-slate-100 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-800">{stage.name}</p>
                                        {stage.target_amount ? (
                                          <p className="text-xs text-slate-500">Target: ${Number(stage.target_amount).toLocaleString()}</p>
                                        ) : null}
                                      </div>
                                      <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                                        {stageDeals.length}
                                      </span>
                                    </div>

                                    <div className="space-y-2 min-h-[40px]">
                                      {stageDeals.map((deal) => (
                                        <div key={deal.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                          <div className="flex items-start justify-between gap-1">
                                            <p className="text-sm font-medium text-slate-900 leading-tight">{deal.title}</p>
                                            <button
                                              onClick={() => handleDeleteDeal(deal.id, project.id)}
                                              className="text-slate-400 hover:text-red-500 flex-shrink-0"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <p className="text-sm font-semibold text-emerald-700 mt-1">${Number(deal.amount).toLocaleString()}</p>
                                          <select
                                            value={deal.stage_id}
                                            onChange={(e) => handleMoveDeal(deal.id, e.target.value, project.id)}
                                            className="mt-2 w-full text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600 bg-slate-50 focus:outline-none focus:border-emerald-400"
                                          >
                                            {(projectStages[project.id] || []).map(s => (
                                              <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ))}
                                    </div>

                                    {showDealForm?.stageId === stage.id && showDealForm?.projectId === project.id ? (
                                      <div className="mt-2 bg-white rounded-lg p-3 border border-emerald-300">
                                        <input
                                          type="text"
                                          placeholder="Deal title"
                                          value={dealFormData.title}
                                          onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400 mb-2"
                                        />
                                        <input
                                          type="number"
                                          placeholder="Amount ($)"
                                          value={dealFormData.amount}
                                          onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })}
                                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400 mb-2"
                                        />
                                        <select
                                          value={dealFormData.contact_id}
                                          onChange={(e) => setDealFormData({ ...dealFormData, contact_id: e.target.value })}
                                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400 mb-2"
                                        >
                                          <option value="">No contact linked</option>
                                          {(projectContacts[project.id] || []).map(c => (
                                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                          ))}
                                        </select>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={handleAddDeal}
                                            className="flex-1 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                                          >
                                            Add Deal
                                          </button>
                                          <button
                                            onClick={() => setShowDealForm(null)}
                                            className="px-2 py-1.5 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setDealFormData({ title: '', amount: '', contact_id: '' })
                                          setShowDealForm({ projectId: project.id, stageId: stage.id })
                                        }}
                                        className="mt-2 w-full flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 py-1.5 rounded hover:bg-white transition"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add deal
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Linked Contacts */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Project Contacts ({projectContacts[project.id]?.length || 0})</h4>
                      {projectContacts[project.id] && projectContacts[project.id].length > 0 ? (
                        <div className="space-y-2">
                          {projectContacts[project.id].map((contact: Contact) => (
                            <div key={contact.id} className="flex items-start justify-between p-3 bg-slate-50 rounded border border-slate-100">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  {contact.first_name} {contact.last_name}
                                </p>
                                {contact.email && (
                                  <p className="text-xs text-slate-500 mt-1">{contact.email}</p>
                                )}
                              </div>
                              <div className="text-right">
                                {contact.lead_status && (
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    contact.lead_status === 'customer' ? 'bg-green-100 text-green-700' :
                                    contact.lead_status === 'prospect' ? 'bg-blue-100 text-blue-700' :
                                    contact.lead_status === 'past_customer' ? 'bg-gray-100 text-gray-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {contact.lead_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No contacts linked to this project yet. Assign contacts from the Contacts page.</p>
                      )}
                    </div>

                    {/* Pledges Summary */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Pledges & Donations</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded p-3">
                          <p className="text-xs text-slate-500">Total Pledges</p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {projectPledgeStats[project.id]?.total_pledges || 0}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded p-3">
                          <p className="text-xs text-slate-500">Received</p>
                          <p className="text-lg font-semibold text-emerald-700 mt-1">
                            ${(projectPledgeStats[project.id]?.total_received || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded p-3">
                          <p className="text-xs text-slate-500">Pending</p>
                          <p className="text-lg font-semibold text-amber-700 mt-1">
                            ${(projectPledgeStats[project.id]?.total_pending || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">No projects yet</p>
          <p className="text-slate-500 mt-1">Create your first project like "Destination Dawah" to get started with fundraising</p>
        </div>
      )}
    </div>
  )
}

export default Projects
