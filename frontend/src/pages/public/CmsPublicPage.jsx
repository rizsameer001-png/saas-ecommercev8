import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { ArrowRight, ChevronRight } from 'lucide-react'

// Render a single CMS section
function Section({ section }) {
  const { type, heading, body, imageUrl, imageAlt, imagePosition, items, ctaLabel, ctaUrl, bgColor } = section

  const wrapperStyle = bgColor ? { backgroundColor: bgColor } : {}

  if (type === 'hero') return (
    <div className="relative overflow-hidden rounded-3xl text-white py-20 px-10 bg-gradient-to-br from-indigo-900 to-purple-900" style={wrapperStyle}>
      {imageUrl && <img src={imageUrl} alt={imageAlt || ''} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
      <div className="relative max-w-3xl">
        {heading && <h1 className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight">{heading}</h1>}
        {body && <p className="text-white/80 text-xl leading-relaxed mb-8">{body}</p>}
        {ctaLabel && ctaUrl && (
          <Link to={ctaUrl} className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-4 rounded-2xl hover:bg-gray-100 transition-all">
            {ctaLabel} <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )

  if (type === 'text') return (
    <div className="max-w-3xl mx-auto py-8" style={wrapperStyle}>
      {heading && <h2 className="font-display text-3xl font-bold text-gray-900 mb-5">{heading}</h2>}
      {body && <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{body}</div>}
    </div>
  )

  if (type === 'image_text') {
    const isRight = imagePosition !== 'left'
    return (
      <div className="py-8" style={wrapperStyle}>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center ${!isRight ? 'md:flex-row-reverse' : ''}`}>
          {isRight ? (
            <>
              <div>
                {heading && <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-4">{heading}</h2>}
                {body && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>}
                {ctaLabel && ctaUrl && (
                  <Link to={ctaUrl} className="inline-flex items-center gap-2 mt-5 font-semibold text-indigo-600 hover:text-indigo-800">
                    {ctaLabel} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              {imageUrl && <img src={imageUrl} alt={imageAlt || heading || ''} className="w-full rounded-2xl shadow-lg object-cover" />}
            </>
          ) : (
            <>
              {imageUrl && <img src={imageUrl} alt={imageAlt || heading || ''} className="w-full rounded-2xl shadow-lg object-cover" />}
              <div>
                {heading && <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-4">{heading}</h2>}
                {body && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>}
                {ctaLabel && ctaUrl && (
                  <Link to={ctaUrl} className="inline-flex items-center gap-2 mt-5 font-semibold text-indigo-600 hover:text-indigo-800">
                    {ctaLabel} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (type === 'feature_grid') return (
    <div className="py-8" style={wrapperStyle}>
      {heading && <h2 className="font-display text-3xl font-bold text-gray-900 mb-3 text-center">{heading}</h2>}
      {body && <p className="text-gray-500 text-center max-w-xl mx-auto mb-10">{body}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(items || []).map((item, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-card transition-all">
            {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
            {item.heading && <h3 className="font-bold text-gray-900 mb-2">{item.heading}</h3>}
            {item.body && <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )

  if (type === 'faq') return (
    <div className="max-w-2xl mx-auto py-8" style={wrapperStyle}>
      {heading && <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">{heading}</h2>}
      <div className="space-y-4">
        {(items || []).map((item, i) => (
          <details key={i} className="border border-gray-100 rounded-2xl overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-800 flex items-center justify-between hover:bg-gray-50 transition-colors select-none">
              {item.heading}
              <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
            </summary>
            {item.body && <p className="px-5 pb-4 text-gray-600 leading-relaxed">{item.body}</p>}
          </details>
        ))}
      </div>
    </div>
  )

  if (type === 'cta') return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl py-16 px-10 text-center" style={wrapperStyle}>
      {imageUrl && <img src={imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-5" />}
      {heading && <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{heading}</h2>}
      {body && <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">{body}</p>}
      {ctaLabel && ctaUrl && (
        <Link to={ctaUrl} className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all shadow-lg">
          {ctaLabel} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )

  // custom / fallback
  return body ? (
    <div className="py-6" style={wrapperStyle}>
      {heading && <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">{heading}</h2>}
      <div className="text-gray-600 whitespace-pre-line leading-relaxed">{body}</div>
    </div>
  ) : null
}

export default function CmsPublicPage() {
  const { slug }  = useParams()
  const [page, setPage]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/admin-ext/cms/${slug}`)
      .then(r => setPage(r.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-20 space-y-6">
      {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-32 w-full rounded-2xl" />)}
    </div>
  )

  if (error || !page) return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-6xl mb-5">📄</p>
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8">This page doesn't exist or isn't published yet.</p>
      <Link to="/" className="btn-primary">← Back to Home</Link>
    </div>
  )

  const sorted = [...(page.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div>
      {/* Page header (if no hero section) */}
      {!sorted.some(s => s.type === 'hero') && (
        <div className="bg-gray-50 border-b border-gray-100 py-12 px-6 mb-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-gray-900">{page.title}</h1>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {sorted.map((section, i) => (
          <Section key={i} section={section} />
        ))}

        {/* Fallback: raw content */}
        {page.content && !sorted.length && (
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        )}
      </div>
    </div>
  )
}
