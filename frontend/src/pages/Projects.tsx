import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronUp, X, Layers, Users, DollarSign } from 'lucide-react'
import { projectService, contactService, pledgeService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableSkeleton } from '@/components/ui/loading-skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
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
      toast({ title: 'Project created', variant: 'success' })
    } catch (error) {
      console.error('Error adding project:', error)
      toast({ title: 'Failed to create project', variant: 'destructive' })
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await projectService.delete(id)
      setShowDeleteDialog(null)
      fetchProjects()
      toast({ title: 'Project deleted', variant: 'success' })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({ title: 'Failed to delete project', variant: 'destructive' })
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
    <div className="flex-1 p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects & Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage fundraising projects and pipeline stages</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input placeholder="e.g., Destination Dawah" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Occurrence Type</Label>
                <select value={formData.occurrence} onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                  <option value="one-time">One Time Deal</option>
                  <option value="monthly">Monthly Recurring</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Project description and goals" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Target Budget</Label>
              <Input type="number" placeholder="Total amount to raise" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will permanently delete this project and all its stages and deals.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteDialog && handleDeleteProject(showDeleteDialog)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <TableSkeleton />
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => {
            const progress = getProgressPercentage(project.raised || 0, project.budget)
            return (
              <Card key={project.id} className="overflow-hidden">
                {/* Header */}
                <div onClick={() => handleProjectSelect(project)} className="p-6 cursor-pointer hover:bg-muted/30 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                        <Badge variant={project.occurrence === 'monthly' ? 'info' : 'secondary'}>
                          {project.occurrence === 'monthly' ? 'Monthly Recurring' : 'One Time'}
                        </Badge>
                      </div>
                      {project.description && <p className="text-sm text-muted-foreground mt-1.5">{project.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(project.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedProject === project.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Funding Progress</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        ${(project.raised || 0).toLocaleString()} / ${(project.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% funded</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProject === project.id && (
                  <div className="border-t bg-muted/30 p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Status</p>
                          <Badge variant={project.status === 'active' ? 'success' : 'secondary'} className="mt-2 capitalize">{project.status}</Badge>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Remaining</p>
                          <p className="text-lg font-bold text-foreground mt-1">${((project.budget || 0) - (project.raised || 0)).toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Created</p>
                          <p className="text-sm font-semibold text-foreground mt-2">{new Date(project.created_at).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Pipeline Kanban */}
                    <Card>
                      <CardHeader className="pb-3 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Pipeline & Deals</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowStageForm(showStageForm === project.id ? null : project.id)} className="gap-1 text-emerald-600 hover:text-emerald-700">
                          <Plus className="w-3.5 h-3.5" /> Add Stage
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {showStageForm === project.id && (
                          <div className="p-4 bg-muted/50 rounded-lg border mb-4 flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Stage Name</Label>
                              <Input placeholder="e.g., Initial Contact" value={stageFormData.name} onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })} className="h-8 text-sm" />
                            </div>
                            <div className="w-36 space-y-1">
                              <Label className="text-xs">Target Amount</Label>
                              <Input type="number" placeholder="Optional" value={stageFormData.target_amount} onChange={(e) => setStageFormData({ ...stageFormData, target_amount: e.target.value })} className="h-8 text-sm" />
                            </div>
                            <Button size="sm" onClick={() => handleAddStage(project.id)} className="h-8">Add</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowStageForm(null)} className="h-8">Cancel</Button>
                          </div>
                        )}

                        {!projectStages[project.id] || projectStages[project.id].length === 0 ? (
                          <EmptyState icon={Layers} title="No stages yet" description="Add your first pipeline stage above." />
                        ) : (
                          <div className="overflow-x-auto -mx-2">
                            <div className="flex gap-3 px-2" style={{ minWidth: 'max-content' }}>
                              {[...(projectStages[project.id] || [])].sort((a, b) => a.position - b.position).map((stage) => {
                                const stageDeals = (projectDeals[project.id] || []).filter(d => d.stage_id === stage.id)
                                return (
                                  <div key={stage.id} className="w-56 flex-shrink-0">
                                    <div className="bg-muted/50 rounded-lg p-3 border">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <p className="text-sm font-semibold text-foreground">{stage.name}</p>
                                          {stage.target_amount ? <p className="text-xs text-muted-foreground">Target: ${Number(stage.target_amount).toLocaleString()}</p> : null}
                                        </div>
                                        <Badge variant="outline" className="text-xs">{stageDeals.length}</Badge>
                                      </div>

                                      <div className="space-y-2 min-h-[40px]">
                                        {stageDeals.map((deal) => (
                                          <Card key={deal.id} className="shadow-sm">
                                            <CardContent className="p-3">
                                              <div className="flex items-start justify-between gap-1">
                                                <p className="text-sm font-medium text-foreground leading-tight">{deal.title}</p>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDeal(deal.id, project.id)}>
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <p className="text-sm font-semibold text-emerald-600 mt-1">${Number(deal.amount).toLocaleString()}</p>
                                              <select value={deal.stage_id} onChange={(e) => handleMoveDeal(deal.id, e.target.value, project.id)} className="mt-2 w-full text-xs border border-input rounded px-1.5 py-1 text-muted-foreground bg-background">
                                                {(projectStages[project.id] || []).map(s => (
                                                  <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                              </select>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>

                                      {showDealForm?.stageId === stage.id && showDealForm?.projectId === project.id ? (
                                        <Card className="mt-2 border-emerald-200">
                                          <CardContent className="p-3 space-y-2">
                                            <Input placeholder="Deal title" value={dealFormData.title} onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })} className="h-8 text-sm" />
                                            <Input type="number" placeholder="Amount ($)" value={dealFormData.amount} onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })} className="h-8 text-sm" />
                                            <select value={dealFormData.contact_id} onChange={(e) => setDealFormData({ ...dealFormData, contact_id: e.target.value })} className="w-full border border-input rounded px-2 py-1.5 text-sm bg-background">
                                              <option value="">No contact linked</option>
                                              {(projectContacts[project.id] || []).map(c => (
                                                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                              ))}
                                            </select>
                                            <div className="flex gap-2">
                                              <Button size="sm" onClick={handleAddDeal} className="flex-1 h-7 text-xs">Add Deal</Button>
                                              <Button size="sm" variant="outline" onClick={() => setShowDealForm(null)} className="h-7 text-xs">Cancel</Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ) : (
                                        <Button variant="ghost" size="sm" onClick={() => { setDealFormData({ title: '', amount: '', contact_id: '' }); setShowDealForm({ projectId: project.id, stageId: stage.id }) }} className="mt-2 w-full h-7 text-xs text-muted-foreground gap-1">
                                          <Plus className="w-3 h-3" /> Add deal
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Linked Contacts */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4" /> Project Contacts ({projectContacts[project.id]?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {projectContacts[project.id] && projectContacts[project.id].length > 0 ? (
                          <div className="space-y-2">
                            {projectContacts[project.id].map((contact: Contact) => (
                              <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{contact.first_name} {contact.last_name}</p>
                                  {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                                </div>
                                {contact.lead_status && (
                                  <Badge variant={contact.lead_status === 'customer' ? 'success' : contact.lead_status === 'prospect' ? 'info' : 'secondary'} className="capitalize text-xs">
                                    {contact.lead_status}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">No contacts linked. Assign contacts from the Contacts page.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pledge Stats */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" /> Pledges & Donations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Pledges</p>
                            <p className="text-lg font-bold text-foreground mt-1">{projectPledgeStats[project.id]?.total_pledges || 0}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Received</p>
                            <p className="text-lg font-bold text-emerald-600 mt-1">${(projectPledgeStats[project.id]?.total_received || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-lg font-bold text-amber-600 mt-1">${(projectPledgeStats[project.id]?.total_pending || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12">
          <EmptyState icon={TrendingUp} title="No projects yet" description='Create your first project like "Destination Dawah" to get started with fundraising' action={{ label: 'New Project', onClick: () => setShowForm(true) }} />
        </Card>
      )}
    </div>
  )
}

export default Projects
