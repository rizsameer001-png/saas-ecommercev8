import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { ArrowRight, ChevronRight, Home } from 'lucide-react'

function Section({ section }) {
  const bg = section.bgColor && section.bgColor !== '#ffffff' ? section.bgColor : null

  const wrapper = (children) => (
    <div className="py-10 px-4" style={bg ? { backgroundColor: bg } : {}}>
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  )

  switch (section.type) {
    case 'hero':
      return wrapper(
        <div className="text-center py-8">
          {section.imageUrl && (
            <img src={section.imageUrl} alt={section.imageAlt || ''} className="w-full max-h-72 object-cover rounded-2xl mb-8 shadow-sm" />
          )}
          {section.heading && <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">{section.heading}</h1>}
          {section.body && <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">{section.body}</p>}
          {section.ctaLabel && section.ctaUrl && (
            <Link to={section.ctaUrl} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm">
              {section.ctaLabel} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )

    case 'image_text':
      return wrapper(
        <div className={`flex flex-col md:flex-row gap-8 items-center ${section.imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
          {section.imageUrl && (
            <div className="md:w-1/2 flex-shrink-0">
              <img src={section.imageUrl} alt={section.imageAlt || ''} className="w-full rounded-2xl shadow-sm object-cover" />
            </div>
          )}
          <div className="flex-1">
            {section.heading && <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">{section.heading}</h2>}
            {section.body && <div className="text-gray-600 leading-relaxed whitespace-pre-line">{section.body}</div>}
            {section.ctaLabel && section.ctaUrl && (
              <Link to={section.ctaUrl} className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold mt-4 hover:text-indigo-800 transition-colors">
                {section.ctaLabel} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )

    case 'feature_grid':
      return wrapper(
        <div>
          {section.heading && <h2 className="font-display text-2xl font-bold text-gray-900 mb-2 text-center">{section.heading}</h2>}
          {section.body && <p className="text-gray-500 text-center mb-8">{section.body}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {(section.items || []).map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                {item.icon && <span className="text-3xl mb-3 block">{item.icon}</span>}
                {item.heading && <p className="font-bold text-gray-800 mb-2">{item.heading}</p>}
                {item.body && <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )

    case 'faq':
      return wrapper(
        <div>
          {section.heading && <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">{section.heading}</h2>}
          <div className="space-y-3">
            {(section.items || []).map((item, i) => (
              <details key={i} className="group border border-gray-100 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                  <p className="font-semibold text-gray-800">{item.heading}</p>
                  <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-4 bg-gray-50 text-gray-600 leading-relaxed">{item.body}</div>
              </details>
            ))}
          </div>
        </div>
      )

    case 'cta':
      return wrapper(
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-center text-white">
          {section.heading && <h2 className="font-display text-3xl font-bold mb-3">{section.heading}</h2>}
          {section.body && <p className="text-white/80 mb-6 max-w-xl mx-auto">{section.body}</p>}
          {section.ctaLabel && section.ctaUrl && (
            <Link to={section.ctaUrl} className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-7 py-3.5 rounded-2xl hover:bg-gray-100 transition-colors shadow-sm">
              {section.ctaLabel} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )

    default: // 'text' / 'custom'
      return wrapper(
        <div>
          {section.heading && <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">{section.heading}</h2>}
          {section.body && <div className="text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">{section.body}</div>}
        </div>
      )
  }
}

export default function CmsPage() {
  const { slug } = useParams()
  const [page, setPage]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get(`/admin-ext/cms/${slug}`)
      .then(r => setPage(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-2xl w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  )

  if (notFound || !page) return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-6">This page doesn't exist or isn't published yet.</p>
      <Link to="/" className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 justify-center">
        <Home size={14} /> Go Home
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="text-gray-700 font-medium">{page.title}</span>
        </nav>
      </div>

      {/* If raw content and no sections — render HTML */}
      {page.content && !page.sections?.length ? (
        <div className="max-w-4xl mx-auto px-6 pb-16">
          {/* Page title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
          <div
            className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      ) : (
        <>
          {/* Render sections */}
          {(page.sections || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((sec, i) => <Section key={i} section={sec} />)}

          {/* If also has raw content below sections */}
          {page.content && page.sections?.length > 0 && (
            <div className="max-w-4xl mx-auto px-6 py-10">
              <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
          )}

          {/* Fallback if truly empty */}
          {!page.content && !page.sections?.length && (
            <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-400">
              <p className="font-display text-2xl font-bold text-gray-800 mb-2">{page.title}</p>
              <p>Content coming soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
