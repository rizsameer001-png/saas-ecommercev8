import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { bannersApi } from '../../api/services'
import api from '../../api/axios'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Image, Play, Zap,
  Gift, ShoppingBag, ChevronDown, Upload, X, Save, Clock,
  BarChart3, MousePointer, AlertCircle, Star
} from 'lucide-react'
import { Button, Input, Textarea, Select, Modal, EmptyState, ConfirmDialog, Spinner, StatusBadge } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const BANNER_TYPES = [
  { id: 'hero',       label: 'Hero Banner',    icon: Image,       desc: 'Full-width top-of-page banner' },
  { id: 'side',       label: 'Side Banner',    icon: Image,       desc: 'Sidebar / smaller placement' },
  { id: 'popup',      label: 'Popup',          icon: Zap,         desc: 'Overlay popup with delay' },
  { id: 'festival',   label: 'Festival / Sale',icon: Gift,        desc: 'Seasonal promotion banner' },
  { id: 'product_ad', label: 'Product Ad',     icon: ShoppingBag, desc: 'Highlight a specific product' },
]

const TYPE_COLORS = { hero: 'bg-blue-100 text-blue-700', side: 'bg-violet-100 text-violet-700', popup: 'bg-amber-100 text-amber-700', festival: 'bg-pink-100 text-pink-700', product_ad: 'bg-green-100 text-green-700' }

const DEFAULT_FORM = {
  title: '', description: '', type: 'hero',
  imageUrl: '', mobileImageUrl: '', videoUrl: '', linkUrl: '', linkLabel: 'Shop Now',
  headline: '', subtext: '', ctaText: '', overlayColor: '#00000050', textColor: '#FFFFFF',
  position: 'left', size: 'full',
  popup: { delay: 3, frequency: 'session', closeable: true },
  startsAt: '', expiresAt: '', priority: 0, isActive: true, platformWide: false,
}

