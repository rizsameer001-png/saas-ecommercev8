import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../api/axios'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Grid, List as ListIcon,
  Tag, Calendar, Clock, BookOpen, Image as ImageIcon, Save, X,
  ChevronDown, ChevronUp, Youtube, Upload, Link as LinkIcon,
  Star, Filter, RefreshCw, Layers, FileText, Check, Globe
} from 'lucide-react'
import { Button, Input, Textarea, Select, Spinner } from '../../components/ui/index'
import { CloudinaryUploadButton } from '../../components/ui/CloudinaryUpload'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft:     'bg-gray-100 text-gray-500',
  scheduled: 'bg-blue-100 text-blue-700',
  archived:  'bg-red-100 text-red-700',
}

/* ─── Rich Text Editor ───────────────────────────────────────────────────────── */
function RichEditor({ value, onChange }) {
  const ref = useRef(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl]   = useState('')
  const [linkText, setLinkText] = useState('')
  const [showMedia, setShowMedia] = useState(false)
  const [ytUrl, setYtUrl]       = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const exec = (cmd, val = null) => {
    ref.current?.focus()
    document.execCommand(cmd, false, val)
    sync()
  }
  const sync = () => { if (ref.current) onChange(ref.current.innerHTML) }

  const insertLink = () => {
    if (!linkUrl) return
    exec('createLink', linkUrl)
    if (linkText) {
      // Select all text in last link
    }
    setShowLinkModal(false); setLinkUrl(''); setLinkText('')
  }

  const insertYoutube = () => {
    const match = ytUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/)
    const id = match?.[1]
    if (!id) return toast.error('Invalid YouTube URL')
    const html = `<div style="position:relative;padding-bottom:56.25%;height:0;margin:16px 0"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;inset:0;width:100%;height:100%;border-radius:12px;border:0" allowfullscreen></iframe></div>`
    exec('insertHTML', html)
    setYtUrl(''); setShowMedia(false)
  }

  const insertVideoUrl = () => {
    if (!videoUrl) return
    const html = `<video src="${videoUrl}" controls style="width:100%;border-radius:12px;margin:12px 0"></video>`
    exec('insertHTML', html)
    setVideoUrl(''); setShowMedia(false)
  }

  const handleImageUpload = async (files) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('image', file)
        const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        const url = data.url || data.file?.url
        if (url) exec('insertHTML', `<img src="${url}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:8px 0"/>`)
      }
    } catch { toast.error('Image upload failed') }
    finally { setUploading(false) }
  }

  const TOOLBAR = [
    { icon: 'B', cmd: 'bold',      title: 'Bold',        cls: 'font-black' },
    { icon: 'I', cmd: 'italic',    title: 'Italic',      cls: 'italic' },
    { icon: 'U', cmd: 'underline', title: 'Underline',   cls: 'underline' },
    { sep: true },
    { icon: 'H1', cmd: 'formatBlock', val: 'h1', title: 'Heading 1', cls: 'font-bold text-xs' },
    { icon: 'H2', cmd: 'formatBlock', val: 'h2', title: 'Heading 2', cls: 'font-bold text-xs' },
    { icon: 'H3', cmd: 'formatBlock', val: 'h3', title: 'Heading 3', cls: 'font-bold text-xs' },
    { sep: true },
    { icon: '≡', cmd: 'justifyLeft',  title: 'Align Left' },
    { icon: '≡', cmd: 'justifyCenter', title: 'Center' },
    { icon: '≡', cmd: 'justifyRight',  title: 'Right' },
    { sep: true },
    { icon: '•', cmd: 'insertUnorderedList', title: 'Bullet List' },
    { icon: '1.', cmd: 'insertOrderedList', title: 'Numbered List' },
    { sep: true },
    { icon: '❝', cmd: 'formatBlock', val: 'blockquote', title: 'Blockquote' },
    { icon: '<>', cmd: 'formatBlock', val: 'pre', title: 'Code Block', cls: 'font-mono text-xs' },
    { sep: true },
    { icon: '↩', cmd: 'undo', title: 'Undo' },
    { icon: '↪', cmd: 'redo', title: 'Redo' },
  ]

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-indigo-400 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        {TOOLBAR.map((btn, i) =>
          btn.sep ? <div key={i} className="w-px h-5 bg-gray-200 mx-1" /> : (
            <button key={i} type="button" title={btn.title}
              onMouseDown={e => { e.preventDefault(); exec(btn.cmd, btn.val || null) }}
              className={`px-2 py-1 min-w-[28px] text-xs text-gray-700 hover:bg-gray-200 rounded-lg transition-colors ${btn.cls || ''}`}>
              {btn.icon}
            </button>
          )
        )}
        {/* Link button */}
        <button type="button" title="Insert Link" onClick={() => setShowLinkModal(true)}
          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
          <LinkIcon size={13} />
        </button>
        {/* Media dropdown */}
        <div className="relative">
          <button type="button" title="Insert Media" onClick={() => setShowMedia(s => !s)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1">
            <ImageIcon size={13} /> <ChevronDown size={10} />
          </button>
          {showMedia && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 space-y-3 w-64">
              {/* Image upload */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">Image</p>
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-semibold text-indigo-700 transition-colors">
                  <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleImageUpload(e.target.files)} />
                </label>
                <CloudinaryUploadButton
                  folder="blog"
                  label="Cloudinary Upload"
                  className="mt-1.5 w-full text-xs"
                  onUploaded={({ url }) => { exec('insertHTML', `<img src="${url}" style="max-width:100%;border-radius:12px;margin:8px 0"/>`); setShowMedia(false) }}
                />
              </div>
              {/* YouTube */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">YouTube</p>
                <div className="flex gap-1.5">
                  <input value={ytUrl} onChange={e => setYtUrl(e.target.value)}
                    placeholder="YouTube URL" className="input text-xs py-1.5 flex-1" />
                  <button onClick={insertYoutube} className="btn-primary text-xs px-2 py-1.5 flex-shrink-0">
                    <Youtube size={11} />
                  </button>
                </div>
              </div>
              {/* Video URL */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">Video URL (MP4)</p>
                <div className="flex gap-1.5">
                  <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://..." className="input text-xs py-1.5 flex-1" />
                  <button onClick={insertVideoUrl} className="btn-primary text-xs px-2 py-1.5 flex-shrink-0">Add</button>
                </div>
              </div>
              <button onClick={() => setShowMedia(false)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center">Close</button>
            </div>
          )}
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        className="min-h-[380px] p-5 text-gray-800 focus:outline-none prose max-w-none text-sm leading-relaxed"
        style={{ lineHeight: 1.7 }}
      />

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLinkModal(false)} />
          <div className="relative bg-white rounded-2xl p-5 shadow-xl w-80 space-y-3">
            <h4 className="font-bold text-gray-800">Insert Link</h4>
            <Input label="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
            <div className="flex gap-2">
              <Button onClick={insertLink} className="flex-1 justify-center">Insert</Button>
              <Button onClick={() => setShowLinkModal(false)} variant="secondary" className="flex-1 justify-center">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Blog Post Form (Create/Edit) ──────────────────────────────────────────── */
function PostForm({ post, categories, onSave, onCancel }) {
  const isEdit = !!post
  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', coverImage: '', coverImageAlt: '',
    category: '', tags: '', status: 'draft', featured: false,
    seo: { metaTitle: '', metaDescription: '', keywords: '' },
    media: [],
  })
  const [tab, setTab]   = useState('content')
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [mediaInput, setMediaInput] = useState({ type: 'youtube', url: '' })

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '', excerpt: post.excerpt || '',
        content: post.content || '', coverImage: post.coverImage || '',
        coverImageAlt: post.coverImageAlt || '', category: post.category?._id || '',
        tags: (post.tags || []).join(', '), status: post.status || 'draft',
        featured: post.featured || false,
        seo: { metaTitle: post.seo?.metaTitle || '', metaDescription: post.seo?.metaDescription || '', keywords: (post.seo?.keywords || []).join(', ') },
        media: post.media || [],
      })
    }
  }, [post])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSeo = (k, v) => setForm(f => ({ ...f, seo: { ...f.seo, [k]: v } }))

  const addMediaItem = () => {
    if (!mediaInput.url) return
    const ytMatch = mediaInput.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/)
    const item = { type: mediaInput.type, url: mediaInput.url }
    if (mediaInput.type === 'youtube' && ytMatch?.[1]) {
      item.youtubeId = ytMatch[1]
      item.thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
    }
    set('media', [...form.media, item])
    setMediaInput({ type: 'youtube', url: '' })
  }

  const handleSave = async (statusOverride) => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        seo: { ...form.seo, keywords: form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean) },
        status: statusOverride || form.status,
        category: form.category || null,
      }
      let result
      if (isEdit) {
        result = await api.put(`/blog/${post.slug}`, payload)
      } else {
        result = await api.post('/blog', payload)
      }
      toast.success(isEdit ? 'Post updated' : 'Post created')
      onSave(result.data.data)
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const TABS = [['content','Content'],['media','Media'],['seo','SEO']]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-white">{isEdit ? 'Edit Post' : 'New Post'}</h2>
          <p className="text-gray-400 text-sm">{isEdit ? post.title : 'Create a new blog post'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button onClick={() => handleSave('draft')} loading={saving} variant="secondary">Save Draft</Button>
          <Button onClick={() => handleSave('published')} loading={saving}>
            <Globe size={14} /> Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Post title…"
              className="w-full text-2xl font-display font-bold text-gray-900 placeholder-gray-300 focus:outline-none border-b-2 border-transparent focus:border-indigo-400 pb-2 transition-colors"
            />
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2}
              placeholder="Short excerpt / summary (shown in listing)…"
              className="w-full mt-3 text-sm text-gray-600 placeholder-gray-300 focus:outline-none resize-none leading-relaxed" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {TABS.map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Content tab */}
          {tab === 'content' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <RichEditor value={form.content} onChange={v => set('content', v)} />
            </div>
          )}

          {/* Media tab */}
          {tab === 'media' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Additional Media</h3>
              <div className="flex gap-2 flex-wrap">
                <select value={mediaInput.type} onChange={e => setMediaInput(m => ({ ...m, type: e.target.value }))}
                  className="input text-sm py-2 w-32">
                  <option value="youtube">YouTube</option>
                  <option value="video">Video URL</option>
                  <option value="image">Image URL</option>
                </select>
                <input value={mediaInput.url} onChange={e => setMediaInput(m => ({ ...m, url: e.target.value }))}
                  placeholder={mediaInput.type === 'youtube' ? 'YouTube URL' : 'Media URL'}
                  className="input text-sm py-2 flex-1" />
                <Button onClick={addMediaItem} variant="secondary">Add</Button>
              </div>
              {/* Media list */}
              <div className="grid grid-cols-3 gap-3">
                {form.media.map((m, i) => (
                  <div key={i} className="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    {m.thumbnail && <img src={m.thumbnail} alt="" className="w-full h-full object-cover" />}
                    {m.type === 'image' && m.url && <img src={m.url} alt="" className="w-full h-full object-cover" />}
                    {!m.thumbnail && !m.url && <div className="w-full h-full flex items-center justify-center text-gray-300"><Youtube size={24} /></div>}
                    <button onClick={() => set('media', form.media.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded capitalize">{m.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO tab */}
          {tab === 'seo' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">SEO Settings</h3>
              <Input label="Meta Title" value={form.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)} placeholder={form.title} />
              <Textarea label="Meta Description" value={form.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)} rows={3}
                placeholder="150-160 characters recommended" />
              <Input label="Keywords (comma-separated)" value={form.seo.keywords} onChange={e => setSeo('keywords', e.target.value)} placeholder="blog, ecommerce, guide" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm">Status</h4>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input w-full text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm font-medium text-gray-700">⭐ Featured post</span>
            </label>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm">Category</h4>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input w-full text-sm">
              <option value="">— Select category —</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm">Tags</h4>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="tag1, tag2, tag3" className="input w-full text-sm" />
            <p className="text-xs text-gray-400">Comma-separated</p>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm">Cover Image</h4>
            {form.coverImage && (
              <img src={form.coverImage} alt="cover" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
            )}
            <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)}
              placeholder="Image URL" className="input w-full text-sm" />
            <CloudinaryUploadButton
              folder="blog/covers"
              label="Upload Cover"
              className="w-full text-sm justify-center btn-secondary"
              onUploaded={({ url }) => set('coverImage', url)}
            />
            <input value={form.coverImageAlt} onChange={e => set('coverImageAlt', e.target.value)}
              placeholder="Alt text" className="input w-full text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Category Manager ───────────────────────────────────────────────────────── */
function CategoryManager({ categories, onRefresh }) {
  const [form, setForm] = useState({ name: '', description: '', parent: '', image: '' })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/blog/categories/${editing}`, form)
        toast.success('Category updated')
      } else {
        await api.post('/blog/categories', form)
        toast.success('Category created')
      }
      setForm({ name: '', description: '', parent: '', image: '' }); setEditing(null)
      onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try { await api.delete(`/blog/categories/${id}`); toast.success('Deleted'); onRefresh() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const startEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', parent: cat.parent || '', image: cat.image || '' })
    setEditing(cat._id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-display font-bold text-gray-800">{editing ? 'Edit Category' : 'New Category'}</h3>
        <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
        <div>
          <label className="label">Parent Category (optional)</label>
          <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} className="input w-full">
            <option value="">None (root category)</option>
            {categories.filter(c => c._id !== editing).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <Input label="Image URL (optional)" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
        <div className="flex gap-2">
          <Button onClick={handleSave} loading={saving} className="flex-1 justify-center">
            {editing ? 'Update' : 'Create'}
          </Button>
          {editing && <Button onClick={() => { setEditing(null); setForm({ name:'', description:'', parent:'', image:'' }) }} variant="secondary">Cancel</Button>}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-800">All Categories ({categories.length})</h3>
        </div>
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No categories yet</p>
          ) : categories.map(cat => (
            <div key={cat._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              {cat.image
                ? <img src={cat.image} alt={cat.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><Tag size={14} className="text-indigo-600" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.postCount || 0} posts{cat.parent ? ' · Sub-category' : ''}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main AdminBlog Page ────────────────────────────────────────────────────── */
export default function AdminBlog() {
  const [view,       setView]       = useState('list')    // 'list' | 'grid' | 'create' | 'edit' | 'categories'
  const [posts,      setPosts]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editPost,   setEditPost]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [layout,     setLayout]     = useState('grid') // grid | list inside post listing

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (search)     params.set('search',   search)
      if (catFilter)  params.set('category', catFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await api.get(`/blog?${params}`)
      setPosts(data.data || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch { toast.error('Failed to load posts') }
    finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/blog/categories')
      setCategories(data.data || [])
    } catch {}
  }

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { if (view === 'list' || view === 'grid') fetchPosts() }, [page, catFilter, statusFilter, view])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchPosts() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (post) => {
    try {
      await api.patch(`/blog/${post.slug}/toggle`)
      toast.success(`Post ${post.status === 'published' ? 'unpublished' : 'published'}`)
      fetchPosts()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.title}"?`)) return
    try { await api.delete(`/blog/${post.slug}`); toast.success('Deleted'); fetchPosts() }
    catch { toast.error('Failed to delete') }
  }

  const handleSaved = (savedPost) => {
    fetchPosts(); fetchCategories()
    setView('list'); setEditPost(null)
  }

  if (view === 'create') return <PostForm categories={categories} onSave={handleSaved} onCancel={() => setView('list')} />
  if (view === 'edit' && editPost) return <PostForm post={editPost} categories={categories} onSave={handleSaved} onCancel={() => { setView('list'); setEditPost(null) }} />
  if (view === 'categories') return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-display font-bold text-white">Blog Categories</h1></div>
        <Button onClick={() => setView('list')} variant="secondary">← Back to Posts</Button>
      </div>
      <CategoryManager categories={categories} onRefresh={fetchCategories} />
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Blog</h1>
          <p className="text-gray-400 text-sm">Manage posts, categories, and content</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('categories')} variant="secondary"><Layers size={14} /> Categories</Button>
          <Button onClick={() => setView('create')}><Plus size={14} /> New Post</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1">
          {[['grid', Grid], ['list', ListIcon]].map(([l, Icon]) => (
            <button key={l} onClick={() => setLayout(l)}
              className={`p-1.5 rounded-lg transition-colors ${layout === l ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No posts found</p>
          <Button onClick={() => setView('create')} className="mt-4"><Plus size={14} /> Create First Post</Button>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(post => (
            <div key={post._id} className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all group">
              <div className="relative aspect-video bg-gray-900 overflow-hidden">
                {post.coverImage
                  ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><FileText size={32} className="text-gray-600" /></div>}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>{post.status}</span>
                  {post.featured && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐</span>}
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-white text-sm leading-snug mb-1.5 line-clamp-2">{post.title}</p>
                {post.excerpt && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  {post.category && <span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded">{post.category.name}</span>}
                  <span className="flex items-center gap-1"><Clock size={10} /> {post.stats?.readTime || 1}m</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {post.stats?.views || 0}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditPost(post); setView('edit') }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-gray-400 border border-gray-700 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                    <Edit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleToggle(post)}
                    className="p-1.5 text-gray-500 border border-gray-700 rounded-xl hover:border-gray-500 transition-colors"
                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                    {post.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => handleDelete(post)}
                    className="p-1.5 text-gray-500 border border-gray-700 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {['Post','Category','Status','Views','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {posts.map(post => (
                <tr key={post._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.coverImage
                        ? <img src={post.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-gray-500" /></div>}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate max-w-48">{post.title}</p>
                        {post.featured && <span className="text-amber-400 text-xs">⭐ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{post.category?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{post.stats?.views || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditPost(post); setView('edit') }} className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => handleToggle(post)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-lg">
                        {post.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => handleDelete(post)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm font-semibold text-gray-400 border border-gray-600 rounded-xl hover:border-gray-400 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 text-sm font-semibold text-gray-400 border border-gray-600 rounded-xl hover:border-gray-400 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
