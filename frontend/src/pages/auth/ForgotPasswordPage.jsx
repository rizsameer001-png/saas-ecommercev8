import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Store, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent!')
    } catch {
      toast.error('Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl items-center justify-center mb-4">
              <Store size={24} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-primary-200 text-sm mt-1">We'll send you a reset link</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-400" />
              </div>
              <p className="text-white font-semibold mb-2">Check your email</p>
              <p className="text-primary-200 text-sm">A password reset link has been sent to {email}</p>
              <Link to="/login" className="inline-flex items-center gap-2 mt-6 text-primary-300 hover:text-white text-sm">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-primary-200 block mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-primary-300 hover:text-white text-sm transition-colors">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
