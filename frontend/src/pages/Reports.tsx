import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { activityService, projectService } from '../services/api'

function Reports() {
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const [activitiesRes, projectsRes] = await Promise.all([
        activityService.getRecent(),
        projectService.getAll(100)
      ])

      // Process activity data for charts
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
      
      setStats(processedStats)
      setProjects(projectsRes.data.data || [])
    } catch (error) {
      console.error('Error fetching report data:', error)
      setStats([])
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Prepare chart data
  const _activityChartData = stats || []
  
  const projectFundingData = projects.map(p => ({
    name: p.name.substring(0, 10),
    target: p.budget || 0,
    raised: p.raised || 0
  }))

  const totalRaised = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.raised) || 0), 0)
  const totalTarget = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.budget) || 0), 0)
  const activeProjects = projects.filter((p: any) => p.status === 'active').length

  // Format currency safely
  const formatCurrency = (value: number | string) => {
    const num = parseFloat(String(value)) || 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
      <p className="text-gray-600 mb-8">Comprehensive overview of your organization's activities and financial performance.</p>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium">Total Raised</p>
          <p className="text-3xl font-bold text-green-600 mt-3">{formatCurrency(totalRaised)}</p>
          <p className="text-xs text-gray-400 mt-2">Across all projects</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium">Total Target</p>
          <p className="text-3xl font-bold text-blue-600 mt-3">{formatCurrency(totalTarget)}</p>
          <p className="text-xs text-gray-400 mt-2">Combined goals</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium">Success Rate</p>
          <p className="text-3xl font-bold text-purple-600 mt-3">
            {totalTarget > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-2">Overall target</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm font-medium">Active Projects</p>
          <p className="text-3xl font-bold text-orange-600 mt-3">{activeProjects}</p>
          <p className="text-xs text-gray-400 mt-2">Ongoing initiatives</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading reports...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Activity Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Distribution</h2>
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
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>

          {/* Project Funding Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Funding Status</h2>
            {projectFundingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectFundingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#94a3b8" name="Target" />
                  <Bar dataKey="raised" fill="#10b981" name="Raised" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No project data available</p>
            )}
          </div>

          {/* Activity Stats Table */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Breakdown</h2>
            {stats && stats.length > 0 ? (
              <div className="grid grid-cols-5 gap-4">
                {stats.map((activity: any, index: number) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <p className="text-sm font-medium text-slate-900">{activity.type}</p>
                    <p className="text-2xl font-bold text-slate-700 mt-2">{activity.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>

          {/* Projects Summary */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Projects Summary</h2>
            {projectFundingData.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(project.raised)} raised of {formatCurrency(project.budget)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {project.budget > 0 ? ((parseFloat(project.raised) / parseFloat(project.budget)) * 100).toFixed(1) : 0}%
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No projects available</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
