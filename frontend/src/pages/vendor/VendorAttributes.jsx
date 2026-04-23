import { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { attributesApi } from '../../api/services'
import api from '../../api/axios'
import {
  Plus, Edit2, Trash2, Zap, ChevronDown, ChevronUp, X, Save,
  Grip, Check, ToggleLeft, ToggleRight, Table, Info, Upload,
  List, Type, Hash, Palette, Image, CheckSquare, AlertCircle
} from 'lucide-react'
import { Button, Input, Textarea, Select, Modal, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  dropdown:     { icon: List,        label: 'Dropdown',      desc: 'Single select list' },
  checkbox:     { icon: CheckSquare, label: 'Checkbox',      desc: 'Multiple select checkboxes' },
  color_swatch: { icon: Palette,     label: 'Color Swatch',  desc: 'Visual color picker circles' },
  image_swatch: { icon: Image,       label: 'Image Swatch',  desc: 'Image thumbnail selectors' },
  text:         { icon: Type,        label: 'Text Input',    desc: 'Free-text entry field' },
  number:       { icon: Hash,        label: 'Number Input',  desc: 'Numeric entry field' },
}

const PRESET_ICONS = {
  size_uk: '👟', size_clothing: '👕', color: '🎨', material: '🧵',
  storage: '💾', ram: '🧠', book_format: '📚', package: '📦', weight: '⚖️',
}

// ─── Attribute Value Row ──────────────────────────────────────────────────────
function ValueRow({ val, type, onDelete, onEdit }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-xl hover:border-gray-200 group">
      {type === 'color_swatch' && (
        <div className="w-6 h-6 rounded-full border-2 border-white shadow flex-shrink-0"
          style={{ backgroundColor: val.colorHex || '#ccc' }} />
      )}
      {type === 'image_swatch' && val.imageUrl && (
        <img src={val.imageUrl} alt={val.label} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{val.label}</p>
        <p className="text-xs text-gray-400 truncate font-mono">{val.value}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(val)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
          <Edit2 size={12} />
        </button>
        <button onClick={() => onDelete(val._id)} className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Add/Edit Value Modal ─────────────────────────────────────────────────────
function ValueModal({ isOpen, onClose, onSave, type, editing }) {
  const [form, setForm] = useState({ label: '', value: '', colorHex: '#000000', imageUrl: '' })
  const imgInputRef = useRef()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (editing) setForm({ label: editing.label, value: editing.value, colorHex: editing.colorHex || '#000000', imageUrl: editing.imageUrl || '' })
    else setForm({ label: '', value: '', colorHex: '#000000', imageUrl: '' })
  }, [editing, isOpen])

  const autoSlug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  const handleLabelChange = (e) => {
    const l = e.target.value
    setForm(f => ({ ...f, label: l, ...(!f.value || f.value === autoSlug(f.label) ? { value: autoSlug(l) } : {}) }))
  }

  const uploadImage = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, imageUrl: data.url }))
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Value' : 'Add Value'} size="sm">
      <div className="space-y-3">
        <Input label="Label *" value={form.label} onChange={handleLabelChange} placeholder="e.g. UK 6" autoFocus />
        <Input label="Value (key)" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="auto-generated" />

        {type === 'color_swatch' && (
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))}
                className="w-12 h-12 rounded-xl cursor-pointer border border-gray-200" />
              <Input value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} placeholder="#000000" className="font-mono" />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {['#111827','#EF4444','#3B82F6','#22C55E','#F59E0B','#EC4899','#A855F7','#F97316','#9CA3AF','#FFFFFF'].map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, colorHex: c }))}
                  className={`w-7 h-7 rounded-full border-2 ${form.colorHex === c ? 'border-indigo-500 scale-110' : 'border-white'} shadow transition-transform`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        )}

        {type === 'image_swatch' && (
          <div>
            <label className="label">Swatch Image</label>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl border mb-2" />}
            <div className="flex gap-2">
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Image URL..." className="flex-1" />
              <button type="button" onClick={() => imgInputRef.current?.click()}
                className="btn-secondary flex items-center gap-1.5 px-3">
                {uploading ? <Spinner size="sm" /> : <Upload size={13} />}
              </button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.label}><Save size={13} /> Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Attribute Card ───────────────────────────────────────────────────────────
function AttributeCard({ attr, onEdit, onDelete, onRefresh, storeSlug }) {
  const [expanded, setExpanded] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [editValue, setEditValue] = useState(null)
  const [delValue, setDelValue]   = useState(null)
  const { icon: Icon, label: typeLabel } = TYPE_CONFIG[attr.type] || TYPE_CONFIG.dropdown

  const handleAddValue = async (form) => {
    try {
      await attributesApi.addValue(storeSlug, attr._id, form)
      toast.success('Value added'); setAddModal(false); onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleEditValue = async (form) => {
    try {
      await attributesApi.updateValue(storeSlug, attr._id, editValue._id, form)
      toast.success('Value updated'); setEditValue(null); onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDeleteValue = async () => {
    try {
      await attributesApi.deleteValue(storeSlug, attr._id, delValue)
      toast.success('Value removed'); setDelValue(null); onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-all shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-gray-900">{attr.name}</p>
            <span className="badge badge-blue text-[10px]">{typeLabel}</span>
            {attr.usedForVariants && <span className="badge bg-purple-100 text-purple-700 text-[10px]">Variants</span>}
            {attr.filterable     && <span className="badge bg-green-100 text-green-700 text-[10px]">Filterable</span>}
            {attr.required       && <span className="badge bg-red-100 text-red-700 text-[10px]">Required</span>}
            {attr.preset         && <span className="badge bg-amber-100 text-amber-700 text-[10px]">Preset</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Attribute Values ({attr.values?.length || 0})
            {attr.sizeChart && <span className="ml-2 text-blue-500">📏 Size chart attached</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(attr)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(attr)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Values preview (collapsed: show chips) */}
      {!expanded && attr.values?.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {attr.values.slice(0, 8).map(v => (
            <span key={v._id} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-gray-600">
              {attr.type === 'color_swatch' && (
                <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: v.colorHex }} />
              )}
              {v.label}
            </span>
          ))}
          {attr.values.length > 8 && (
            <button onClick={() => setExpanded(true)} className="text-xs text-indigo-600 font-semibold">
              +{attr.values.length - 8} more
            </button>
          )}
        </div>
      )}

      {/* Expanded: full value list + add */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 py-4 space-y-3">
          {attr.values?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attr.values.map(v => (
                <ValueRow key={v._id} val={v} type={attr.type}
                  onDelete={(vid) => setDelValue(vid)}
                  onEdit={(val) => setEditValue(val)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No values yet — add some below</p>
          )}

          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <Plus size={14} /> Add Value
          </button>

          {/* Size chart preview */}
          {attr.sizeChart?.rows?.length > 0 && (
            <details className="border border-blue-100 rounded-xl overflow-hidden">
              <summary className="px-4 py-2.5 bg-blue-50 text-sm font-semibold text-blue-700 cursor-pointer flex items-center gap-2">
                <Table size={13} /> {attr.sizeChart.name || 'Size Chart'}
              </summary>
              <div className="overflow-x-auto p-3">
                <table className="text-xs w-full">
                  <thead>
                    <tr>{attr.sizeChart.headers.map(h => <th key={h} className="px-3 py-1.5 text-left bg-gray-50 font-semibold text-gray-600">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {attr.sizeChart.rows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, j) => <td key={j} className="px-3 py-1.5 text-gray-700">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Value modals */}
      <ValueModal isOpen={addModal}   onClose={() => setAddModal(false)}   onSave={handleAddValue} type={attr.type} editing={null} />
      <ValueModal isOpen={!!editValue} onClose={() => setEditValue(null)}  onSave={handleEditValue} type={attr.type} editing={editValue} />

      <ConfirmDialog isOpen={!!delValue} onClose={() => setDelValue(null)} onConfirm={handleDeleteValue}
        title="Delete Value" message="Remove this attribute value?" danger />
    </div>
  )
}

// ─── Create/Edit Attribute Modal ──────────────────────────────────────────────
const EMPTY_ATTR = { name: '', type: 'dropdown', usedForVariants: false, filterable: true, required: false, sortOrder: 0, sizeChart: null }

function AttributeFormModal({ isOpen, onClose, onSave, editing }) {
  const [form, setForm]         = useState(EMPTY_ATTR)
  const [hasSizeChart, setHasSizeChart] = useState(false)
  const [sizeChart, setSizeChart]       = useState({ name: '', headers: ['','','',''], rows: [['']] })

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, type: editing.type, usedForVariants: editing.usedForVariants, filterable: editing.filterable, required: editing.required, sortOrder: editing.sortOrder || 0 })
      if (editing.sizeChart) { setHasSizeChart(true); setSizeChart(editing.sizeChart) }
      else { setHasSizeChart(false) }
    } else {
      setForm(EMPTY_ATTR); setHasSizeChart(false)
    }
  }, [editing, isOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    const payload = { ...form }
    if (hasSizeChart) payload.sizeChart = sizeChart
    else payload.sizeChart = null
    onSave(payload)
  }

  const addSizeChartRow = () => setSizeChart(sc => ({ ...sc, rows: [...sc.rows, Array(sc.headers.length).fill('')] }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Attribute' : 'New Attribute'} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Attribute Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Color, UK Size" autoFocus />
          <div>
            <label className="label">Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
              {Object.entries(TYPE_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label} — {c.desc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'usedForVariants', label: 'Used for Variants', desc: 'Auto-generates size/color combinations' },
            { key: 'filterable',      label: 'Filterable in Shop', desc: 'Show in storefront filter sidebar' },
            { key: 'required',        label: 'Required Field',     desc: 'Customer must select a value' },
          ].map(({ key, label, desc }) => (
            <label key={key} className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${form[key] ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="font-semibold text-gray-800 text-sm">{label}</span>
              </div>
              <p className="text-xs text-gray-500">{desc}</p>
            </label>
          ))}
        </div>

        {/* Size chart */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={hasSizeChart} onChange={e => setHasSizeChart(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">Attach Size Chart</span>
            <span className="text-xs text-gray-400">(optional)</span>
          </label>

          {hasSizeChart && (
            <div className="border border-blue-100 rounded-xl p-4 space-y-3 bg-blue-50">
              <Input label="Chart Title" value={sizeChart.name} onChange={e => setSizeChart(sc => ({ ...sc, name: e.target.value }))} placeholder="e.g. Footwear Size Guide" />
              <div>
                <label className="label">Column Headers</label>
                <div className="flex gap-2">
                  {sizeChart.headers.map((h, i) => (
                    <input key={i} value={h} onChange={e => setSizeChart(sc => ({ ...sc, headers: sc.headers.map((x, j) => j === i ? e.target.value : x) }))}
                      className="input text-sm" placeholder={`Col ${i+1}`} />
                  ))}
                  <button type="button" onClick={() => setSizeChart(sc => ({ ...sc, headers: [...sc.headers, ''], rows: sc.rows.map(r => [...r, '']) }))}
                    className="btn-secondary px-2"><Plus size={13} /></button>
                </div>
              </div>
              <div>
                <label className="label">Rows</label>
                <div className="space-y-2">
                  {sizeChart.rows.map((row, ri) => (
                    <div key={ri} className="flex gap-2">
                      {row.map((cell, ci) => (
                        <input key={ci} value={cell} onChange={e => setSizeChart(sc => ({ ...sc, rows: sc.rows.map((r, rii) => rii === ri ? r.map((c, cii) => cii === ci ? e.target.value : c) : r) }))}
                          className="input text-sm" placeholder={sizeChart.headers[ci] || `Col ${ci+1}`} />
                      ))}
                      <button type="button" onClick={() => setSizeChart(sc => ({ ...sc, rows: sc.rows.filter((_, i) => i !== ri) }))}
                        className="p-2 text-red-400 hover:text-red-600"><X size={13} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addSizeChartRow} className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                    <Plus size={11} /> Add Row
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name}><Save size={13} /> {editing ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorAttributes() {
  const { myStore } = useSelector(s => s.store)
  const [attrs, setAttrs]       = useState([])
  const [presets, setPresets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [formModal, setFormModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [delError, setDelError]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [applyingPreset, setApplyingPreset] = useState(null)

  const storeSlug = myStore?.slug

  const fetchAll = useCallback(async () => {
    if (!storeSlug) return
    setLoading(true)
    try {
      const [aRes, pRes] = await Promise.all([
        attributesApi.getAll(storeSlug),
        attributesApi.getPresets(storeSlug),
      ])
      setAttrs(aRes.data.data)
      setPresets(pRes.data.data)
    } catch { toast.error('Failed to load attributes') }
    finally { setLoading(false) }
  }, [storeSlug])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => { setEditing(null); setFormModal(true) }
  const openEdit   = (attr) => { setEditing(attr); setFormModal(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await attributesApi.update(storeSlug, editing._id, form)
        toast.success('Attribute updated')
      } else {
        await attributesApi.create(storeSlug, form)
        toast.success('Attribute created')
      }
      setFormModal(false); fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDelError('')
    try {
      await attributesApi.delete(storeSlug, delTarget._id)
      toast.success('Attribute deleted'); setDelTarget(null); fetchAll()
    } catch (err) { setDelError(err.response?.data?.message || 'Failed to delete') }
  }

  const handleApplyPreset = async (key) => {
    setApplyingPreset(key)
    try {
      await attributesApi.applyPreset(storeSlug, key)
      toast.success('Preset added!'); fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply preset') }
    finally { setApplyingPreset(null) }
  }

  const variantAttrs = attrs.filter(a => a.usedForVariants)
  const filterAttrs  = attrs.filter(a => a.filterable && !a.usedForVariants)
  const infoAttrs    = attrs.filter(a => !a.usedForVariants && !a.filterable)

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Product Attributes</h1>
          <p className="page-subtitle">{attrs.length} attributes · reusable across all products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowPresets(!showPresets)}>
            <Zap size={14} /> Quick Presets
          </Button>
          <Button onClick={openCreate}><Plus size={15} /> New Attribute</Button>
        </div>
      </div>

      {/* Presets panel */}
      {showPresets && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-800">Quick Presets</h3>
            <button onClick={() => setShowPresets(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">One-click add pre-configured attribute templates:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {presets.map(p => (
              <button key={p.key} onClick={() => handleApplyPreset(p.key)}
                disabled={p.alreadyAdded || applyingPreset === p.key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  p.alreadyAdded ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' : 'border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                }`}>
                <span className="text-2xl flex-shrink-0">{PRESET_ICONS[p.key] || '🏷️'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.values} values{p.hasSizeChart ? ' · chart' : ''}</p>
                  {p.alreadyAdded && <p className="text-xs text-green-600 font-semibold">✓ Added</p>}
                  {applyingPreset === p.key && <Spinner size="sm" className="mt-1" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {loading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : attrs.length === 0 ? (
        <EmptyState
          icon={List}
          title="No attributes yet"
          description="Create reusable attributes (Color, Size, Material…) that can be applied to any product and auto-generate variants."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowPresets(true)}><Zap size={14} /> Quick Presets</Button>
              <Button onClick={openCreate}><Plus size={14} /> Create Attribute</Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Variant attributes */}
          {variantAttrs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-purple-500 rounded-full" /> Used for Variants ({variantAttrs.length})
              </h3>
              <div className="space-y-3">
                {variantAttrs.map(a => (
                  <AttributeCard key={a._id} attr={a} onEdit={openEdit}
                    onDelete={(a) => { setDelTarget(a); setDelError('') }}
                    onRefresh={fetchAll} storeSlug={storeSlug} />
                ))}
              </div>
            </div>
          )}

          {/* Filter attributes */}
          {filterAttrs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" /> Filterable ({filterAttrs.length})
              </h3>
              <div className="space-y-3">
                {filterAttrs.map(a => (
                  <AttributeCard key={a._id} attr={a} onEdit={openEdit}
                    onDelete={(a) => { setDelTarget(a); setDelError('') }}
                    onRefresh={fetchAll} storeSlug={storeSlug} />
                ))}
              </div>
            </div>
          )}

          {/* Info attributes */}
          {infoAttrs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full" /> Information Only ({infoAttrs.length})
              </h3>
              <div className="space-y-3">
                {infoAttrs.map(a => (
                  <AttributeCard key={a._id} attr={a} onEdit={openEdit}
                    onDelete={(a) => { setDelTarget(a); setDelError('') }}
                    onRefresh={fetchAll} storeSlug={storeSlug} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AttributeFormModal isOpen={formModal} onClose={() => setFormModal(false)} onSave={handleSave} editing={editing} />

      {/* Delete Confirm */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setDelTarget(null); setDelError('') }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-500" /></div>
            <h3 className="font-display text-lg font-bold text-center text-gray-900 mb-1">Delete "{delTarget.name}"?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">This will remove the attribute and all its values.</p>
            {delError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{delError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setDelTarget(null); setDelError('') }}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
