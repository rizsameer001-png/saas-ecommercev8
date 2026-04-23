import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { Clock, Eye, Tag, Grid, List as ListIcon, Search, Calendar, ChevronRight, Star } from 'lucide-react'
import { format } from 'date-fns'

/* ─── Post card (grid) ───────────────────────────────────────────────────────── */
function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-card transition-all flex flex-col">
      <div className="relative overflow-hidden aspect-[16/9] bg-gray-100">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.coverImageAlt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <span className="text-4xl">📝</span>
            </div>}
        {post.featured && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⭐ Featured
          </span>
        )}
        {post.category && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
            {post.category.name}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Draft'}
          </span>
          <span className="flex items-center gap-1"><Clock size={11} /> {post.stats?.readTime || 1}m read</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {post.stats?.views || 0}</span>
        </div>
        <h2 className="font-display font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          {post.author?.name && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                {post.author.name[0]}
              </div>
              <span className="text-xs text-gray-500">{post.author.name}</span>
            </div>
          )}
          <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
            Read more <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Post row (list view) ───────────────────────────────────────────────────── */
function PostRow({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex gap-5 bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-card transition-all items-start">
      <div className="w-32 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">📝</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {post.category && (
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{post.category.name}</span>
          )}
          {post.featured && <span className="text-amber-600 text-xs">⭐</span>}
        </div>
        <h3 className="font-display font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.excerpt}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {post.author?.name && <span>{post.author.name}</span>}
          <span>·</span>
          <span className="flex items-center gap-1"><Calendar size={10} /> {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : ''}</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {post.stats?.readTime || 1}m</span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Category Sidebar ───────────────────────────────────────────────────────── */
function CategorySidebar({ categories, selectedCat, onSelect, recentPosts }) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag size={16} className="text-indigo-600" /> Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <button onClick={() => onSelect('')}
              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${!selectedCat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
              All Posts
              <span className="text-xs text-gray-400">{categories.reduce((a, c) => a + (c.postCount || 0), 0)}</span>
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat._id}>
              <button onClick={() => onSelect(cat._id)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedCat === cat._id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {cat.name}
                <span className="text-xs text-gray-400">{cat.postCount || 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" /> Recent Posts
          </h3>
          <ul className="space-y-3">
            {recentPosts.map(post => (
              <li key={post._id}>
                <Link to={`/blog/${post.slug}`}
                  className="flex gap-3 group">
                  <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                    {post.coverImage
                      ? <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">📝</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Main Blog List Page ─────────────────────────────────────────────────────── */
export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts,       setPosts]       = useState([])
  const [categories,  setCategories]  = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 })
  const [layout,      setLayout]      = useState('grid')

  const catId  = searchParams.get('category') || ''
  const tag    = searchParams.get('tag')      || ''
  const search = searchParams.get('search')   || ''
  const page   = parseInt(searchParams.get('page') || '1')

  const setParam = (key, val) => setSearchParams(prev => {
    const p = new URLSearchParams(prev)
    if (val) p.set(key, val); else p.delete(key)
    if (key !== 'page') p.delete('page')
    return p
  })

  useEffect(() => {
    api.get('/blog/categories').then(r => setCategories(r.data.data || [])).catch(() => {})
    api.get('/blog?status=published&limit=5&sort=-publishedAt').then(r => setRecentPosts(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ status: 'published', page, limit: 9 })
    if (catId)  params.set('category', catId)
    if (tag)    params.set('tag',      tag)
    if (search) params.set('search',   search)
    api.get(`/blog?${params}`)
      .then(r => { setPosts(r.data.data || []); setPagination(r.data.pagination || {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [catId, tag, search, page])

  const activeCatName = categories.find(c => c._id === catId)?.name

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero header */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          {activeCatName ? `${activeCatName}` : tag ? `#${tag}` : search ? `"${search}"` : 'Our Blog'}
        </h1>
        <p className="text-gray-500 text-lg">
          {activeCatName ? `Articles in ${activeCatName}` : tag ? `Posts tagged #${tag}` : search ? `Search results` : 'Insights, guides, and updates from our team'}
        </p>
      </div>

      {/* Search + layout toggle */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            defaultValue={search}
            onChange={e => {
              const val = e.target.value
              clearTimeout(window._bsearch)
              window._bsearch = setTimeout(() => setParam('search', val), 400)
            }}
            placeholder="Search posts…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
          />
        </div>
        <div className="flex gap-1 border border-gray-200 rounded-xl p-1 bg-white">
          {[['grid', Grid], ['list', ListIcon]].map(([l, Icon]) => (
            <button key={l} onClick={() => setLayout(l)}
              className={`p-2 rounded-lg transition-colors ${layout === l ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-700'}`}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Posts area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className={`skeleton rounded-2xl ${layout === 'grid' ? 'aspect-[3/4]' : 'h-32'}`} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">📝</p>
              <h3 className="font-display font-bold text-xl text-gray-800 mb-2">No posts found</h3>
              <p className="text-gray-400 text-sm mb-4">Try a different search or category</p>
              <button onClick={() => setSearchParams({})}
                className="text-sm font-semibold text-indigo-600 hover:underline">
                Clear filters
              </button>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => <PostCard key={post._id} post={post} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => <PostRow key={post._id} post={post} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setParam('page', String(page - 1))} disabled={page === 1}
                className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 transition-all bg-white">
                ← Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setParam('page', String(p))}
                    className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:border-indigo-400 bg-white'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => setParam('page', String(page + 1))} disabled={page === pagination.pages}
                className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 transition-all bg-white">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <CategorySidebar
            categories={categories}
            selectedCat={catId}
            onSelect={id => setParam('category', id)}
            recentPosts={recentPosts}
          />
        </div>
      </div>
    </div>
  )
}
