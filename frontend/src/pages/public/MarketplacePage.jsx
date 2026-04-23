import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import ProductCard from '../../components/storefront/ProductCard'
import { Sparkles, Flame, Star, TrendingUp, ChevronDown, X, Search } from 'lucide-react'
import { Pagination, Spinner } from '../../components/ui/index'

const SECTIONS = [
  { key: 'newArrival', label: 'New Arrivals', icon: Sparkles, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
  { key: 'onSale',     label: 'On Sale',      icon: Flame,    gradient: 'from-red-500 to-orange-500',   bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-700'     },
  { key: 'featured',  label: 'Featured',     icon: Star,     gradient: 'from-amber-500 to-yellow-400', bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700'   },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Best Selling' },
]

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]         = useState([])
  const [sectionData, setSectionData]   = useState({})
  const [loading, setLoading]           = useState(true)
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0 })

  const label  = searchParams.get('label')  || ''
  const search = searchParams.get('search') || ''
  const sort   = searchParams.get('sort')   || '-createdAt'
  const page   = parseInt(searchParams.get('page') || '1')

  const setParam = (key, val) => setSearchParams(prev => {
    const p = new URLSearchParams(prev)
    if (val) p.set(key, val); else p.delete(key)
    if (key !== 'page') p.delete('page')
    return p
  })

  // When label or search is active, fetch filtered
  const fetchFiltered = useCallback(async () => {
    if (!label && !search) return
    setLoading(true)
    try {
      if (label) {
        // Use labeled endpoint
        const { data } = await api.get(`/products/labeled?label=${label}&limit=12`)
        setProducts(data.data || [])
        setPagination({ page: 1, pages: 1, total: data.data?.length || 0 })
      } else if (search) {
        // Use regular search across stores - no store slug
        const { data } = await api.get(`/products`, {
          params: { page, limit: 12, sort, search },
          headers: { 'x-store-slug': 'all' }
        })
        setProducts(data.data || [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [label, search, sort, page])

  // When no filter, fetch all sections
  const fetchSections = useCallback(async () => {
    if (label || search) return
    setLoading(true)
    try {
      const results = await Promise.all(
        SECTIONS.map(s =>
          api.get(`/products/labeled?label=${s.key}&limit=8`)
            .then(r => ({ key: s.key, data: r.data.data || [] }))
            .catch(() => ({ key: s.key, data: [] }))
        )
      )
      const map = {}
      results.forEach(r => { map[r.key] = r.data })
      setSectionData(map)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [label, search])

  useEffect(() => {
    if (label || search) fetchFiltered()
    else fetchSections()
  }, [fetchFiltered, fetchSections, label, search])

  const currentSection = SECTIONS.find(s => s.key === label)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero */}
      {!label && !search && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-14 px-10 mb-12">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-indigo-300" />
              <span className="text-indigo-300 text-sm font-semibold uppercase tracking-wider">Global Marketplace</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Shop Everything,<br />From Everyone
            </h1>
            <p className="text-indigo-200 text-lg mb-8 max-w-lg">
              Discover new arrivals, exclusive deals, and featured products from hundreds of verified vendors.
            </p>
            <div className="flex flex-wrap gap-3">
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setParam('label', s.key)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full text-sm font-semibold transition-all">
                  <s.icon size={14} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active section header */}
      {currentSection && (
        <div className="mb-8">
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${currentSection.gradient} text-white mb-4`}>
            <currentSection.icon size={18} />
            <h1 className="font-display text-2xl font-bold">{currentSection.label}</h1>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">{products.length} products</p>
              <button onClick={() => setParam('label', '')}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                <X size={12} /> Clear filter
              </button>
            </div>
            <div className="relative">
              <select value={sort} onChange={e => setParam('sort', e.target.value)}
                className="input text-sm py-2 pr-8 appearance-none cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Search header */}
      {search && (
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Search: <span className="text-indigo-600">"{search}"</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} results</p>
          </div>
          <button onClick={() => setParam('search', '')}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
            <X size={14} /> Clear search
          </button>
        </div>
      )}

      {/* Filtered grid */}
      {(label || search) && (
        <>
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <Search size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-400 text-sm">Try a different filter or browse all sections</p>
              <button onClick={() => setSearchParams({})} className="mt-4 btn-primary text-sm">
                Browse All
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products.map(p => (
                <ProductCard key={p._id} product={p}
                  storeSlug={p.store?.slug} currency={p.store?.settings?.currencySymbol || '$'} />
              ))}
            </div>
          )}
          {pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages}
              onPageChange={pg => setParam('page', pg.toString())} />
          )}
        </>
      )}

      {/* All sections homepage */}
      {!label && !search && (
        <div className="space-y-16">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            SECTIONS.map((section, si) => {
              const items = sectionData[section.key] || []
              return (
                <div key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}>
                        <section.icon size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-bold text-gray-900">{section.label}</h2>
                        <p className="text-sm text-gray-400">
                          {section.key === 'newArrival' ? 'Fresh from vendors this month'
                            : section.key === 'onSale' ? 'Best deals right now'
                            : 'Editor picks across stores'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setParam('label', section.key)}
                      className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                      View all <ArrowRight size={14} />
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl py-12 text-center">
                      <p className="text-gray-400 text-sm">No {section.label.toLowerCase()} products yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                      {items.map(p => (
                        <ProductCard key={p._id} product={p}
                          storeSlug={p.store?.slug} currency={p.store?.settings?.currencySymbol || '$'} />
                      ))}
                    </div>
                  )}

                  {si < SECTIONS.length - 1 && (
                    <div className="mt-10 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// Needed for view all button inside section
function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
