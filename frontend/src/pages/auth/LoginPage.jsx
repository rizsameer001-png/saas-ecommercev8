import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../../store/authSlice'
import { Store, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(loginUser(form))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG decoration */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl items-center justify-center mb-4 shadow-glow">
              <Store size={24} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-primary-200 text-sm mt-1">Sign in to your SaaSStore account</p>
          </div>

          {/* Demo credentials */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 text-xs text-primary-200">
            <p className="font-semibold text-white mb-1">Demo Accounts:</p>
            <p>Vendor: vendor@demo.com / password123</p>
            <p>Admin: admin@demo.com / password123</p>
            <p>Customer: customer@demo.com / password123</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-primary-200 block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-primary-200 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs text-primary-300 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-glow mt-2"
            >
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-primary-300 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-semibold hover:underline">
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
