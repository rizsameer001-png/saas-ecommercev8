import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, Check, Zap, Crown, Star, Rocket, AlertCircle } from 'lucide-react'
import { Button, Input, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

const FEATURE_KEYS = [
  { key: 'maxProducts',     label: 'Max Products',      type: 'number', hint: '-1 = unlimited' },
  { key: 'maxOrders',       label: 'Max Orders/mo',     type: 'number', hint: '-1 = unlimited' },
  { key: 'storageGB',       label: 'Storage (GB)',       type: 'number' },
  { key: 'customDomain',    label: 'Custom Domain',      type: 'bool' },
  { key: 'analytics',       label: 'Analytics',          type: 'bool' },
  { key: 'prioritySupport', label: 'Priority Support',   type: 'bool' },
  { key: 'apiAccess',       label: 'API Access',         type: 'bool' },
  { key: 'whiteLabelStore', label: 'White-Label Store',  type: 'bool' },
  { key: 'multiStaff',      label: 'Multi-Staff',        type: 'bool' },
  { key: 'advancedSeo',     label: 'Advanced SEO',       type: 'bool' },
  { key: 'csvImportExport', label: 'CSV Import/Export',  type: 'bool' },
  { key: 'banners',         label: 'Banners & Ads',      type: 'bool' },
]

const EMPTY_PLAN = {
  key: '', name: '', description: '', isActive: true, isPublic: true, sortOrder: 0, badge: '', badgeColor: '',
  pricing: { monthly: 0, yearly: 0, currency: 'USD', trialDays: 0 },
  features: { maxProducts: 10, maxOrders: 100, storageGB: 1, customDomain: false, analytics: false,
    prioritySupport: false, apiAccess: false, whiteLabelStore: false, multiStaff: false, advancedSeo: false,
    csvImportExport: false, banners: true },
  featureList: [],
  theme: { gradient: 'from-gray-500 to-gray-600', accentColor: '#6366f1' },
}

function PlanForm({ plan, onSave, onCancel }) {
  const [form, setForm] = useState(plan ? { ...EMPTY_PLAN, ...plan, pricing: { ...EMPTY_PLAN.pricing, ...plan.pricing }, features: { ...EMPTY_PLAN.features, ...plan.features } } : { ...EMPTY_PLAN })
  const [saving, setSaving] = useState(false)
  const [featureText, setFeatureText] = useState('')

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPr  = (k, v) => setForm(f => ({ ...f, pricing:  { ...f.pricing,  [k]: v } }))
  const setFt  = (k, v) => setForm(f => ({ ...f, features: { ...f.features, [k]: v } }))
  const setThm = (k, v) => setForm(f => ({ ...f, theme:    { ...f.theme,    [k]: v } }))

  const addFeatureItem = () => {
    if (!featureText.trim()) return
    setForm(f => ({ ...f, featureList: [...f.featureList, { text: featureText.trim(), included: true }] }))
    setFeatureText('')
  }

  const handleSave = async () => {
    if (!form.key.trim() || !form.name.trim()) return toast.error('Key and name are required')
    setSaving(true)
    try {
      if (plan?._id) await api.put(`/admin-ext/plans/${plan._id}`, form)
      else           await api.post('/admin-ext/plans', form)
      toast.success(`Plan ${plan ? 'updated' : 'created'}!`)
      onSave()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-display font-bold text-lg">{plan ? `Edit: ${plan.name}` : 'New Plan'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Plan Key *</label>
          <input value={form.key} onChange={e => set('key', e.target.value.toLowerCase().replace(/\s/g, '_'))}
            placeholder="e.g. pro" disabled={!!plan}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Display Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Pro" className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 font-medium block mb-1.5">Description</label>
        <input value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Brief plan description" className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {/* Pricing */}
      <div>
        <p className="text-sm font-bold text-gray-300 mb-3">Pricing</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Monthly ($)', 'monthly'], ['Yearly ($)', 'yearly'], ['Trial Days', 'trialDays']].map(([l, k]) => (
            <div key={k}>
              <label className="text-xs text-gray-500 block mb-1">{l}</label>
              <input type="number" min="0" value={form.pricing[k] || 0} onChange={e => setPr(k, parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Badge Text</label>
            <input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Most Popular"
              className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>

      {/* Feature Limits */}
      <div>
        <p className="text-sm font-bold text-gray-300 mb-3">Feature Limits</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURE_KEYS.map(({ key, label, type, hint }) => (
            <div key={key} className="bg-gray-900/50 rounded-xl p-3">
              <label className="text-[11px] text-gray-400 font-medium block mb-1.5">{label}</label>
              {type === 'bool' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.features[key]} onChange={e => setFt(key, e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600" />
                  <span className="text-sm text-gray-300">{form.features[key] ? 'Enabled' : 'Disabled'}</span>
                </label>
              ) : (
                <div>
                  <input type="number" value={form.features[key] ?? 0} onChange={e => setFt(key, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
                  {hint && <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature list for pricing page */}
      <div>
        <p className="text-sm font-bold text-gray-300 mb-3">Pricing Page Feature List</p>
        <div className="flex gap-2 mb-2">
          <input value={featureText} onChange={e => setFeatureText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeatureItem() } }}
            placeholder="e.g. 1,000 Products" className="flex-1 bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          <button onClick={addFeatureItem} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.featureList.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full">
              <Check size={10} className="text-green-400" /> {item.text}
              <button onClick={() => setForm(f => ({ ...f, featureList: f.featureList.filter((_, j) => j !== i) }))}
                className="text-gray-500 hover:text-red-400 ml-1"><X size={10} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        {[['isActive', 'Active'], ['isPublic', 'Show on Pricing Page']].map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm text-gray-300">{l}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-700">
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
          {saving ? <Spinner size="sm" /> : <Save size={14} />} {plan ? 'Update Plan' : 'Create Plan'}
        </button>
      </div>
    </div>
  )
}

export default function AdminPlanBuilder() {
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)    // null | {} | plan object
  const [deleting, setDeleting] = useState(null)

  const fetch = async () => {
    setLoading(true)
    api.get('/admin-ext/plans?includeInactive=true').then(r => setPlans(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (plan) => {
    try {
      await api.delete(`/admin-ext/plans/${plan._id}`)
      toast.success('Plan deleted'); setDeleting(null); fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const ICONS = { free: Star, basic: Zap, pro: Rocket, enterprise: Crown }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Plan Builder</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage subscription tiers with custom feature gates</p>
        </div>
        <button onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus size={15} /> New Plan
        </button>
      </div>

      {/* Form */}
      {editing !== null && (
        <PlanForm plan={editing?._id ? editing : null} onSave={() => { setEditing(null); fetch() }} onCancel={() => setEditing(null)} />
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(plan => {
            const Icon = ICONS[plan.key] || Zap
            return (
              <div key={plan._id} className={`bg-gray-800/60 border rounded-2xl overflow-hidden ${plan.isActive ? 'border-gray-700' : 'border-red-900/50 opacity-60'}`}>
                <div className={`bg-gradient-to-br ${plan.theme?.gradient || 'from-gray-500 to-gray-600'} p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(plan)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                        <Edit2 size={12} className="text-white" />
                      </button>
                      <button onClick={() => setDeleting(plan)} className="p-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors">
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="font-display font-bold text-white text-lg">{plan.name}</p>
                  <p className="text-white/60 text-xs font-mono">key: {plan.key}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-bold text-white text-2xl">${plan.pricing?.monthly}</span>
                    <span className="text-white/60 text-xs">/mo</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {!plan.isActive && <p className="text-red-400 text-xs font-bold">⚠ Inactive</p>}
                  {!plan.isPublic && <p className="text-amber-400 text-xs">Hidden from pricing page</p>}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-gray-500">Products</p>
                      <p className="font-bold text-white">{plan.features?.maxProducts === -1 ? '∞' : plan.features?.maxProducts}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-gray-500">Orders/mo</p>
                      <p className="font-bold text-white">{plan.features?.maxOrders === -1 ? '∞' : plan.features?.maxOrders}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features?.customDomain && <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">Custom Domain</span>}
                    {plan.features?.apiAccess    && <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">API</span>}
                    {plan.features?.analytics    && <span className="text-[10px] bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full">Analytics</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleting(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-center mb-1">Delete "{deleting.name}"?</h3>
            <p className="text-gray-400 text-sm text-center mb-5">This cannot be undone. Blocked if active subscribers exist.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 text-sm font-semibold text-gray-400 border border-gray-700 rounded-xl hover:bg-gray-800">Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
