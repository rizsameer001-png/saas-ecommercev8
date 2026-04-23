import { useEffect, useState, useCallback } from 'react'
import { useOutletContext, useSearchParams, Link } from 'react-router-dom'
import { productsApi } from '../../api/services'
import api from '../../api/axios'
import ProductCard from '../../components/storefront/ProductCard'
import { SlidersHorizontal, ChevronDown, ChevronRight, FolderOpen, Folder, X } from 'lucide-react'
import { Pagination } from '../../components/ui/index'

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Best Selling' },
  { value: 'rating',     label: 'Top Rated' },
]

// Recursive category tree node
function CategoryNode({ cat, depth = 0, selectedId, onSelect, primaryColor }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = cat.children?.length > 0
  const isSelected = selectedId === cat._id
  const indent = depth * 14

  return (
    <div>
      <button
        onClick={() => { onSelect(isSelected ? '' : cat._id); if (hasChildren) setOpen(true) }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all ${
          isSelected ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'
        }`}
        style={{
          paddingLeft: 12 + indent,
          ...(isSelected ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {})
        }}
      >
        {hasChildren && (
          <button type="button" onClick={e => { e.stopPropagation(); setOpen(!open) }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {!hasChildren && <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 ml-1" />}
        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
          depth === 0 ? 'bg-indigo-100' : depth === 1 ? 'bg-violet-100' : 'bg-blue-100'
        }`}>
          {hasChildren
            ? <FolderOpen size={9} className={depth === 0 ? 'text-indigo-500' : depth === 1 ? 'text-violet-500' : 'text-blue-500'} />
            : <Folder size={9} className="text-gray-400" />
          }
        </div>
        <span className="truncate flex-1">{cat.name}</span>
        {cat.productCount > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{cat.productCount}</span>
        )}
      </button>

      {hasChildren && open && (
        <div className="border-l border-gray-100 ml-5">
          {cat.children.map(child => (
            <CategoryNode key={child._id} cat={child} depth={depth + 1}
              selectedId={selectedId} onSelect={onSelect} primaryColor={primaryColor} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductListPage() {
  const { store, storeSlug, primaryColor } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]    = useState([])
  const [catTree, setCatTree]      = useState([])
  const [catFlat, setCatFlat]      = useState([])
  const [loading, setLoading]      = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const currency = store?.settings?.currencySymbol || '$'

  const page     = parseInt(searchParams.get('page') || '1')
  const sort     = searchParams.get('sort')     || '-createdAt'
  const category = searchParams.get('category') || ''
  const search   = searchParams.get('search')   || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const onSale   = searchParams.get('onSale')   || ''
  const newArrival = searchParams.get('newArrival') || ''

  const setParam = (key, val) => setSearchParams(prev => {
    const p = new URLSearchParams(prev)
    if (val) p.set(key, val); else p.delete(key)
    if (key !== 'page') p.set('page', '1')
    return p
  })

  const clearAll = () => setSearchParams({ sort: '-createdAt' })

  // Fetch category tree for sidebar
  useEffect(() => {
    if (!storeSlug) return
    Promise.all([
      api.get('/categories?tree=true', { headers: { 'x-store-slug': storeSlug } }),
      api.get('/categories', { headers: { 'x-store-slug': storeSlug } }),
    ]).then(([tRes, fRes]) => {
      setCatTree(tRes.data.data)
      setCatFlat(fRes.data.data)
    }).catch(() => {})
  }, [storeSlug])

  const fetchProducts = useCallback(async () => {
    if (!storeSlug) return
    setLoading(true)
    try {
      const params = { page, limit: 12, sort }
      if (category)   params.category   = category
      if (search)     params.search     = search
      if (minPrice)   params.minPrice   = minPrice
      if (maxPrice)   params.maxPrice   = maxPrice
      if (onSale)     params.onSale     = onSale
      if (newArrival) params.newArrival = newArrival

      const { data } = await productsApi.getAll(storeSlug, params)
      setProducts(data.data)
      setPagination(data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [storeSlug, page, sort, category, search, minPrice, maxPrice, onSale, newArrival])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const activeFiltersCount = [category, minPrice, maxPrice, onSale, newArrival].filter(Boolean).length
  const selectedCat = catFlat.find(c => c._id === category)

  const Filters = () => (
    <div className="space-y-5">
      {/* Active filters chip */}
      {activeFiltersCount > 0 && (
        <button onClick={clearAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
          <X size={12} /> Clear all filters
        </button>
      )}

      {/* Category tree */}
      {catTree.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Categories</p>
          <button onClick={() => setParam('category', '')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              !category ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={!category ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}>
            All Products
          </button>
          {catTree.map(cat => (
            <CategoryNode key={cat._id} cat={cat} depth={0}
              selectedId={category} onSelect={v => setParam('category', v)} primaryColor={primaryColor} />
          ))}
        </div>
      )}

      {/* Labels */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Filter By</p>
        <div className="space-y-1">
          {[
            { key: 'onSale',     val: 'true', label: '🔥 On Sale' },
            { key: 'newArrival', val: 'true', label: '✨ New Arrivals' },
          ].map(({ key, val, label }) => {
            const active = searchParams.get(key) === val
            return (
              <button key={key} onClick={() => setParam(key, active ? '' : val)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left ${
                  active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={active ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Price Range</p>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={minPrice}
            onChange={e => setParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:border-transparent"
            style={{ '--tw-ring-color': primaryColor }} />
          <input type="number" placeholder="Max" value={maxPrice}
            onChange={e => setParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
          <Filters />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile filter toggle */}
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">
              <SlidersHorizontal size={14} /> Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}>{activeFiltersCount}</span>
              )}
            </button>

            {/* Breadcrumb for category */}
            {selectedCat && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-400">in</span>
                <span className="font-semibold text-gray-800">{selectedCat.path?.join(' › ') || selectedCat.name}</span>
                <button onClick={() => setParam('category', '')}
                  className="text-gray-400 hover:text-gray-600 ml-1"><X size={12} /></button>
              </div>
            )}

            {/* Active label chips */}
            {onSale === 'true' && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                🔥 On Sale <button onClick={() => setParam('onSale', '')}><X size={10} /></button>
              </span>
            )}
            {newArrival === 'true' && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                ✨ New Arrivals <button onClick={() => setParam('newArrival', '')}><X size={10} /></button>
              </span>
            )}

            <span className="text-sm text-gray-500">
              {loading ? '…' : <><strong>{pagination.total}</strong> product{pagination.total !== 1 ? 's' : ''}</>}
              {search && <> for "<em>{search}</em>"</>}
            </span>
          </div>

          {/* Sort */}
          <div className="relative">
            <select value={sort} onChange={e => setParam('sort', e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none cursor-pointer font-medium text-gray-700">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-4 mb-5">
            <Filters />
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="font-display font-bold text-xl text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-400 text-sm mb-5">Try removing some filters</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="text-sm font-semibold text-indigo-600 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => (
              <ProductCard key={p._id} product={p} storeSlug={storeSlug} currency={currency} />
            ))}
          </div>
        )}

        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onPageChange={pg => setParam('page', pg.toString())}
        />
      </div>
    </div>
  )
}
