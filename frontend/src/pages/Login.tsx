import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: 'demo@falaahun.org',
    password: 'demo123456',
    name: 'Demo User',
    organizationName: 'Demo Organization'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await authService.login(formData.email, formData.password)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        localStorage.setItem('organization', JSON.stringify(response.data.data.organization))
      } else {
        const response = await authService.register(
          formData.email,
          formData.password,
          formData.name,
          formData.organizationName
        )
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        localStorage.setItem('organization', JSON.stringify(response.data.data.organization))
      }
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25 ring-1 ring-white/10">
            <span className="text-white text-3xl font-bold">ف</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Falaahun</h1>
          <p className="text-slate-400 text-sm">Organize your organization with simplicity</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Email Address</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50 h-11"
                  placeholder="your@email.com"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Organization Name</Label>
                    <Input
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50 h-11"
                      placeholder="Your Organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Full Name</Label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50 h-11"
                      placeholder="Your Name"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Password</Label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50 h-11"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait...</>
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Organization'} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-white/40 bg-transparent">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsLogin(!isLogin); setError('') }}
                className="w-full h-11 bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
              >
                {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
              </Button>
            </form>
          </div>

          <div className="bg-white/[0.03] border-t border-white/[0.06] px-8 py-5">
            <p className="text-white/40 text-[10px] text-center mb-3 font-semibold uppercase tracking-widest">Demo Credentials</p>
            <div className="flex justify-center gap-6 text-xs">
              <div className="text-center">
                <span className="text-white/30 block">Email</span>
                <span className="text-white/60 font-mono">demo@falaahun.org</span>
              </div>
              <Separator orientation="vertical" className="h-8 bg-white/10" />
              <div className="text-center">
                <span className="text-white/30 block">Password</span>
                <span className="text-white/60 font-mono">demo123456</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Falaahun CRM Platform &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default Login
