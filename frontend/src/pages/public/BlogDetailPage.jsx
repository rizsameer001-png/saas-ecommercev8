import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Clock, Eye, Calendar, Tag, ChevronLeft, ChevronRight, Share2, Heart, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

/* ─── Similar Post Card ──────────────────────────────────────────────────────── */
function SimilarCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors">
      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-xl">📝</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">{post.title}</p>
        <p className="text-xs text-gray-400 mt-1">
          {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : ''}
        </p>
      </div>
    </Link>
  )
}

/* ─── Category Sidebar ───────────────────────────────────────────────────────── */
function DetailSidebar({ categories, currentCategoryId, similarPosts }) {
  return (
    <div className="space-y-6 sticky top-24">
      {/* Similar posts */}
      {similarPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-600" /> Similar Posts
          </h3>
          <div className="space-y-2">
            {similarPosts.map(p => <SimilarCard key={p._id} post={p} />)}
          </div>
        </div>
      )}

      {/* Category navigation */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" /> Browse Categories
          </h3>
          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat._id}>
                <Link to={`/blog?category=${cat._id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    cat._id === currentCategoryId
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}>
                  {cat.name}
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{cat.postCount || 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Main BlogDetailPage ────────────────────────────────────────────────────── */
export default function BlogDetailPage() {
  const { slug }  = useParams()
  const navigate  = useNavigate()
  const [post,     setPost]     = useState(null)
  const [similar,  setSimilar]  = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    Promise.all([
      api.get(`/blog/${slug}`),
      api.get('/blog/categories'),
    ]).then(([postRes, catRes]) => {
      setPost(postRes.data.data)
      setSimilar(postRes.data.similar || [])
      setCats(catRes.data.data || [])
    }).catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-pulse">
      <div className="skeleton h-10 w-2/3 rounded-xl mb-4" />
      <div className="skeleton h-80 rounded-2xl mb-8" />
      <div className="space-y-3">
        {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-4 rounded w-full" />)}
      </div>
    </div>
  )

  if (error || !post) return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-6xl mb-5">📄</p>
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Post Not Found</h1>
      <Link to="/blog" className="text-indigo-600 font-semibold hover:underline">← Back to Blog</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <ChevronRight size={13} />
        <Link to="/blog" className="hover:text-gray-700">Blog</Link>
        {post.category && (
          <>
            <ChevronRight size={13} />
            <Link to={`/blog?category=${post.category._id}`} className="hover:text-gray-700">{post.category.name}</Link>
          </>
        )}
        <ChevronRight size={13} />
        <span className="text-gray-600 truncate max-w-48">{post.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main content */}
        <article className="lg:col-span-3">
          {/* Category & meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {post.category && (
              <Link to={`/blog?category=${post.category._id}`}
                className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                {post.category.name}
              </Link>
            )}
            {post.featured && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>
            )}
            {(post.tags || []).map(tag => (
              <Link key={tag} to={`/blog?tag=${tag}`}
                className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">#{tag}</Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-6 border-b border-gray-100 mb-8">
            {post.author?.name && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xs">
                  {post.author.name[0]}
                </div>
                <span className="font-medium text-gray-700">{post.author.name}</span>
              </div>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : 'Draft'}
            </span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {post.stats?.readTime || 1} min read</span>
            <span className="flex items-center gap-1.5"><Eye size={14} /> {post.stats?.views || 0} views</span>
            {/* Share */}
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!') }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 transition-colors ml-auto">
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
              <img src={post.coverImage} alt={post.coverImageAlt || post.title}
                className="w-full max-h-[500px] object-cover" />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium border-l-4 border-indigo-500 pl-5 italic">
              {post.excerpt}
            </p>
          )}

          {/* Rich content */}
          {post.content && (
            <div
              className="prose prose-lg max-w-none text-gray-700 mb-10"
              style={{
                lineHeight: 1.8,
                fontSize: '16px',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Media gallery */}
          {post.media?.length > 0 && (
            <div className="mt-10 mb-8">
              <h3 className="font-display font-bold text-gray-900 text-xl mb-5">Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.media.map((m, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-gray-100">
                    {m.type === 'youtube' && m.youtubeId && (
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${m.youtubeId}`}
                          title={m.caption || 'Video'}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {m.type === 'video' && m.url && (
                      <video src={m.url} controls className="w-full rounded-2xl" />
                    )}
                    {m.type === 'image' && m.url && (
                      <img src={m.url} alt={m.alt || m.caption || ''} className="w-full object-cover rounded-2xl" />
                    )}
                    {m.caption && <p className="text-xs text-center text-gray-400 py-2 px-3">{m.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-100">
              {post.tags.map(tag => (
                <Link key={tag} to={`/blog?tag=${tag}`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-sm rounded-full font-medium transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Author card */}
          {post.author?.name && (
            <div className="mt-10 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 flex gap-5 items-start">
              <div className="w-16 h-16 bg-indigo-200 rounded-2xl flex items-center justify-center text-indigo-700 font-display font-bold text-2xl flex-shrink-0">
                {post.author.name[0]}
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 text-lg">Written by {post.author.name}</p>
                {post.author.bio && <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{post.author.bio}</p>}
              </div>
            </div>
          )}

          {/* Navigation prev/next */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
            <Link to="/blog" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
              <ChevronLeft size={16} /> Back to Blog
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <div>
          <DetailSidebar
            categories={cats}
            currentCategoryId={post.category?._id}
            similarPosts={similar}
          />
        </div>
      </div>
    </div>
  )
}