function BannerCard({ banner, onEdit, onDelete, onToggle }) {
  const typeInfo = BANNER_TYPES.find(t => t.id === banner.type) || BANNER_TYPES[0]
  const TypeIcon = typeInfo.icon
  const isLive = banner.isActive && (!banner.expiresAt || new Date(banner.expiresAt) > new Date())

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-card transition-all group">
      {/* Preview image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {banner.imageUrl
          ? <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><TypeIcon size={32} className="text-gray-300" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {banner.headline && <p className="absolute bottom-3 left-3 text-white font-bold text-sm truncate max-w-[80%]">{banner.headline}</p>}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[banner.type] || 'bg-gray-100 text-gray-600'}`}>
            {typeInfo.label}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isLive ? '● Live' : '○ Paused'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{banner.title}</p>
            {banner.linkUrl && <p className="text-xs text-gray-400 truncate mt-0.5">{banner.linkUrl}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Eye size={11} /> {banner.views || 0}</span>
          <span className="flex items-center gap-1"><MousePointer size={11} /> {banner.clicks || 0}</span>
          {banner.priority > 0 && <span className="flex items-center gap-1"><Star size={11} /> Priority {banner.priority}</span>}
        </div>

        {/* Scheduling */}
        {(banner.startsAt || banner.expiresAt) && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <Clock size={10} />
            {banner.startsAt && <span>{format(new Date(banner.startsAt), 'MMM d')}</span>}
            {banner.expiresAt && <><span>→</span><span className={new Date(banner.expiresAt) < new Date() ? 'text-red-500 font-semibold' : ''}>{format(new Date(banner.expiresAt), 'MMM d')}</span></>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onToggle(banner)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${banner.isActive ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            {banner.isActive ? 'Pause' : 'Activate'}
          </button>
          <button onClick={() => onEdit(banner)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={14} className="text-gray-500" /></button>
          <button onClick={() => onDelete(banner)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
        </div>
      </div>
    </div>
  )
}

function BannerFormModal({ isOpen, onClose, onSave, editing, isAdmin }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef()

  useEffect(() => {
    if (editing) {
      setForm({
        ...DEFAULT_FORM, ...editing,
        startsAt:  editing.startsAt  ? format(new Date(editing.startsAt), "yyyy-MM-dd'T'HH:mm") : '',
        expiresAt: editing.expiresAt ? format(new Date(editing.expiresAt), "yyyy-MM-dd'T'HH:mm") : '',
        popup: editing.popup || DEFAULT_FORM.popup,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [editing, isOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const uploadImage = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      set('imageUrl', data.url)
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const typeInfo = BANNER_TYPES.find(t => t.id === form.type)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Banner' : 'Create Banner'} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <Input label="Banner Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Sale 2025" autoFocus />

          <div>
            <label className="label">Banner Type *</label>
            <div className="grid grid-cols-1 gap-2">
              {BANNER_TYPES.map(t => (
                <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.type === t.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="type" value={t.id} checked={form.type === t.id} onChange={() => set('type', t.id)} className="accent-indigo-600" />
                  <t.icon size={16} className="text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.label}</p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.platformWide} onChange={e => set('platformWide', e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm font-semibold text-gray-700">Platform-wide (show on all stores)</span>
            </label>
          )}

          {/* Popup settings */}
          {form.type === 'popup' && (
            <div className="border border-amber-100 rounded-xl p-4 bg-amber-50 space-y-3">
              <p className="font-semibold text-amber-800 text-sm">Popup Settings</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Delay (seconds)" type="number" min="0" value={form.popup.delay} onChange={e => set('popup', { ...form.popup, delay: parseInt(e.target.value) || 0 })} />
                <div>
                  <label className="label">Show Frequency</label>
                  <select value={form.popup.frequency} onChange={e => set('popup', { ...form.popup, frequency: e.target.value })} className="input">
                    <option value="once">Once per visitor</option>
                    <option value="session">Once per session</option>
                    <option value="always">Every page load</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.popup.closeable} onChange={e => set('popup', { ...form.popup, closeable: e.target.checked })} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="text-sm text-gray-700">Allow closing popup</span>
              </label>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="label">Banner Image *</label>
            <div className="relative h-36 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => imgRef.current?.click()}>
              {form.imageUrl
                ? <><img src={form.imageUrl} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center"><p className="text-white font-semibold opacity-0 hover:opacity-100">Change image</p></div></>
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2">{uploading ? <Spinner size="md" /> : <><Upload size={24} className="text-gray-400" /><p className="text-sm text-gray-500">Click to upload banner image</p></>}</div>
              }
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
            </div>
            <Input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="Or paste image URL" className="mt-2" />
          </div>

          <Input label="Headline" value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Big Sale! Up to 50% off" />
          <Textarea label="Subtext" value={form.subtext} onChange={e => set('subtext', e.target.value)} rows={2} placeholder="Limited time offer…" />
          <Input label="CTA Button Text" value={form.ctaText} onChange={e => set('ctaText', e.target.value)} placeholder="Shop Now" />
          <Input label="Link URL" value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} placeholder="/store/my-store/products?onSale=true" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.textColor} onChange={e => set('textColor', e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                <input type="text" value={form.textColor} onChange={e => set('textColor', e.target.value)} className="input flex-1 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="label">Overlay Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.overlayColor.slice(0,7)} onChange={e => set('overlayColor', e.target.value + form.overlayColor.slice(7))} className="w-10 h-10 rounded-lg border cursor-pointer" />
                <input type="text" value={form.overlayColor} onChange={e => set('overlayColor', e.target.value)} className="input flex-1 font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Text Position</label>
              <select value={form.position} onChange={e => set('position', e.target.value)} className="input">
                {['left','center','right'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <Input label="Priority" type="number" min="0" value={form.priority} onChange={e => set('priority', parseInt(e.target.value) || 0)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Starts At</label><input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} className="input text-sm" /></div>
            <div><label className="label">Expires At</label><input type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className="input text-sm" /></div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">Active (visible immediately)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title || !form.imageUrl}><Save size={14} /> {editing ? 'Update Banner' : 'Create Banner'}</Button>
      </div>
    </Modal>
  )
}

export default function BannerManager({ isAdmin = false }) {
  const { myStore } = useSelector(s => s.store)
  const { user }    = useSelector(s => s.auth)
  const [banners, setBanners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [formModal, setFormModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (typeFilter) params.type = typeFilter
      const { data } = await bannersApi.getMine(params)
      setBanners(data.data)
    } catch { toast.error('Failed to load banners') }
    finally { setLoading(false) }
  }, [typeFilter])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (form) => {
    try {
      const payload = { ...form, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined }
      if (editing) { await bannersApi.update(editing._id, payload); toast.success('Banner updated') }
      else         { await bannersApi.create(payload); toast.success('Banner created') }
      setFormModal(false); fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async () => {
    try { await bannersApi.remove(delTarget._id); toast.success('Banner deleted'); setDelTarget(null); fetch() }
    catch { toast.error('Failed to delete') }
  }

  const handleToggle = async (banner) => {
    try {
      await bannersApi.update(banner._id, { isActive: !banner.isActive })
      setBanners(prev => prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
      toast.success(banner.isActive ? 'Banner paused' : 'Banner activated')
    } catch { toast.error('Failed') }
  }

  const filtered = banners.filter(b => !typeFilter || b.type === typeFilter)
  const stats = { total: banners.length, active: banners.filter(b => b.isActive).length, totalViews: banners.reduce((s, b) => s + (b.views || 0), 0), totalClicks: banners.reduce((s, b) => s + (b.clicks || 0), 0) }

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{isAdmin ? 'Platform Banners & Ads' : 'Banners & Ads'}</h1>
          <p className="page-subtitle">{stats.total} banners · {stats.active} active</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormModal(true) }}><Plus size={15} /> Create Banner</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Banners', value: stats.total, icon: Image },
          { label: 'Active',        value: stats.active, icon: Eye },
          { label: 'Total Views',   value: stats.totalViews.toLocaleString(), icon: BarChart3 },
          { label: 'Total Clicks',  value: stats.totalClicks.toLocaleString(), icon: MousePointer },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center"><s.icon size={16} className="text-indigo-600" /></div>
            <div><p className="font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setTypeFilter('')} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!typeFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>All Types</button>
        {BANNER_TYPES.map(t => (
          <button key={t.id} onClick={() => setTypeFilter(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${typeFilter === t.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Banner grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Image} title="No banners yet" description="Create your first banner to promote products, sales, or events"
          action={<Button onClick={() => { setEditing(null); setFormModal(true) }}><Plus size={14} /> Create First Banner</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(banner => (
            <BannerCard key={banner._id} banner={banner}
              onEdit={b => { setEditing(b); setFormModal(true) }}
              onDelete={b => setDelTarget(b)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <BannerFormModal isOpen={formModal} onClose={() => setFormModal(false)} onSave={handleSave} editing={editing} isAdmin={isAdmin} />
      <ConfirmDialog isOpen={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} title="Delete Banner" message={`Delete "${delTarget?.title}"? This cannot be undone.`} danger />
    </div>
  )
}
