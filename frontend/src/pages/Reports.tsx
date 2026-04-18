import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, DollarSign, Target, TrendingUp, Users } from 'lucide-react'
import { activityService, projectService, pledgeService } from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

function Reports() {
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [pledgeStats, setPledgeStats] = useState<any>(null)
  const [ownerStats, setOwnerStats] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const [activitiesRes, projectsRes, pledgeStatsRes] = await Promise.all([
        activityService.getRecent(),
        projectService.getAll(100),
        pledgeService.getStats(),
      ])

      const activitiesData = activitiesRes.data.data || []
      const activityCounts: Record<string, number> = {}
      
      activitiesData.forEach((activity: any) => {
        const type = activity.type || 'other'
        activityCounts[type] = (activityCounts[type] || 0) + 1
      })
      
      const processedStats = Object.entries(activityCounts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        name: type.charAt(0).toUpperCase() + type.slice(1)
      }))

      const ownerCounts: Record<string, number> = {}
      activitiesData.forEach((activity: any) => {
        const ownerName = activity.created_by_name || activity.assigned_to_name || activity.created_by || 'Unknown'
        ownerCounts[ownerName] = (ownerCounts[ownerName] || 0) + 1
      })

      const processedOwnerStats = Object.entries(ownerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
      
      setStats(processedStats)
      setProjects(projectsRes.data.data || [])
      setPledgeStats(pledgeStatsRes.data.data || null)
      setOwnerStats(processedOwnerStats)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setStats([])
      setProjects([])
      setPledgeStats(null)
      setOwnerStats([])
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const projectFundingData = projects.map(p => ({
    name: p.name.substring(0, 10),
    target: p.budget || 0,
    raised: p.raised || 0
  }))

  const totalRaised = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.raised) || 0), 0)
  const totalTarget = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.budget) || 0), 0)

  const formatCurrency = (value: number | string) => {
    const num = parseFloat(String(value)) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const statCards = [
    { label: 'Total Raised', value: formatCurrency(totalRaised), sub: 'Across all projects', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Total Target', value: formatCurrency(totalTarget), sub: 'Combined goals', icon: Target, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Success Rate', value: `${totalTarget > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : 0}%`, sub: 'Overall target', icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Total Pledges', value: String(Number(pledgeStats?.total_pledges || 0)), sub: `Received: ${formatCurrency(pledgeStats?.total_received || 0)}`, icon: BarChart3, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive overview of your organization's activities and financial performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-2">{s.sub}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `Count: ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Funding Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Funding Status</CardTitle>
            </CardHeader>
            <CardContent>
              {projectFundingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectFundingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="raised" fill="#10b981" name="Raised" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Activity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {stats.map((activity: any, index: number) => (
                    <div key={index} className="text-center p-4 rounded-xl bg-muted/50">
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <p className="text-sm font-medium text-foreground">{activity.type}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{activity.count}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Activity Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Who Did What</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {ownerStats.length > 0 ? (
                <div className="space-y-3">
                  {ownerStats.map((owner) => {
                    const maxCount = ownerStats[0]?.count || 1
                    return (
                      <div key={owner.name} className="flex items-center gap-4 pb-3 border-b border-border last:border-0">
                        <p className="font-medium text-foreground flex-1">{owner.name}</p>
                        <div className="w-32">
                          <Progress value={(owner.count / maxCount) * 100} className="h-2" />
                        </div>
                        <Badge variant="success">{owner.count} activities</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activity ownership data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Projects Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project: any) => {
                    const pct = project.budget > 0 ? (parseFloat(project.raised) / parseFloat(project.budget)) * 100 : 0
                    return (
                      <div key={project.id} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground truncate">{project.name}</p>
                            <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(project.raised)} raised of {formatCurrency(project.budget)}
                          </p>
                          <Progress value={Math.min(pct, 100)} className="h-2 mt-2" />
                        </div>
                        <p className="text-lg font-bold text-foreground whitespace-nowrap">
                          {pct.toFixed(1)}%
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Reports
