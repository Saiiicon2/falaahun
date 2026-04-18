import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FolderOpen, DollarSign, Activity, TrendingUp, ArrowUpRight, Plus, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { contactService, projectService, activityService, pledgeService } from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/ui/loading-skeletons'
import { EmptyState } from '@/components/ui/empty-state'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    contacts: 0,
    projects: 0,
    raised: 0,
    activities: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contactsRes, projectsRes, activitiesRes] = await Promise.all([
          contactService.getAll(1),
          projectService.getAll(1),
          activityService.getRecent()
        ])

        const projectData = projectsRes.data.data || []
        setProjects(projectData.slice(0, 4))
        setStats({
          contacts: contactsRes.data.data?.length || contactsRes.data.data?.contacts?.length || 0,
          projects: projectData.length,
          raised: projectData.reduce((sum: number, p: any) => sum + (parseFloat(p.raised) || 0), 0),
          activities: activitiesRes.data.data?.length || 0
        })

        setRecentActivities(activitiesRes.data.data?.slice(0, 6) || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <DashboardSkeleton />

  const statCards = [
    { 
      label: 'Total Contacts', value: stats.contacts, icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      subtitle: 'Active in system'
    },
    { 
      label: 'Active Projects', value: stats.projects, icon: FolderOpen,
      color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10',
      subtitle: 'Ongoing initiatives'
    },
    { 
      label: 'Total Raised', value: `$${stats.raised.toLocaleString()}`, icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10',
      subtitle: 'All projects combined'
    },
    { 
      label: 'Activities', value: stats.activities, icon: Activity,
      color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10',
      subtitle: 'Total logged events'
    },
  ]

  const activityTypeColors: Record<string, string> = {
    call: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    email: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    note: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    social_media: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back — here's what's happening.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button onClick={() => navigate('/contacts')} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Contact
          </Button>
          <Button onClick={() => navigate('/projects')} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> New Project
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, subtitle }) => (
          <Card key={label} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {subtitle}
                  </p>
                </div>
                <div className={`${bg} p-2.5 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/contacts')}>
              View All <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.map((activity: any) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => activity.contact_id && navigate(`/contacts/${activity.contact_id}`)}
                  >
                    <div className="mt-1.5">
                      <div className="w-2 h-2 bg-primary rounded-full ring-4 ring-primary/10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${activityTypeColors[activity.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {activity.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(activity.date || activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="activities"
                title="No activities yet"
                description="Start by adding contacts and logging your first activity."
                actionLabel="Add Contact"
                onAction={() => navigate('/contacts')}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm"
                onClick={() => navigate('/contacts')}
              >
                <Users className="w-4 h-4 mr-2" /> Add Contact
              </Button>
              <Button 
                className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
                onClick={() => navigate('/projects')}
              >
                <FolderOpen className="w-4 h-4 mr-2" /> New Project
              </Button>
              <Button 
                className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-sm"
                onClick={() => navigate('/reports')}
              >
                <Eye className="w-4 h-4 mr-2" /> View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Top Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/projects')}>
                All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project: any) => {
                    const budget = parseFloat(project.budget) || 0
                    const raised = parseFloat(project.raised) || 0
                    const pct = budget > 0 ? Math.min(Math.round((raised / budget) * 100), 100) : 0
                    return (
                      <div 
                        key={project.id} 
                        className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate('/projects')}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate pr-2">{project.name}</p>
                          <Badge variant={project.status === 'active' ? 'success' : 'secondary'} className="text-[10px]">
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium w-8 text-right">{pct}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${raised.toLocaleString()} / ${budget.toLocaleString()}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon="projects"
                  title="No projects yet"
                  description="Create your first project to start tracking."
                  actionLabel="New Project"
                  onAction={() => navigate('/projects')}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
