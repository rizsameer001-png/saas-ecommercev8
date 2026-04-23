import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import {
  Store, Search, Filter, ExternalLink, Edit2, X, Save,
  CheckCircle, AlertCircle, Clock, Ban, Image as ImageIcon,
  CreditCard, TrendingUp, Package, Eye
} from 'lucide-react'
import { Button, Input, Spinner, Select } from '../../components/ui/index'
import { CloudinaryUploadButton } from '../../components/ui/CloudinaryUpload'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_BADGE = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-amber-100 text-amber-700',
}
const PLAN_BADGE = {
  free:       'bg-gray-100 text-gray-600',
  basic:      'bg-blue-100 text-blue-700',
  pro:        'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

// ── Store Detail / Branding Override Modal ────────────────────────────────────
function StoreBrandingModal({ store, onClose, onSaved }) {
  const [logo,    setLogo]    = useState(store.logo    || '')
  const [banner,  setBanner]  = useState(store.banner  || '')
  const [primary, setPrimary] = useState(store.branding?.primaryColor   || '#6366f1')
  const [second,  setSecond]  = useState(store.branding?.secondaryColor || '#8b5cf6')
  const [accent,  setAccent]  = useState(store.branding?.accentColor    || '#f59e0b')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/admin-ext/stores/${store._id}/branding`, {
        logo:    logo.trim()   || undefined,
        banner:  banner.trim() || undefined,
        branding: { primaryColor: primary, secondaryColor: second, accentColor: accent },
      })
      toast.success('Store branding updated')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div>
            <h3 className="font-display font-bold text-gray-900">Store Branding Override</h3>
            <p className="text-sm text-gray-500">{store.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className="label">Store Logo</label>
            <div className="flex items-center gap-3 mb-2">
              {logo
                ? <img src={logo} alt="logo" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><ImageIcon size={20} className="text-gray-300" /></div>
              }
              <div className="flex-1 flex gap-2">
                <input type="url" value={logo} onChange={e => setLogo(e.target.value)}
                  placeholder="https://... or upload below"
                  className="input flex-1 text-sm" />
                <CloudinaryUploadButton
                  folder="store-branding"
                  label="Upload"
                  className="btn-secondary text-sm flex-shrink-0"
                  onUploaded={({ url }) => setLogo(url)} />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="label">Hero Banner</label>
            <div className="mb-2">
              {banner && (
                <img src={banner} alt="banner" className="w-full h-24 object-cover rounded-xl mb-2 border border-gray-100" />
              )}
              <div className="flex gap-2">
                <input type="url" value={banner} onChange={e => setBanner(e.target.value)}
                  placeholder="Banner image URL"
                  className="input flex-1 text-sm" />
                <CloudinaryUploadButton
                  folder="store-banners"
                  label="Upload"
                  className="btn-secondary text-sm flex-shrink-0"
                  onUploaded={({ url }) => setBanner(url)} />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="label">Brand Colors</label>
            <div className="grid grid-cols-3 gap-3">
              {[['Primary', primary, setPrimary], ['Secondary', second, setSecond], ['Accent', accent, setAccent]].map(([lbl, val, setter]) => (
                <div key={lbl}>
                  <p className="text-xs text-gray-500 mb-1">{lbl}</p>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1.5">
                    <input type="color" value={val} onChange={e => setter(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer" />
                    <span className="text-xs font-mono text-gray-600 flex-1">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-2 font-medium">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${primary}, ${second})` }}>
                {store.name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{store.name}</p>
                <div className="flex gap-1 mt-0.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primary }} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: second }} />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancel</Button>
          <Button onClick={handleSave} loading={saving} className="flex-1 justify-center">
            <Save size={14} /> Save Branding
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminStores Page ──────────────────────────────────────────────────────
export default function AdminStores() {
  const [stores,     setStores]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page,       setPage]       = useState(1)
  const [total,      setTotal]      = useState(0)
  const [brandingStore, setBrandingStore] = useState(null)
  const navigate = useNavigate()
  const LIMIT = 15

  const fetchStores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (search)       params.set('search', search)
      if (planFilter)   params.set('plan',   planFilter)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/admin/stores?${params}`)
      setStores(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch { toast.error('Failed to load stores') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStores() }, [page, planFilter, statusFilter])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStores() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const toggleStatus = async (store) => {
    const newStatus = store.status === 'active' ? 'suspended' : 'active'
    try {
      await api.patch(`/admin/stores/${store._id}/status`, { status: newStatus })
      toast.success(`Store ${newStatus === 'active' ? 'activated' : 'suspended'}`)
      fetchStores()
    } catch { toast.error('Failed to update status') }
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Stores</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} total stores on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or slug…"
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">All Plans</option>
          {['free','basic','pro','enterprise'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Store size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="font-medium">No stores found</p>
        </div>
      ) : (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {['Store','Plan','Status','Products','Revenue','Joined','Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {stores.map(store => (
                <tr key={store._id} className="hover:bg-gray-700/30 transition-colors">
                  {/* Store info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {store.logo
                        ? <img src={store.logo} alt={store.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: store.branding?.primaryColor || '#6366f1' }}>
                            {store.name?.[0]}
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{store.name}</p>
                        <p className="text-xs text-gray-400">/{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PLAN_BADGE[store.plan] || PLAN_BADGE.free}`}>
                      {store.plan}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[store.status] || STATUS_BADGE.pending}`}>
                      {store.status}
                    </span>
                  </td>
                  {/* Products */}
                  <td className="px-4 py-3.5 text-gray-300">{store.stats?.totalProducts || 0}</td>
                  {/* Revenue */}
                  <td className="px-4 py-3.5 text-gray-300 font-mono">${(store.stats?.totalRevenue || 0).toLocaleString()}</td>
                  {/* Joined */}
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {store.createdAt ? format(new Date(store.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-all"
                        title="View storefront">
                        <Eye size={14} />
                      </a>
                      <button onClick={() => setBrandingStore(store)}
                        className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-900/30 rounded-lg transition-all"
                        title="Edit branding">
                        <ImageIcon size={14} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/subscriptions?store=${store._id}`)}
                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-lg transition-all"
                        title="Manage subscription">
                        <CreditCard size={14} />
                      </button>
                      <button
                        onClick={() => toggleStatus(store)}
                        className={`p-1.5 rounded-lg transition-all ${
                          store.status === 'active'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
                        }`}
                        title={store.status === 'active' ? 'Suspend store' : 'Activate store'}>
                        {store.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-700">
              <p className="text-xs text-gray-400">{total} stores · Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-400 border border-gray-600 rounded-xl hover:border-gray-400 disabled:opacity-40 transition-all">
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-400 border border-gray-600 rounded-xl hover:border-gray-400 disabled:opacity-40 transition-all">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Branding Modal */}
      {brandingStore && (
        <StoreBrandingModal
          store={brandingStore}
          onClose={() => setBrandingStore(null)}
          onSaved={fetchStores}
        />
      )}
    </div>
  )
}
