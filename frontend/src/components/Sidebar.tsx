import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Users, FolderOpen, BarChart3, Building2, Settings, CreditCard, LogOut,
  ChevronLeft, ChevronRight, Moon, Sun, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/pledges', label: 'Pledges', icon: DollarSign },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/organization', label: 'Organization', icon: Building2 },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  
  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "relative flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl border-r border-slate-700/50 transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 h-6 w-6 rounded-full border border-slate-600 bg-slate-800 text-slate-300 shadow-md hover:bg-slate-700 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Logo */}
        <div className={cn("p-4 border-b border-slate-700/50", collapsed ? "px-3" : "px-6")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">ف</span>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-white tracking-tight">Falaahun</h1>
                <p className="text-slate-500 text-[10px] font-medium tracking-wider uppercase">CRM Platform</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            const linkContent = (
              <Link
                to={path}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group relative",
                  collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5",
                  active 
                    ? "bg-emerald-500/15 text-emerald-400 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full" />
                )}
                <Icon className={cn("w-5 h-5 flex-shrink-0", collapsed ? "" : "mr-3")} />
                {!collapsed && (
                  <span className="font-medium text-sm">{label}</span>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={path}>{linkContent}</div>
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className={cn("border-t border-slate-700/50 bg-slate-800/50", collapsed ? "p-2" : "p-3")}>
          {/* Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "flex items-center w-full rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-3"
                )}
              >
                {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
                {!collapsed && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{darkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>}
          </Tooltip>

          <Separator className="my-2 bg-slate-700/50" />

          {/* User Profile */}
          <div className={cn(
            "flex items-center rounded-lg mb-1",
            collapsed ? "justify-center px-1 py-2" : "px-3 py-2 gap-3"
          )}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email || ''}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleLogout}
                className={cn(
                  "flex items-center w-full rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-3"
                )}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium text-sm">Logout</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export default Sidebar
