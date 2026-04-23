import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { updateProfile, logout, fetchCurrentUser } from '../../store/authSlice'
import { ordersApi, reviewsApi } from '../../api/services'
import { customerApi } from '../../api/services'
import api from '../../api/axios'
import {
  User, Package, MapPin, Bell, RotateCcw, Heart, ShoppingCart,
  Star, Edit2, Plus, Trash2, X, Check, LogOut, Upload, Camera,
  ChevronRight, Eye, AlertCircle, Home, Briefcase, Clock, CheckCircle,
  XCircle, Truck, RefreshCw, MessageSquare
} from 'lucide-react'
import { StatusBadge, Spinner, Input, Textarea, Modal, ConfirmDialog, RatingStars } from '../../components/ui/index'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { id: 'profile',       label: 'My Profile',        icon: User },
  { id: 'orders',        label: 'Orders',             icon: Package },
  { id: 'wishlist',      label: 'Wishlist',           icon: Heart },
  { id: 'addresses',     label: 'Addresses',          icon: MapPin },
  { id: 'notifications', label: 'Notifications',      icon: Bell },
  { id: 'reviews',       label: 'My Reviews',         icon: Star },
  { id: 'returns',       label: 'Returns & Refunds',  icon: RotateCcw },
]

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user }  = useSelector(s => s.auth)
  const dispatch  = useDispatch()
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' })
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving]   = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = require('react').useRef()

  const uploadAvatar = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, avatar: data.url }))
      toast.success('Avatar uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await dispatch(updateProfile(form)).unwrap()
    } finally { setSaving(false) }
  }

  const handlePwChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setPwSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setPwSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Avatar + basic info */}
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-5">Personal Information</h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-indigo-100 border-2 border-white shadow-md">
              {form.avatar
                ? <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-indigo-600">{user?.name?.[0]?.toUpperCase()}</div>
              }
            </div>
            <button onClick={() => inputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow hover:bg-indigo-700 transition-colors">
              {uploading ? <Spinner size="sm" /> : <Camera size={14} />}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-xl text-gray-900">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role} account</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Avatar URL (optional)" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} placeholder="https://..." className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Spinner size="sm" /> : <Check size={15} />} Save Changes
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-5">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New Password" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
          <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          <button onClick={handlePwChange} disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="btn-primary flex items-center gap-2">
            {pwSaving ? <Spinner size="sm" /> : <Check size={15} />} Update Password
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Orders Section ───────────────────────────────────────────────────────────
function OrdersSection() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('current')

  useEffect(() => {
    ordersApi.getMyOrders().then(r => setOrders(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const current = orders.filter(o => !['delivered','cancelled','refunded'].includes(o.status))
  const history = orders.filter(o => ['delivered','cancelled','refunded'].includes(o.status))
  const shown   = tab === 'current' ? current : history

  const statusIcon = (s) => {
    if (s === 'delivered') return <CheckCircle size={14} className="text-green-500" />
    if (s === 'cancelled') return <XCircle    size={14} className="text-red-500" />
    if (s === 'shipped' || s === 'out_for_delivery') return <Truck size={14} className="text-blue-500" />
    return <Clock size={14} className="text-amber-500" />
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-100 pb-1">
        {[['current','Current Orders'], ['history','Order History']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-1.5 ${tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {l} {t === 'current' ? `(${current.length})` : `(${history.length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        : shown.length === 0 ? (
          <div className="text-center py-12">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{tab === 'current' ? 'No active orders' : 'No order history'}</p>
          </div>
        ) : shown.map(order => (
          <div key={order._id} className="card hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon(order.status)}
                  <p className="font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'MMM d, yyyy')} · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                {order.store && <p className="text-xs text-gray-500 mt-0.5">from {order.store?.name || 'Store'}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${order.pricing?.total?.toFixed(2)}</p>
                <div className="flex gap-2 mt-2">
                  {order.store?.slug && (
                    <Link to={`/store/${order.store.slug}/track/${order._id}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                      <Eye size={11} /> Track
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {/* Items preview */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {order.items?.slice(0, 4).map((item, i) => (
                <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
              ))}
              {order.items?.length > 4 && (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
          </div>
        ))
      }
    </div>
  )
}

// ─── Wishlist Section ─────────────────────────────────────────────────────────
function WishlistSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  const fetch = useCallback(() => {
    customerApi.getWishlist().then(r => setItems(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleRemove = async (productId) => {
    try {
      await customerApi.removeWishlist(productId)
      setItems(prev => prev.filter(i => i.product?._id !== productId))
      toast.success('Removed from wishlist')
    } catch { toast.error('Failed to remove') }
  }

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</div>

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Heart size={40} className="text-gray-300 mx-auto mb-4" />
      <h3 className="font-display font-bold text-gray-700 text-lg mb-1">Wishlist is empty</h3>
      <p className="text-gray-400 text-sm">Browse stores and save items you love</p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(item => {
        const p = item.product
        if (!p) return null
        const img = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url
        return (
          <div key={item._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-card-hover transition-all group">
            <div className="relative aspect-square bg-gray-100">
              {img ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Heart size={28} /></div>}
              <button onClick={() => handleRemove(p._id)}
                className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                <X size={13} className="text-red-500" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-gray-900">${p.price?.toFixed(2)}</span>
                {p.store?.slug && (
                  <Link to={`/store/${p.store.slug}/products/${p.slug || p._id}`}
                    className="text-xs text-indigo-600 font-semibold hover:underline">View →</Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Addresses Section ────────────────────────────────────────────────────────
function AddressesSection() {
  const { user }  = useSelector(s => s.auth)
  const dispatch  = useDispatch()
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({ label: 'Home', street: '', city: '', state: '', country: '', postalCode: '', isDefault: false })

  const openCreate = () => { setEditing(null); setForm({ label: 'Home', street: '', city: '', state: '', country: '', postalCode: '', isDefault: user?.addresses?.length === 0 }); setModal(true) }
  const openEdit = (addr) => { setEditing(addr); setForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state || '', country: addr.country, postalCode: addr.postalCode, isDefault: addr.isDefault }); setModal(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/users/addresses/${editing._id}`, form)
        toast.success('Address updated')
      } else {
        await api.post('/auth/address', form)
        toast.success('Address added')
      }
      await dispatch(fetchCurrentUser())
      setModal(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/addresses/${delTarget._id}`)
      await dispatch(fetchCurrentUser())
      toast.success('Address removed'); setDelTarget(null)
    } catch { toast.error('Failed to delete') }
  }

  const addresses = user?.addresses || []
  const setDefault = async (addr) => {
    try {
      await api.put(`/users/addresses/${addr._id}`, { ...addr, isDefault: true })
      await dispatch(fetchCurrentUser()); toast.success('Default address updated')
    } catch { toast.error('Failed') }
  }

  const addrIcon = (label) => label?.toLowerCase() === 'office' || label?.toLowerCase() === 'work' ? <Briefcase size={16} /> : <Home size={16} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Address</button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No saved addresses</p>
          <p className="text-gray-400 text-sm">Add a shipping address for faster checkout</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr._id} className={`card relative ${addr.isDefault ? 'border-indigo-300 bg-indigo-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${addr.isDefault ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {addrIcon(addr.label)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{addr.label}</p>
                    {addr.isDefault && <span className="text-xs text-indigo-600 font-semibold">Default</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr)} className="text-xs text-indigo-600 font-semibold hover:underline px-2 py-1">Set Default</button>
                  )}
                  <button onClick={() => openEdit(addr)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} className="text-gray-500" /></button>
                  <button onClick={() => setDelTarget(addr)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                </div>
              </div>
              <address className="text-sm text-gray-600 not-italic space-y-0.5">
                <p>{addr.street}</p>
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                <p>{addr.country}</p>
              </address>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Address' : 'Add Address'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Label</label>
              <select value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="input">
                {['Home','Office','Work','Other'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Set as default</span>
              </label>
            </div>
          </div>
          <Input label="Street Address *" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City *" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
            <Input label="State / Province" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="Country *" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required />
            <Input label="Postal Code *" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save size={14} />} Save Address
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} title="Delete Address" message={`Remove "${delTarget?.label}" address?`} danger />
    </div>
  )
}

// ─── Notifications Section ────────────────────────────────────────────────────
function NotificationsSection() {
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    customerApi.getNotifs().then(r => setNotifs(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const markRead = async (id) => {
    await customerApi.markRead(id)
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  const markAll = async () => {
    await customerApi.markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  const unread = notifs.filter(n => !n.isRead).length
  const typeIcon = (t) => ({ order_update: <Package size={14} />, payment: <ShoppingCart size={14} />, refund: <RotateCcw size={14} />, system: <Bell size={14} />, promotion: <Star size={14} /> })[t] || <Bell size={14} />

  if (loading) return <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">{unread} unread notification{unread !== 1 ? 's' : ''}</span>
          <button onClick={markAll} className="text-xs text-indigo-600 font-semibold hover:underline">Mark all read</button>
        </div>
      )}
      {notifs.length === 0 ? (
        <div className="text-center py-12"><Bell size={36} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No notifications yet</p></div>
      ) : notifs.map(n => (
        <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${n.isRead ? 'bg-white border-gray-100' : 'bg-indigo-50 border-indigo-200'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
            {typeIcon(n.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">{format(new Date(n.createdAt), 'MMM d · h:mm a')}</p>
          </div>
          {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />}
        </div>
      ))}
    </div>
  )
}

// ─── Reviews Section ──────────────────────────────────────────────────────────
function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerApi.getMyReviews().then(r => setReviews(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>

  if (reviews.length === 0) return (
    <div className="text-center py-12"><Star size={36} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No reviews yet</p><p className="text-gray-400 text-sm">Buy products and share your experience</p></div>
  )

  return (
    <div className="space-y-4">
      {reviews.map(r => {
        const p = r.product
        return (
          <div key={r._id} className="card">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {p?.images?.[0]?.url && <img src={p.images[0].url} alt={p?.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm truncate">{p?.name}</p>
                    <p className="text-xs text-gray-400">from {r.store?.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1 my-1.5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />)}
                  {r.title && <span className="text-sm font-semibold text-gray-700 ml-1">{r.title}</span>}
                </div>
                {r.body && <p className="text-sm text-gray-600 line-clamp-2">{r.body}</p>}
                {r.vendorReply && (
                  <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2 border-l-4 border-indigo-400">
                    <p className="text-xs font-semibold text-indigo-700 mb-0.5">Store reply:</p>
                    <p className="text-xs text-gray-600">{r.vendorReply.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Returns Section ──────────────────────────────────────────────────────────
function ReturnsSection() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [orders, setOrders]   = useState([])
  const [form, setForm]       = useState({ orderId: '', reason: '', amount: '' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    Promise.all([
      customerApi.getRefunds(),
      ordersApi.getMyOrders(),
    ]).then(([rRes, oRes]) => {
      setRefunds(rRes.data.data)
      setOrders(oRes.data.data.filter(o => ['delivered','shipped','out_for_delivery'].includes(o.status)))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.orderId || !form.reason) return toast.error('Order and reason are required')
    setSaving(true)
    try {
      const { data } = await customerApi.createRefund({ orderId: form.orderId, reason: form.reason, amount: parseFloat(form.amount) || undefined })
      setRefunds(prev => [data.data, ...prev])
      setModal(false); setForm({ orderId: '', reason: '', amount: '' })
      toast.success('Refund request submitted')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit') }
    finally { setSaving(false) }
  }

  const statusColors = { pending: 'badge-yellow', approved: 'badge-blue', rejected: 'badge-red', refunded: 'badge-green' }

  if (loading) return <div className="space-y-3">{Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      {orders.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> Request Refund</button>
        </div>
      )}

      {refunds.length === 0 ? (
        <div className="text-center py-12"><RotateCcw size={36} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No refund requests</p></div>
      ) : refunds.map(r => (
        <div key={r._id} className="card">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${statusColors[r.status]}`}>{r.status}</span>
                <span className="text-sm font-bold text-gray-800">${r.amount?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">Order #{r.order?.orderNumber} · {format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
              <p className="text-sm text-gray-700 mt-2">{r.reason}</p>
            </div>
            {r.vendorNote && (
              <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-xs">
                <p className="text-xs font-semibold text-gray-600">Response: {r.vendorNote}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Request Refund" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Select Order *</label>
            <select value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} className="input">
              <option value="">Choose an order…</option>
              {orders.map(o => <option key={o._id} value={o._id}>#{o.orderNumber} – ${o.pricing?.total?.toFixed(2)} ({o.status})</option>)}
            </select>
          </div>
          <Textarea label="Reason *" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={4} placeholder="Describe the issue…" required />
          <div>
            <label className="label">Refund Amount (leave blank for full refund)</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input" />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleSubmit} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <RotateCcw size={14} />} Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Customer Dashboard ──────────────────────────────────────────────────
const SECTION_MAP = {
  profile:       ProfileSection,
  orders:        OrdersSection,
  wishlist:      WishlistSection,
  addresses:     AddressesSection,
  notifications: NotificationsSection,
  reviews:       ReviewsSection,
  returns:       ReturnsSection,
}

const SECTION_TITLES = {
  profile: 'My Profile', orders: 'Orders', wishlist: 'Wishlist',
  addresses: 'Addresses', notifications: 'Notifications', reviews: 'My Reviews', returns: 'Returns & Refunds',
}

export default function CustomerDashboard() {
  const { user }    = useSelector(s => s.auth)
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const [active, setActive] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const SectionComponent = SECTION_MAP[active] || ProfileSection

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {/* Mobile toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
            <span className="font-semibold text-gray-800">{SECTION_TITLES[active]}</span>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${sidebarOpen ? 'rotate-90' : ''}`} />
          </button>

          <div className={`${sidebarOpen ? 'block' : 'hidden lg:block'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
            {/* User card */}
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="font-bold text-indigo-600">{user?.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-0.5">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActive(id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
              <button onClick={() => { dispatch(logout()); navigate('/') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-2">
                <LogOut size={16} /> Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          <div className="mb-5">
            <h1 className="font-display text-2xl font-bold text-gray-900">{SECTION_TITLES[active]}</h1>
          </div>
          <SectionComponent />
        </main>
      </div>
    </div>
  )
}
