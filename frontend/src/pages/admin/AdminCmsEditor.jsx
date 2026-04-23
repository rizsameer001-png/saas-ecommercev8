import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
  Plus, Edit2, Trash2, Save, X, Eye, Globe, FileText,
  ChevronDown, ChevronUp, Image, Type, AlignLeft, Grid,
  HelpCircle, Megaphone, Layout, Check, AlertCircle, ExternalLink
} from 'lucide-react'
import { Button, Input, Textarea, Select, Modal, ConfirmDialog, Spinner } from '../../components/ui/index'
import { CloudinaryUploadButton } from '../../components/ui/CloudinaryUpload'
import toast from 'react-hot-toast'

const SECTION_TYPES = [
  { value: 'hero',         label: 'Hero Banner',    icon: Layout },
  { value: 'text',         label: 'Text Block',     icon: Type },
  { value: 'image_text',   label: 'Image + Text',   icon: Image },
  { value: 'feature_grid', label: 'Feature Grid',   icon: Grid },
  { value: 'faq',          label: 'FAQ List',       icon: HelpCircle },
  { value: 'cta',          label: 'Call to Action', icon: Megaphone },
]

const FOOTER_GROUPS = [
  { value: '',        label: 'Not in footer' },
  { value: 'company', label: 'Company column' },
  { value: 'legal',   label: 'Legal column' },
  { value: 'support', label: 'Support column' },
]

