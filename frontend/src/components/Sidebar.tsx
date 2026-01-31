import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FolderOpen, BarChart3, Building2, Settings, LogOut } from 'lucide-react'

function Sidebar() {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/dashboard')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl border-r border-slate-700/50">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center overflow-hidden">
            <span className="text-white font-bold">ف</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Falaahun</h1>
            <p className="text-slate-400 text-xs">v1.0</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-8 px-3 space-y-1">
        <Link
          to="/dashboard"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/dashboard') || isActive('/')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          <span className="font-medium">Dashboard</span>
        </Link>
        
        <Link
          to="/contacts"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/contacts')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-5 h-5 mr-3" />
          <span className="font-medium">Contacts</span>
        </Link>
        
        <Link
          to="/projects"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/projects')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <FolderOpen className="w-5 h-5 mr-3" />
          <span className="font-medium">Projects</span>
        </Link>
        
        <Link
          to="/reports"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/reports')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          <span className="font-medium">Reports</span>
        </Link>

        <Link
          to="/organization"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/organization')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <Building2 className="w-5 h-5 mr-3" />
          <span className="font-medium">Organization</span>
        </Link>

        <Link
          to="/settings"
          className={`flex items-center px-4 py-3 rounded-lg transition duration-200 ${
            isActive('/settings')
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="font-medium">Settings</span>
        </Link>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 w-64 px-3 py-4 border-t border-slate-700/50 bg-slate-800/50">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
