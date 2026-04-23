import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { Crown, Zap, Star, Rocket, Check, TrendingUp, Users, Store, Package, BarChart3, Globe, Shield, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_META = {
  free:       { icon: Star,   gradient: 'from-gray-400 to-gray-500',   glow: 'shadow-gray-200',   ring: 'ring-gray-200' },
  basic:      { icon: Zap,    gradient: 'from-blue-500 to-blue-600',   glow: 'shadow-blue-200',   ring: 'ring-blue-200' },
  pro:        { icon: Rocket, gradient: 'from-indigo-500 to-purple-600',glow: 'shadow-indigo-200', ring: 'ring-indigo-300', popular: true },
  enterprise: { icon: Crown,  gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-200',  ring: 'ring-amber-300' },
}

const PLAN_FEATURES = {
  free:       ['10 Products', '100 Orders/mo', '1 GB Storage', 'Basic Storefront', 'Community Support', 'SaaSStore Branding'],
  basic:      ['100 Products', '1,000 Orders/mo', '5 GB Storage', 'Analytics Dashboard', 'Email Support', 'Coupon Codes', 'CSV Import/Export'],
  pro:        ['1,000 Products', '10,000 Orders/mo', '20 GB Storage', 'Custom Domain', 'API Access', 'Multi-Staff', 'Priority Support', 'Advanced SEO', 'White-Label Options', 'Mega Menu'],
  enterprise: ['Unlimited Products', 'Unlimited Orders', '100 GB Storage', 'White-Label Store', 'Dedicated Manager', 'Custom Integrations', 'SLA Guarantee', 'Custom Analytics'],
}

const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 29, yearly: 290 },
  pro: { monthly: 79, yearly: 790 },
  enterprise: { monthly: 199, yearly: 1990 },
}

function PlanCard({ plan, billing, onAssign, selectedStore }) {
  const meta    = PLAN_META[plan.id]
  const Icon    = meta.icon
  const price   = billing === 'yearly' ? PLAN_PRICES[plan.id]?.yearly : PLAN_PRICES[plan.id]?.monthly
  const perMonth = billing === 'yearly' ? Math.round((price || 0) / 12) : price

  return (
    <div className={`relative bg-white rounded-3xl border-2 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl group ${
      meta.popular
        ? `border-indigo-400 ring-2 ${meta.ring} shadow-xl`
        : `border-gray-100 hover:border-indigo-200`
    }`}>
      {meta.popular && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
      )}
      {meta.popular && (
        <div className="absolute -top-px right-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg tracking-wider">
            MOST POPULAR
          </div>
        </div>
      )}

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${meta.gradient} p-6 relative overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Icon size={22} className="text-white" />
          </div>
          <p className="font-display font-bold text-white text-xl capitalize mb-1">{plan.name}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-white text-4xl">${perMonth}</span>
            <span className="text-white/70 text-sm">/mo</span>
          </div>
          {billing === 'yearly' && price > 0 && (
            <p className="text-white/60 text-xs mt-0.5">Billed ${price}/year · Save ${(PLAN_PRICES[plan.id]?.monthly * 12 - price).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Limits chips */}
      <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap gap-2">
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {plan.features?.maxProducts === -1 ? '∞' : plan.features?.maxProducts?.toLocaleString()} Products
        </span>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {plan.features?.maxOrders === -1 ? '∞' : plan.features?.maxOrders?.toLocaleString()} Orders/mo
        </span>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {plan.features?.storageGB} GB Storage
        </span>
        {plan.features?.customDomain && <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Custom Domain</span>}
        {plan.features?.apiAccess    && <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">API Access</span>}
      </div>

      {/* Feature list */}
      <div className="p-5">
        <ul className="space-y-2.5 mb-5">
          {(PLAN_FEATURES[plan.id] || []).map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} className="text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Assign to store */}
        {selectedStore ? (
          <button
            onClick={() => onAssign(plan.id)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] ${
              meta.popular
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}>
            Assign {plan.name} to Store
          </button>
        ) : (
          <div className="text-center text-xs text-gray-400 py-2">Select a store above to assign plan</div>
        )}
      </div>
    </div>
  )
}

export default function AdminPricingCards() {
  const [plans, setPlans]       = useState([])
  const [stores, setStores]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [billing, setBilling]   = useState('monthly')
  const [selectedStore, setSelectedStore] = useState('')
  const [duration, setDuration] = useState(30)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/plans'),
      api.get('/admin/stores?limit=100', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
    ]).then(([pRes, sRes]) => {
      setPlans(pRes.data.data || [])
      setStores(sRes.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleAssign = async (planId) => {
    if (!selectedStore) return toast.error('Please select a store first')
    setAssigning(true)
    try {
      await api.post('/subscriptions/admin/set-plan', {
        storeId: selectedStore,
        plan: planId,
        durationDays: duration,
      })
      toast.success(`${planId} plan assigned for ${duration} days!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign plan')
    } finally { setAssigning(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Pricing Plans</h1>
        <p className="text-gray-400 text-sm mt-1">Assign subscription plans to vendor stores</p>
      </div>

      {/* Platform revenue stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Free Stores',       icon: Star,    color: 'bg-gray-700',   val: stores.filter(s=>s.plan==='free').length },
          { label: 'Basic Stores',      icon: Zap,     color: 'bg-blue-800',   val: stores.filter(s=>s.plan==='basic').length },
          { label: 'Pro Stores',        icon: Rocket,  color: 'bg-indigo-800', val: stores.filter(s=>s.plan==='pro').length },
          { label: 'Enterprise Stores', icon: Crown,   color: 'bg-amber-800',  val: stores.filter(s=>s.plan==='enterprise').length },
        ].map(({ label, icon: Icon, color, val }) => (
          <div key={label} className={`${color} bg-opacity-60 border border-gray-700 rounded-2xl p-5 flex items-center gap-4`}>
            <Icon size={20} className="text-gray-300" />
            <div><p className="text-2xl font-display font-bold text-white">{val}</p><p className="text-xs text-gray-400">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-48">
          <label className="label text-gray-400 text-xs mb-1.5 block">Select Store to Assign Plan</label>
          <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
            <option value="">— Choose a store —</option>
            {stores.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.plan})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-gray-400 text-xs mb-1.5 block">Duration (days)</label>
          <input type="number" min="1" max="3650" value={duration} onChange={e => setDuration(parseInt(e.target.value)||30)}
            className="w-24 bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="label text-gray-400 text-xs mb-1.5 block">Billing Display</label>
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
            {['monthly','yearly'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${billing===b?'bg-indigo-600 text-white':'text-gray-400'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            selectedStore={selectedStore}
            onAssign={handleAssign}
          />
        ))}
      </div>

      {/* All stores plan list */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-display font-bold">All Store Subscriptions</h3>
        </div>
        <div className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto">
          {stores.map(s => (
            <div key={s._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-700/30 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: s.branding?.primaryColor || '#6366f1' }}>
                {s.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                <p className="text-xs text-gray-400">/{s.slug}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                s.plan==='free'?'bg-gray-700 text-gray-400':
                s.plan==='basic'?'bg-blue-900 text-blue-300':
                s.plan==='pro'?'bg-indigo-900 text-indigo-300':'bg-amber-900 text-amber-300'
              }`}>{s.plan}</span>
              <button onClick={() => { setSelectedStore(s._id) }}
                className="text-xs text-indigo-400 hover:text-indigo-200 font-semibold">
                Change
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