// ─── Section Editor ───────────────────────────────────────────────────────────
function SectionEditor({ section, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(true)
  const TypeIcon = SECTION_TYPES.find(t => t.value === section.type)?.icon || Type

  const set = (key, val) => onChange({ ...section, [key]: val })
  const setItem = (i, key, val) => {
    const items = [...(section.items || [])]
    items[i] = { ...items[i], [key]: val }
    onChange({ ...section, items })
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <TypeIcon size={15} className="text-gray-500 flex-shrink-0" />
        <p className="font-semibold text-gray-700 text-sm flex-1 capitalize">{section.type?.replace('_', ' ')} Section</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp}   className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"><ChevronUp size={13} /></button>
          <button type="button" onClick={onMoveDown} className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"><ChevronDown size={13} /></button>
          <button type="button" onClick={onRemove}   className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
          <button type="button" onClick={() => setOpen(o => !o)} className="p-1.5 hover:bg-gray-200 rounded text-gray-400">
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Section Type</label>
              <select value={section.type} onChange={e => set('type', e.target.value)} className="input">
                {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Background Color</label>
              <input type="color" value={section.bgColor || '#ffffff'}
                onChange={e => set('bgColor', e.target.value)} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
            </div>
          </div>

          <Input label="Heading" value={section.heading || ''} onChange={e => set('heading', e.target.value)} placeholder="Section heading..." />
          <Textarea label="Body Text" value={section.body || ''} onChange={e => set('body', e.target.value)} rows={4} placeholder="Section content..." />

          {/* Image fields */}
          {(section.type === 'hero' || section.type === 'image_text') && (
            <div className="space-y-2">
              <label className="label">Image</label>
              <div className="flex gap-2">
                <Input value={section.imageUrl || ''} onChange={e => set('imageUrl', e.target.value)} placeholder="Image URL…" className="flex-1" />
                <CloudinaryUploadButton folder="cms" label="Upload" onUploaded={r => set('imageUrl', r.url)} />
              </div>
              {section.imageUrl && <img src={section.imageUrl} alt="" className="h-24 w-40 object-cover rounded-xl border border-gray-100" />}
              <Input label="Image Alt Text" value={section.imageAlt || ''} onChange={e => set('imageAlt', e.target.value)} />
              {section.type === 'image_text' && (
                <div>
                  <label className="label">Image Position</label>
                  <select value={section.imagePosition || 'right'} onChange={e => set('imagePosition', e.target.value)} className="input">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* CTA fields */}
          {(section.type === 'cta' || section.type === 'hero') && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="CTA Button Label" value={section.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="Get Started" />
              <Input label="CTA URL" value={section.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} placeholder="/register" />
            </div>
          )}

          {/* Items (feature_grid / faq) */}
          {(section.type === 'feature_grid' || section.type === 'faq') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label">{section.type === 'faq' ? 'FAQ Items' : 'Feature Items'}</label>
                <button type="button" onClick={() => onChange({ ...section, items: [...(section.items || []), { icon: '', heading: '', body: '' }] })}
                  className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  <Plus size={11} /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {(section.items || []).map((item, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 space-y-2">
                      {section.type === 'feature_grid' && (
                        <Input value={item.icon || ''} onChange={e => setItem(i, 'icon', e.target.value)} placeholder="Emoji icon (e.g. 🚀)" className="text-sm" />
                      )}
                      <Input value={item.heading || ''} onChange={e => setItem(i, 'heading', e.target.value)}
                        placeholder={section.type === 'faq' ? 'Question…' : 'Feature title…'} className="text-sm" />
                      <Textarea value={item.body || ''} onChange={e => setItem(i, 'body', e.target.value)}
                        placeholder={section.type === 'faq' ? 'Answer…' : 'Feature description…'} rows={2} />
                    </div>
                    <button type="button" onClick={() => onChange({ ...section, items: (section.items || []).filter((_, j) => j !== i) })}
                      className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page Form Modal ──────────────────────────────────────────────────────────
function PageForm({ page, onSave, onClose }) {
  const [form, setForm] = useState({
    slug:        '',
    title:       '',
    metaTitle:   '',
    metaDesc:    '',
    content:     '',
    sections:    [],
    isPublished: false,
    showInFooter: false,
    footerLabel: '',
    footerGroup: 'legal',
    ...(page || {}),
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addSection = (type) => {
    set('sections', [...(form.sections || []), { type, heading: '', body: '', order: (form.sections || []).length }])
  }

  const updateSection = (i, updated) => {
    const secs = [...(form.sections || [])]
    secs[i] = updated
    set('sections', secs)
  }

  const moveSection = (i, dir) => {
    const secs = [...(form.sections || [])]
    const j = i + dir
    if (j < 0 || j >= secs.length) return
    ;[secs[i], secs[j]] = [secs[j], secs[i]]
    set('sections', secs)
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return toast.error('Title required')
    if (!form.slug?.trim())  return toast.error('Slug required')
    setSaving(true)
    try {
      if (page) { await api.put(`/admin-ext/cms/${page.slug}`, form); toast.success('Page updated!') }
      else       { await api.post('/admin-ext/cms', form);          toast.success('Page created!') }
      onSave()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Page Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Privacy Policy" autoFocus />
        <Input label="Slug *" value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="privacy-policy" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Meta Title (SEO)" value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} />
        <Input label="Meta Description" value={form.metaDesc} onChange={e => set('metaDesc', e.target.value)} />
      </div>
      <Textarea label="Raw Content (HTML/Markdown)" value={form.content} onChange={e => set('content', e.target.value)} rows={6} placeholder="<h2>Introduction</h2><p>...</p>" />

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800 text-sm">Page Sections</p>
          <div className="relative group">
            <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg">
              <Plus size={12} /> Add Section
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 hidden group-hover:block w-48">
              {SECTION_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => addSection(t.value)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  <t.icon size={13} className="text-gray-400" /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {(form.sections || []).map((sec, i) => (
            <SectionEditor key={i} section={sec}
              onChange={updated => updateSection(i, updated)}
              onRemove={() => set('sections', (form.sections || []).filter((_, j) => j !== i))}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)} />
          ))}
          {(form.sections || []).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
              No sections — add some above or use raw content
            </p>
          )}
        </div>
      </div>

      {/* Footer + publish settings */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
        <div>
          <label className="label">Footer Column</label>
          <select value={form.footerGroup} onChange={e => set('footerGroup', e.target.value)} className="input">
            {FOOTER_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <Input label="Footer Link Label" value={form.footerLabel} onChange={e => set('footerLabel', e.target.value)} placeholder="Privacy Policy" />
      </div>

      <div className="flex items-center gap-6">
        {[
          { key: 'isPublished',  label: 'Published (visible to public)' },
          { key: 'showInFooter', label: 'Show in Footer' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 justify-end sticky bottom-0 bg-white pt-3 pb-1 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {form.slug && form.isPublished && (
          <a href={`/page/${form.slug}`} target="_blank" rel="noreferrer">
            <Button variant="secondary"><Eye size={13} /> Preview</Button>
          </a>
        )}
        <Button onClick={handleSave} loading={saving}><Save size={13} /> {page ? 'Update' : 'Create'} Page</Button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminCmsEditor() {
  const [pages,    setPages]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/admin-ext/cms?all=true')
      .then(r => setPages(r.data.data || []))
      .catch(() => toast.error('Failed to load pages'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => { setEditing(null); setModal(true) }
  const openEdit   = (p)  => { setEditing(p);  setModal(true) }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin-ext/cms/${delTarget.slug}`)
      toast.success('Page deleted'); setDelTarget(null); fetch()
    } catch { toast.error('Failed to delete') }
  }

  const QUICK_PAGES = [
    { slug: 'privacy-policy', title: 'Privacy Policy', group: 'legal' },
    { slug: 'terms-of-service', title: 'Terms of Service', group: 'legal' },
    { slug: 'about-us', title: 'About Us', group: 'company' },
    { slug: 'contact', title: 'Contact', group: 'support' },
    { slug: 'refund-policy', title: 'Refund Policy', group: 'legal' },
    { slug: 'cookie-policy', title: 'Cookie Policy', group: 'legal' },
  ]

  const existingSlugs = pages.map(p => p.slug)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">CMS Pages</h1>
          <p className="text-gray-400 text-sm mt-1">Manage public pages — privacy, terms, about, etc.</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> New Page</Button>
      </div>

      {/* Quick create starters */}
      {QUICK_PAGES.filter(q => !existingSlugs.includes(q.slug)).length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-3">Quick Start Templates</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PAGES.filter(q => !existingSlugs.includes(q.slug)).map(q => (
              <button key={q.slug} type="button"
                onClick={() => {
                  setEditing({ slug: q.slug, title: q.title, footerLabel: q.title, footerGroup: q.group, showInFooter: true, isPublished: true, sections: [], content: '' })
                  setModal(true)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors">
                <Plus size={11} /> {q.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pages list */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No pages yet</p>
            <p className="text-xs mt-1">Create your first CMS page above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-xs">
                <th className="px-5 py-3 text-left font-semibold uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Slug</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Footer</th>
                <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide">Published</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Sections</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {pages.map(page => (
                <tr key={page.slug} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white">{page.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">/{page.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {page.showInFooter ? (
                      <span className="text-green-400 capitalize">{page.footerGroup} · {page.footerLabel}</span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {page.isPublished
                      ? <Check size={15} className="text-green-400 mx-auto" />
                      : <X size={15} className="text-gray-600 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{page.sections?.length || 0} sections</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {page.isPublished && (
                        <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer"
                          className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => openEdit(page)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDelTarget(page)} className="p-1.5 hover:bg-red-900/40 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Page form modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing?.slug ? `Edit: ${editing.title || editing.slug}` : 'New CMS Page'}
        size="xl">
        <PageForm page={editing} onSave={() => { setModal(false); fetch() }} onClose={() => setModal(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${delTarget?.title}"?`}
        message="This page will be permanently deleted and removed from the footer."
        danger />
    </div>
  )
}
