import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: 'demo@falaahun.org',
    password: 'demo123456',
    name: 'Demo User'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await authService.login(formData.email, formData.password)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      } else {
        const response = await authService.register(formData.email, formData.password, formData.name)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">ف</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Falaahun</h1>
          <p className="text-slate-400">Organize your organization with simplicity</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition"
                placeholder="your@email.com"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition"
                  placeholder="Your Name"
                />
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 mt-6"
            >
              {loading ? 'Signing in...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-white/50">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="w-full text-white/70 font-medium py-3 rounded-lg hover:bg-white/5 transition border border-white/10"
            >
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center mb-3 font-medium">DEMO CREDENTIALS</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1 text-center">
              <p className="text-white/70 text-xs"><span className="text-white/40">Email:</span> demo@falaahun.org</p>
              <p className="text-white/70 text-xs"><span className="text-white/40">Password:</span> demo123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
