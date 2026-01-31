import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import IntegrationSettings from './pages/IntegrationSettings'
import OrganizationSettings from './pages/OrganizationSettings'
import Login from './pages/Login'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Login />
      ) : (
        <div className="flex h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:contactId" element={<ContactDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<IntegrationSettings />} />
              <Route path="/organization" element={<OrganizationSettings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  )
}

export default App
