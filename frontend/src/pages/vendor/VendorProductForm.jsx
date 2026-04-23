import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { productsApi, categoriesApi } from '../../api/services'
import api from '../../api/axios'
import {
  ArrowLeft, Plus, X, Save, Package, Image as ImageIcon,
  Play, Tag, Star, Flame, Sparkles, Youtube, Upload, Eye
} from 'lucide-react'
import { Button, Input, Textarea, Select, Spinner } from '../../components/ui/index'
import AttributeVariantPanel from '../../components/vendor/AttributeVariantPanel'
import { CloudinaryImageGallery } from '../../components/ui/CloudinaryUpload'
import toast from 'react-hot-toast'

const DEFAULT = {
  name: '', description: '', shortDescription: '',
  price: '', comparePrice: '', costPrice: '',
  sku: '', barcode: '', inventory: 0, lowStockAlert: 10,
  trackInventory: true, allowBackorder: false,
  status: 'active', isDigital: false, hasVariants: false,
  freeShipping: false, requiresShipping: true,
  images: [], videos: [], tags: [], category: '', weight: '',
  labels: { isFeatured: false, isNewArrival: false, isOnSale: false },
  productAttributes: [],
  variants: [],
  seo: { metaTitle: '', metaDescription: '' },
}

// ── Local image drag-drop uploader ──────────────────────────────────────────
function ImageGrid({ images, onChange }) {
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const addUrl = () => {
    if (!urlInput.trim()) return
    onChange([...images, { url: urlInput.trim(), isPrimary: images.length === 0, alt: '' }])
    setUrlInput('')
  }

  const handleFiles = async (files) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).slice(0, 10).forEach(f => fd.append('images', f))
      const { data } = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const newImgs = data.files.map((f, i) => ({ url: f.url, isPrimary: images.length === 0 && i === 0, alt: f.originalName || '' }))
      onChange([...images, ...newImgs])
      toast.success(`${data.files.length} image${data.files.length !== 1 ? 's' : ''} uploaded`)
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${uploading ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'}`}
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading
          ? <div className="flex flex-col items-center gap-2"><Spinner size="md" className="mx-auto" /><p className="text-sm text-indigo-600 font-medium">Uploading…</p></div>
          : <><Upload size={24} className="mx-auto text-gray-400 mb-2" /><p className="text-sm font-medium text-gray-600">Drop images here or click to browse</p><p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP · Max 10MB · Up to 10 images</p></>
        }
      </div>
      {/* URL input */}
      <div className="flex gap-2">
        <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
          placeholder="Or paste Cloudinary / image URL…"
          className="input flex-1 text-sm" />
        <Button type="button" variant="secondary" onClick={addUrl}><Plus size={14} /></Button>
      </div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <div key={i} className={`relative group aspect-square rounded-xl overflow-hidden border-2 ${img.isPrimary ? 'border-indigo-500' : 'border-gray-100'}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => { e.target.src = 'https://placehold.co/120?text=Error' }} />
              {img.isPrimary && <span className="absolute top-1 left-1 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Primary</span>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {!img.isPrimary && <button type="button" onClick={() => onChange(images.map((im, j) => ({ ...im, isPrimary: j === i })))} className="bg-white text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded-lg shadow">Primary</button>}
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"><X size={10} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Video manager ─────────────────────────────────────────────────────────────
function VideoManager({ videos, onChange }) {
  const [ytInput, setYtInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const extractYtId = url => url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] || null

  const addYoutube = () => {
    const url = ytInput.trim()
    if (!url) return
    const id = extractYtId(url)
    if (!id) { toast.error('Invalid YouTube URL. Use youtube.com/watch?v=... or youtu.be/...'); return }
    onChange([...videos, { type: 'youtube', url, youtubeId: id, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, title: '' }])
    setYtInput('')
    toast.success('YouTube video added')
  }

  const uploadVideo = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('video', file)
      const { data } = await api.post('/upload/video', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange([...videos, { type: 'cloudinary', url: data.url, thumbnail: '', title: file.name }])
      toast.success('Video uploaded!')
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
          <input value={ytInput} onChange={e => setYtInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addYoutube() } }}
            placeholder="YouTube URL (youtube.com/watch?v=...)"
            className="input pl-9 text-sm w-full" />
        </div>
        <Button type="button" variant="secondary" onClick={addYoutube}><Plus size={14} /> Add</Button>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50">
          {uploading ? <Spinner size="sm" /> : <Upload size={14} />} {uploading ? 'Uploading…' : 'Upload video (MP4/WebM, max 100MB)'}
        </button>
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
      </div>
      {videos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {videos.map((v, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100 border border-gray-100">
              {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play size={24} className="text-gray-400" /></div>}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><Play size={12} className="text-white ml-0.5" /></div></div>
              {v.type === 'youtube' && <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">YT</span>}
              <button type="button" onClick={() => onChange(videos.filter((_, j) => j !== i))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Nested category selector ─────────────────────────────────────────────────
function CategorySelector({ categories, value, onChange }) {
  const sorted = [...categories].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name))
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input">
      <option value="">No category</option>
      {sorted.map(c => <option key={c._id} value={c._id}>{'— '.repeat(c.depth)}{c.name}{c.productCount > 0 ? ` (${c.productCount})` : ''}</option>)}
    </select>
  )
}

// ── Main Form ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basic',      label: 'Basic Info',   icon: Package },
  { id: 'media',      label: 'Media',        icon: ImageIcon },
  { id: 'attributes', label: 'Attributes & Variants', icon: Tag },
  { id: 'labels',     label: 'Labels',       icon: Star },
  { id: 'inventory',  label: 'Inventory',    icon: Package },
  { id: 'seo',        label: 'SEO',          icon: Tag },
]

export default function VendorProductForm() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { myStore } = useSelector(s => s.store)
  const [form, setForm]         = useState(DEFAULT)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tab, setTab]           = useState('basic')
  const isEditing = !!id

  useEffect(() => {
    if (!myStore?.slug) return
    api.get('/categories?activeOnly=false', { headers: { 'x-store-slug': myStore.slug } })
      .then(r => setCategories(r.data.data)).catch(() => {})
    if (isEditing) {
      setLoading(true)
      productsApi.getOne(myStore.slug, id).then(r => {
        const p = r.data.data
        setForm({
          ...DEFAULT, ...p,
          price: p.price || '', comparePrice: p.comparePrice || '', costPrice: p.costPrice || '',
          category: p.category?._id || p.category || '',
          labels: p.labels || DEFAULT.labels,
          productAttributes: p.productAttributes || [],
          variants: p.variants || [],
        })
      }).catch(() => toast.error('Product not found')).finally(() => setLoading(false))
    }
  }, [myStore?.slug, id, isEditing])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setLabel = (k, v) => setForm(f => ({ ...f, labels: { ...f.labels, [k]: v } }))
  const addTag = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); setTagInput('') } }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.name.trim()) return toast.error('Product name is required')
    if (!form.price || Number(form.price) <= 0) return toast.error('Price is required')
    if (!myStore?.slug) return toast.error('Store not found')
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:        parseFloat(form.price) || 0,
        comparePrice: parseFloat(form.comparePrice) || undefined,
        costPrice:    parseFloat(form.costPrice) || undefined,
        inventory:    parseInt(form.inventory) || 0,
        lowStockAlert:parseInt(form.lowStockAlert) || 10,
        weight:       parseFloat(form.weight) || undefined,
        category:     form.category || undefined,
        hasVariants:  form.variants?.length > 0,
      }
      if (isEditing) { await productsApi.update(myStore.slug, id, payload); toast.success('Product updated!') }
      else           { await productsApi.create(myStore.slug, payload);     toast.success('Product published!') }
      navigate('/dashboard/products')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="xl" className="mx-auto" /></div>

  return (
    <div className="max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="page-subtitle">{form.name || 'Fill in product details below'}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Discard</Button>
          {isEditing && myStore?.slug && form.slug && (
            <a href={`/store/${myStore.slug}/products/${form.slug}`} target="_blank" rel="noreferrer">
              <Button variant="secondary" type="button"><Eye size={14} /> Preview</Button>
            </a>
          )}
          <Button onClick={handleSubmit} loading={saving}><Save size={14} /> {isEditing ? 'Update' : 'Publish'}</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tab nav */}
            <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <t.icon size={13} />{t.label}
                </button>
              ))}
            </div>

            {/* ── BASIC ── */}
            {tab === 'basic' && (
              <div className="card space-y-5">
                <Input label="Product Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name" required autoFocus />
                <Textarea label="Full Description" value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Detailed description…" />
                <Textarea label="Short Description" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} rows={2} placeholder="Brief listing summary…" />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Price *" type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" required />
                  <Input label="Compare Price" type="number" step="0.01" min="0" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} placeholder="0.00" />
                  <Input label="Cost Price" type="number" step="0.01" min="0" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0.00" />
                </div>
                {form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                  <p className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                    🏷️ {Math.round(((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100)}% discount badge will show
                  </p>
                )}
                {/* Tags */}
                <div>
                  <label className="label">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Add tag, press Enter" className="input flex-1 text-sm" />
                    <Button type="button" variant="secondary" onClick={addTag}><Plus size={14} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {t}<button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MEDIA ── */}
            {tab === 'media' && (
              <div className="space-y-5">
                <div className="card space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-indigo-600" />
                    <h3 className="font-display font-bold text-gray-800">Product Images</h3>
                    <span className="badge badge-blue">{form.images.length} image{form.images.length !== 1 ? 's' : ''}</span>
                  </div>
                  <CloudinaryImageGallery images={form.images} onChange={imgs => set('images', imgs)} folder="products" />
                </div>
                <div className="card space-y-4">
                  <div className="flex items-center gap-2">
                    <Youtube size={16} className="text-red-500" />
                    <h3 className="font-display font-bold text-gray-800">Product Videos</h3>
                    <span className="badge badge-red">{form.videos.length} video{form.videos.length !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-gray-500">Add YouTube links or upload video files. Videos appear on the product page with a play button.</p>
                  <VideoManager videos={form.videos} onChange={vids => set('videos', vids)} />
                </div>
              </div>
            )}

            {/* ── ATTRIBUTES & VARIANTS ── */}
            {tab === 'attributes' && (
              <div className="card space-y-4">
                <div>
                  <h3 className="font-display font-bold text-gray-800">Attributes & Variants</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select store attributes to apply. Attributes marked "Used for Variants" let you auto-generate variant combinations (e.g., UK 5 / Red, UK 6 / Red…).
                    <a href="/dashboard/attributes" target="_blank" className="text-indigo-600 ml-1 hover:underline">Manage attributes →</a>
                  </p>
                </div>
                <AttributeVariantPanel
                  storeSlug={myStore?.slug}
                  price={parseFloat(form.price) || 0}
                  currency={myStore?.settings?.currencySymbol || '$'}
                  variants={form.variants}
                  onVariantsChange={v => set('variants', v)}
                  productAttributes={form.productAttributes}
                  onAttributesChange={a => set('productAttributes', a)}
                />
              </div>
            )}

            {/* ── LABELS ── */}
            {tab === 'labels' && (
              <div className="card space-y-4">
                <h3 className="font-display font-bold text-gray-800">Product Labels & Badges</h3>
                <p className="text-sm text-gray-500">Labels appear as visual badges and power marketplace filtering sections (New Arrivals, On Sale, Featured).</p>
                {[
                  { key: 'isFeatured',   label: '⭐ Featured',    desc: 'Shown in Featured sections. Your hand-picked top products.' },
                  { key: 'isNewArrival', label: '✨ New Arrival',  desc: 'Auto-expires in 30 days. Use for recently launched products.' },
                  { key: 'isOnSale',     label: '🔥 On Sale',     desc: 'Auto-enabled when Compare Price > Price. Drives urgency.' },
                ].map(({ key, label, desc }) => {
                  const active = form.labels[key]
                  return (
                    <label key={key} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${active ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="checkbox" checked={active} onChange={e => setLabel(key, e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-indigo-600" />
                      <div><p className="font-semibold text-gray-800">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
                    </label>
                  )
                })}
              </div>
            )}

            {/* ── INVENTORY ── */}
            {tab === 'inventory' && (
              <div className="card space-y-5">
                <h3 className="font-display font-bold text-gray-800">Inventory & Shipping</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="SKU" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="PROD-001" />
                  <Input label="Barcode" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="1234567890" />
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { k: 'trackInventory',   l: 'Track inventory' },
                    { k: 'allowBackorder',   l: 'Allow backorders' },
                    { k: 'requiresShipping', l: 'Requires shipping' },
                    { k: 'freeShipping',     l: 'Free shipping' },
                    { k: 'isDigital',        l: 'Digital product' },
                  ].map(({ k, l }) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">{l}</span>
                    </label>
                  ))}
                </div>
                {form.trackInventory && !form.hasVariants && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Stock Quantity" type="number" min="0" value={form.inventory} onChange={e => set('inventory', e.target.value)} />
                    <Input label="Low Stock Alert" type="number" min="0" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
                  </div>
                )}
                {form.variants?.length > 0 && (
                  <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm text-purple-700">
                    ℹ️ Inventory is managed per variant in the Attributes & Variants tab.
                  </div>
                )}
                <Input label="Weight (grams)" type="number" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="250" className="max-w-xs" />
              </div>
            )}

            {/* ── SEO ── */}
            {tab === 'seo' && (
              <div className="card space-y-5">
                <h3 className="font-display font-bold text-gray-800">SEO Settings</h3>
                <Input label="Meta Title" value={form.seo?.metaTitle} onChange={e => set('seo', { ...form.seo, metaTitle: e.target.value })} placeholder="Product meta title for search engines" />
                <Textarea label="Meta Description" value={form.seo?.metaDescription} onChange={e => set('seo', { ...form.seo, metaDescription: e.target.value })} rows={3} placeholder="Description for search engines (150–160 chars)…" />
                {form.seo?.metaTitle && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Google Preview</p>
                    <p className="text-blue-600 text-sm font-medium truncate">{form.seo.metaTitle}</p>
                    <p className="text-green-700 text-xs">{myStore?.slug}.com/products/{form.slug || 'product-url'}</p>
                    {form.seo.metaDescription && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{form.seo.metaDescription}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card space-y-3">
              <h4 className="font-display font-bold text-gray-800 text-sm">Status</h4>
              <Select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">🟢 Active – visible</option>
                <option value="draft">🟡 Draft – hidden</option>
                <option value="inactive">🔴 Inactive</option>
              </Select>
            </div>
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-gray-800 text-sm">Category</h4>
                <a href="/dashboard/categories" target="_blank" className="text-xs text-indigo-600 hover:underline">Manage →</a>
              </div>
              <CategorySelector categories={categories} value={form.category} onChange={v => set('category', v)} />
              {form.category && (() => {
                const cat = categories.find(c => c._id === form.category)
                return cat ? <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">{cat.path?.join(' › ') || cat.name}</p> : null
              })()}
            </div>
            <div className="card space-y-2">
              <h4 className="font-display font-bold text-gray-800 text-sm">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {form.labels.isFeatured   && <span className="badge bg-amber-100 text-amber-700">⭐ Featured</span>}
                {form.labels.isNewArrival && <span className="badge bg-emerald-100 text-emerald-700">✨ New</span>}
                {form.labels.isOnSale     && <span className="badge bg-red-100 text-red-700">🔥 Sale</span>}
                {!form.labels.isFeatured && !form.labels.isNewArrival && !form.labels.isOnSale && <p className="text-xs text-gray-400">None set</p>}
              </div>
            </div>
            <div className="card space-y-2">
              <h4 className="font-display font-bold text-gray-800 text-sm">Media & Variants</h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-semibold text-gray-700">{form.images.length}</span> image{form.images.length !== 1 ? 's' : ''}</p>
                <p><span className="font-semibold text-gray-700">{form.videos.length}</span> video{form.videos.length !== 1 ? 's' : ''}</p>
                <p><span className="font-semibold text-gray-700">{form.variants?.length || 0}</span> variant{(form.variants?.length || 0) !== 1 ? 's' : ''}</p>
                <p><span className="font-semibold text-gray-700">{form.productAttributes?.length || 0}</span> attribute{(form.productAttributes?.length || 0) !== 1 ? 's' : ''}</p>
              </div>
              {(form.images.find(i => i.isPrimary) || form.images[0]) && (
                <img src={form.images.find(i => i.isPrimary)?.url || form.images[0]?.url} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-100 mt-1" />
              )}
            </div>
            <Button type="submit" onClick={handleSubmit} loading={saving} className="w-full justify-center py-3 text-base">
              <Save size={16} /> {isEditing ? 'Update Product' : 'Publish Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
