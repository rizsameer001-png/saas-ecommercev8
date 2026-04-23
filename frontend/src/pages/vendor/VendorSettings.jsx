import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateMyStore, fetchMyStore } from '../../store/storeSlice'
import api from '../../api/axios'
import { Save, Store, Palette, CreditCard, Globe, Camera, Upload, X, Image, Loader } from 'lucide-react'
import { Button, Input, Select, Textarea, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

function MediaUploadBox({ label, value, onChange, aspectClass = 'aspect-video', hint }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(data.url)
      toast.success(`${label} uploaded`)
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div>
      <p className="label">{label}</p>
      <div className={`relative ${aspectClass} bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-all group cursor-pointer`}
        onClick={() => inputRef.current?.click()}>
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Camera size={12} /> Change
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange('') }}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <X size={12} /> Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <><Spinner size="md" className="mx-auto" /><p className="text-sm text-indigo-600 font-medium">Uploading…</p></>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  {aspectClass.includes('square') ? <Store size={20} className="text-gray-400" /> : <Image size={20} className="text-gray-400" />}
                </div>
                <p className="text-sm font-medium text-gray-600">Click to upload {label}</p>
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
              </>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
      </div>
      {/* Or paste URL */}
      <div className="mt-2">
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Or paste image URL..." className="input text-sm" />
      </div>
    </div>
  )
}

