import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../../store/authSlice'
import { Store, User, ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s => s.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'customer', storeName: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(registerUser(form))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-7">
            <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl items-center justify-center mb-4 shadow-glow">
              <Store size={24} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
            <p className="text-primary-200 text-sm mt-1">Join SaaSStore today</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'customer', label: 'Customer', icon: User, desc: 'Shop from stores' },
              { value: 'vendor', label: 'Vendor', icon: ShoppingBag, desc: 'Sell your products' },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  form.role === value
                    ? 'border-primary-400 bg-primary-500/20'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                }`}
              >
                <Icon size={18} className={form.role === value ? 'text-primary-300' : 'text-white/50'} />
                <p className="text-sm font-bold text-white mt-1.5">{label}</p>
                <p className="text-xs text-primary-300 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="text-sm font-medium text-primary-200 block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  placeholder={placeholder}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            ))}

            {form.role === 'vendor' && (
              <div>
                <label className="text-sm font-medium text-primary-200 block mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={e => setForm({ ...form, storeName: e.target.value })}
                  placeholder="My Awesome Store"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-primary-200 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  required minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-glow mt-2"
            >
              {loading ? 'Creating account...' : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-primary-300 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
