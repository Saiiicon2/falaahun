import { useState, useEffect } from 'react'
import { contactService, projectService, activityService } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    contacts: 0,
    projects: 0,
    raised: 0,
    activities: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contactsRes, projectsRes, activitiesRes] = await Promise.all([
          contactService.getAll(1),
          projectService.getAll(1),
          activityService.getRecent()
        ])

        setStats({
          contacts: contactsRes.data.data?.length || 0,
          projects: projectsRes.data.data?.length || 0,
          raised: projectsRes.data.data?.reduce((sum: number, p: any) => sum + (p.raised || 0), 0) || 0,
          activities: activitiesRes.data.data?.length || 0
        })

        setRecentActivities(activitiesRes.data.data?.slice(0, 5) || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of your dawah organization</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Contacts</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.contacts}</p>
              <p className="text-xs text-slate-500 mt-2">Active in system</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Projects</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.projects}</p>
              <p className="text-xs text-slate-500 mt-2">Ongoing work</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Raised</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">${stats.raised.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-2">All projects</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Activities</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activities}</p>
              <p className="text-xs text-slate-500 mt-2">Logged events</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Activities</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded">{activity.type}</span>
                      <p className="text-xs text-slate-400">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No activities yet. Start by adding a contact or logging an activity.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/contacts" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition text-sm font-medium text-center block">
              + Add Contact
            </a>
            <a href="/projects" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition text-sm font-medium text-center block">
              + New Project
            </a>
            <a href="/reports" className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition text-sm font-medium text-center block">
              📊 View Reports
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-3">GETTING STARTED</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Add contacts to track people</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Create projects for initiatives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Log activities to stay organized</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