export default function VendorSettings() {
  const { myStore } = useSelector(s => s.store)
  const dispatch = useDispatch()
  const [saving, setSaving] = useState(false)
  const [tab, setTab]       = useState('branding')
  const [form, setForm]     = useState({})

  useEffect(() => {
    if (myStore) setForm({
      name:        myStore.name        || '',
      description: myStore.description || '',
      logo:        myStore.logo        || '',
      banner:      myStore.banner      || '',
      contact:     myStore.contact     || {},
      branding:    myStore.branding    || {},
      settings:    myStore.settings    || {},
      seo:         myStore.seo         || {},
      social:      myStore.social      || {},
    })
  }, [myStore])

  const set = (path, val) => {
    const keys = path.split('.')
    setForm(f => {
      const n = { ...f }
      let obj = n
      for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] = { ...obj[keys[i]] }; obj = obj[keys[i]] }
      obj[keys[keys.length - 1]] = val
      return n
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await dispatch(updateMyStore({ id: myStore._id, ...form }))
      await dispatch(fetchMyStore())
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'branding',  label: 'Brand & Media',  icon: Palette },
    { id: 'general',   label: 'General',         icon: Store   },
    { id: 'commerce',  label: 'Commerce',        icon: CreditCard },
    { id: 'seo',       label: 'SEO & Social',    icon: Globe   },
  ]

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Store Settings</h1><p className="page-subtitle">Customize your store appearance and configuration</p></div>
        <Button onClick={handleSave} loading={saving}><Save size={15} /> Save Changes</Button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="card space-y-6">
        {/* ── Branding & Media ── */}
        {tab === 'branding' && (
          <>
            <div>
              <h3 className="font-display font-bold text-gray-800 mb-1">Store Logo</h3>
              <p className="text-sm text-gray-500 mb-4">Shown in the storefront header and on store cards. Recommended: 200×200px, transparent PNG.</p>
              <div className="w-48">
                <MediaUploadBox label="Logo" value={form.logo} onChange={v => set('logo', v)}
                  aspectClass="aspect-square" hint="200×200px PNG recommended" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-display font-bold text-gray-800 mb-1">Store Banner</h3>
              <p className="text-sm text-gray-500 mb-4">Hero banner shown at the top of your storefront. Recommended: 1400×400px.</p>
              <MediaUploadBox label="Banner" value={form.banner} onChange={v => set('banner', v)}
                aspectClass="aspect-[3.5/1]" hint="1400×400px recommended" />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-display font-bold text-gray-800 mb-4">Color Theme</h3>
              <div className="grid grid-cols-3 gap-5">
                {[
                  ['primaryColor',   'Primary Color',   'Main buttons, highlights'],
                  ['secondaryColor', 'Secondary Color', 'Accents and gradients'],
                  ['accentColor',    'Accent Color',    'Badges and sale tags'],
                ].map(([k, l, d]) => (
                  <div key={k}>
                    <label className="label">{l}</label>
                    <p className="text-xs text-gray-400 mb-2">{d}</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.branding?.[k] || '#6366f1'}
                        onChange={e => set(`branding.${k}`, e.target.value)}
                        className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer" />
                      <input type="text" value={form.branding?.[k] || ''} onChange={e => set(`branding.${k}`, e.target.value)}
                        className="input flex-1 font-mono text-sm" placeholder="#6366f1" />
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {['#6366f1','#ec4899','#10b981','#f97316','#3b82f6','#8b5cf6','#ef4444','#111827'].map(c => (
                        <button key={c} type="button" onClick={() => set(`branding.${k}`, c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${form.branding?.[k] === c ? 'border-gray-800 scale-110' : 'border-white shadow-sm'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── General ── */}
        {tab === 'general' && (
          <>
            <Input label="Store Name *" value={form.name} onChange={e => set('name', e.target.value)} />
            <Textarea label="Store Description" value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe your store to customers..." />
            <Input label="Contact Email" type="email" value={form.contact?.email || ''} onChange={e => set('contact.email', e.target.value)} />
            <Input label="Contact Phone" value={form.contact?.phone || ''} onChange={e => set('contact.phone', e.target.value)} />
            <Input label="Website" value={form.contact?.website || ''} onChange={e => set('contact.website', e.target.value)} placeholder="https://yoursite.com" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" value={form.contact?.address?.city || ''} onChange={e => set('contact.address.city', e.target.value)} />
              <Input label="Country" value={form.contact?.address?.country || ''} onChange={e => set('contact.address.country', e.target.value)} />
            </div>
          </>
        )}

        {/* ── Commerce ── */}
        {tab === 'commerce' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select value={form.settings?.currency || 'USD'} onChange={e => set('settings.currency', e.target.value)} className="input">
                  {[['USD','US Dollar ($)'],['EUR','Euro (€)'],['GBP','British Pound (£)'],['INR','Indian Rupee (₹)'],['AED','UAE Dirham'],['SAR','Saudi Riyal'],['AUD','Australian Dollar'],['CAD','Canadian Dollar']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <Input label="Currency Symbol" value={form.settings?.currencySymbol || '$'} onChange={e => set('settings.currencySymbol', e.target.value)} />
            </div>
            <Input label="Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.settings?.taxRate ?? 0} onChange={e => set('settings.taxRate', parseFloat(e.target.value) || 0)} />
            <Input label="Free Shipping Threshold" type="number" min="0" value={form.settings?.freeShippingThreshold ?? 0} onChange={e => set('settings.freeShippingThreshold', parseFloat(e.target.value) || 0)} />
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {[
                ['allowGuestCheckout','Allow Guest Checkout'],
                ['shippingEnabled','Enable Shipping'],
                ['requireEmailVerification','Require Email Verification'],
              ].map(([k,l]) => (
                <label key={k} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.settings?.[k] ?? true} onChange={e => set(`settings.${k}`, e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── SEO & Social ── */}
        {tab === 'seo' && (
          <>
            <Input label="Meta Title" value={form.seo?.metaTitle || ''} onChange={e => set('seo.metaTitle', e.target.value)} placeholder="Your Store Name – Tagline" />
            <Textarea label="Meta Description" value={form.seo?.metaDescription || ''} onChange={e => set('seo.metaDescription', e.target.value)} rows={3} />
            <div className="border-t border-gray-100 pt-5">
              <h4 className="font-semibold text-gray-700 mb-3">Social Links</h4>
              {[['instagram','Instagram'],['twitter','Twitter / X'],['facebook','Facebook'],['youtube','YouTube']].map(([k,l]) => (
                <Input key={k} label={l} value={form.social?.[k] || ''} onChange={e => set(`social.${k}`, e.target.value)} placeholder={`https://${k}.com/yourstore`} className="mb-3" />
              ))}
            </div>
          </>
        )}
      </div>

      <Button onClick={handleSave} loading={saving} className="w-full justify-center py-3 text-base">
        <Save size={16} /> Save All Settings
      </Button>
    </div>
  )
}
