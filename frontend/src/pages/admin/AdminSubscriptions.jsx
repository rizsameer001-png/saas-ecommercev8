import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { format, formatDistance } from 'date-fns'
import { CreditCard, CheckCircle, AlertCircle, Clock, Search, Filter, DollarSign, Calendar, FileText } from 'lucide-react'
import { Button, Input, Select, Spinner, StatusBadge } from '../../components/ui/index'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active:    'bg-green-900/50 text-green-400 border-green-800',
  trialing:  'bg-blue-900/50 text-blue-400 border-blue-800',
  expired:   'bg-red-900/50 text-red-400 border-red-800',
  past_due:  'bg-amber-900/50 text-amber-400 border-amber-800',
  cancelled: 'bg-gray-800 text-gray-500 border-gray-700',
}

function ManualPaymentModal({ store, onClose, onSuccess }) {
  const [plans,  setPlans]  = useState([])
  const [form,   setForm]   = useState({
    planKey: 'pro', amount: '', currency: 'USD',
    durationDays: 30, paymentMethod: 'bank_transfer', notes: '', paidAt: new Date().toISOString().slice(0, 10)
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin-ext/plans').then(r => setPlans(r.data.data || [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.planKey || !form.durationDays) return toast.error('Plan and duration are required')
    setSaving(true)
    try {
      await api.post('/admin-ext/payments/manual', {
        storeId:       store._id,
        planKey:       form.planKey,
        amount:        parseFloat(form.amount) || 0,
        currency:      form.currency,
        durationDays:  parseInt(form.durationDays),
        paymentMethod: form.paymentMethod,
        notes:         form.notes,
        paidAt:        form.paidAt,
      })
      toast.success(`Manual payment logged — ${store.name} is now on ${form.planKey.toUpperCase()} plan`)
      onSuccess()
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const selectedPlan = plans.find(p => p.key === form.planKey)
  const newExpiry = new Date(Date.now() + parseInt(form.durationDays || 30) * 24 * 60 * 60 * 1000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-display font-bold text-lg">Log Manual Payment</h3>
            <p className="text-gray-400 text-sm">for: <strong className="text-white">{store.name}</strong></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Plan */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Plan</label>
            <select value={form.planKey} onChange={e => set('planKey', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
              {plans.map(p => <option key={p.key} value={p.key}>{p.name} (${p.pricing?.monthly}/mo)</option>)}
              {/* Fallback static options if no dynamic plans */}
              {!plans.length && ['free','basic','pro','enterprise'].map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          {/* Duration */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Duration (days)</label>
            <input type="number" min="1" max="3650" value={form.durationDays}
              onChange={e => set('durationDays', parseInt(e.target.value) || 30)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          {/* Amount */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Amount Paid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" step="0.01" min="0" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder={selectedPlan ? String(selectedPlan.pricing?.monthly * (form.durationDays / 30)) : '0.00'}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          {/* Payment method */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Payment Method</label>
            <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="crypto">Crypto</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Paid at */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Payment Date</label>
            <input type="date" value={form.paidAt} onChange={e => set('paidAt', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          {/* Notes */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Notes (internal)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="e.g. Bank transfer ref: TXN-12345"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 text-sm">
          <p className="text-green-400 font-bold mb-0.5">After saving:</p>
          <p className="text-green-300 text-xs">
            {store.name} → <strong>{form.planKey.toUpperCase()} plan</strong> active until{' '}
            <strong>{format(newExpiry, 'MMMM d, yyyy')}</strong>
            {' '}({parseInt(form.durationDays)} days). Status: <strong>Active</strong>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-400 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50">
            {saving ? <Spinner size="sm" /> : <CheckCircle size={14} />}
            Log Payment & Activate
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSubscriptions() {
  const [subs,      setSubs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const [pages,     setPages]     = useState(1)
  const [status,    setStatus]    = useState('')
  const [plan,      setPlan]      = useState('')
  const [modalStore, setModalStore] = useState(null)

  const fetchSubs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (status) params.set('status', status)
      if (plan)   params.set('plan',   plan)
      const { data } = await api.get(`/admin-ext/subscriptions?${params}`)
      setSubs(data.data || [])
      setTotal(data.pagination?.total || 0)
      setPages(data.pagination?.pages || 1)
    } catch { toast.error('Failed to load subscriptions') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSubs() }, [page, status, plan])

  const stats = {
    active:   subs.filter(s => s.status === 'active').length,
    expired:  subs.filter(s => s.status === 'expired').length,
    past_due: subs.filter(s => s.status === 'past_due').length,
    revenue:  subs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amount || 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Subscriptions</h1>
        <p className="text-gray-400 text-sm mt-1">Manage all vendor subscriptions · manual payment overrides</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active',   val: stats.active,   icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: 'Expired',  val: stats.expired,  icon: AlertCircle, color: 'text-red-400',   bg: 'bg-red-900/30'   },
          { label: 'Past Due', val: stats.past_due, icon: Clock,       color: 'text-amber-400', bg: 'bg-amber-900/30' },
          { label: 'MRR',      val: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-700/50 rounded-2xl p-4 flex items-center gap-3`}>
            <Icon size={20} className={color} />
            <div><p className={`font-display font-bold text-xl ${color}`}>{val}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">All Status</option>
          {['active','trialing','past_due','expired','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">All Plans</option>
          {['free','basic','pro','enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <p className="text-sm text-gray-500 ml-auto self-center">{total} total</p>
      </div>

      {/* Table */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {['Store','Vendor','Plan','Status','Gateway','Expires','MRR','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {subs.map(sub => {
                  const exp = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
                  const isExpiring = exp && (exp - Date.now()) < 7 * 24 * 60 * 60 * 1000 && sub.status === 'active'
                  return (
                    <tr key={sub._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {sub.store?.logo
                            ? <img src={sub.store.logo} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{sub.store?.name?.[0]}</div>}
                          <div>
                            <p className="font-semibold text-white text-xs truncate max-w-[140px]">{sub.store?.name}</p>
                            <p className="text-gray-500 text-[10px]">/{sub.store?.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-xs truncate max-w-[140px]">{sub.vendor?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold capitalize text-white">{sub.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[sub.status] || 'bg-gray-700 text-gray-400'} capitalize`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 capitalize">{sub.gateway || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {exp ? (
                          <div>
                            <p className={`text-xs font-medium ${isExpiring ? 'text-amber-400' : 'text-gray-300'}`}>
                              {format(exp, 'MMM d, yyyy')}
                            </p>
                            <p className="text-[10px] text-gray-500">{formatDistance(exp, new Date(), { addSuffix: true })}</p>
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-white">${sub.amount || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setModalStore(sub.store)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-700 text-green-400 rounded-lg text-xs font-semibold transition-colors">
                          <DollarSign size={11} /> Pay
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">
              ← Prev
            </button>
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      {modalStore && (
        <ManualPaymentModal store={modalStore} onClose={() => setModalStore(null)} onSuccess={fetchSubs} />
      )}
    </div>
  )
}
