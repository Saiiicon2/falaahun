import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Projects from './pages/Projects'
import Pledges from './pages/Pledges'
import Reports from './pages/Reports'
import IntegrationSettings from './pages/IntegrationSettings'
import OrganizationSettings from './pages/OrganizationSettings'
import Billing from './pages/Billing'
import Login from './pages/Login'
import { Toaster } from './components/ui/toaster'
import { billingService } from './services/api'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  useEffect(() => {
    const fetchBilling = async () => {
      if (!isAuthenticated) {
        setSubscriptionStatus(null)
        return
      }

      try {
        setBillingLoading(true)
        const response = await billingService.getStatus()
        setSubscriptionStatus(response?.data?.data?.subscription?.status || null)
      } catch (error) {
        setSubscriptionStatus(null)
      } finally {
        setBillingLoading(false)
      }
    }

    fetchBilling()
  }, [isAuthenticated])

  const hasPremiumAccess = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

  const renderPremiumElement = (element: JSX.Element) => {
    if (billingLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking subscription...</p>
          </div>
        </div>
      )
    }

    if (!hasPremiumAccess) {
      return <Navigate to="/billing?reason=premium" replace />
    }

    return element
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-muted border-t-primary mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4 text-sm font-medium">Loading Falaahun...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Login />
      ) : (
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:contactId" element={<ContactDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/pledges" element={<Pledges />} />
              <Route path="/reports" element={renderPremiumElement(<Reports />)} />
              <Route path="/settings" element={renderPremiumElement(<IntegrationSettings />)} />
              <Route path="/organization" element={<OrganizationSettings />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      )}
      <Toaster />
    </Router>
  )
}

export default App
