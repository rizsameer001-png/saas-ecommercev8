import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import api from '../../api/axios'
import ProductCard from '../../components/storefront/ProductCard'
import { ArrowRight, Tag, Sparkles, Flame, Star, FolderOpen, Package } from 'lucide-react'

function SectionHeader({ icon: Icon, title, subtitle, href, iconBg, iconColor, primaryColor }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link to={href} className="flex items-center gap-1 text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: primaryColor }}>
          View all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

export default function StorefrontHome() {
  const { store, storeSlug, primaryColor } = useOutletContext()
  const [featured, setFeatured]       = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [onSale, setOnSale]           = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const currency = store?.settings?.currencySymbol || '$'

  useEffect(() => {
    if (!storeSlug) return
    const h = { 'x-store-slug': storeSlug }

    Promise.all([
      // Use the /products/labeled endpoint which correctly filters by labels.isFeatured etc.
      api.get(`/products/labeled?label=featured&limit=4&storeSlug=${storeSlug}`),
      api.get(`/products/labeled?label=newArrival&limit=8&storeSlug=${storeSlug}`),
      api.get(`/products/labeled?label=onSale&limit=8&storeSlug=${storeSlug}`),
      api.get('/categories?tree=true', { headers: h }),
    ]).then(([f, n, s, c]) => {
      setFeatured(f.data.data || [])
      setNewArrivals(n.data.data || [])
      setOnSale(s.data.data || [])
      setCategories(c.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [storeSlug])

  if (loading) return (
    <div className="space-y-10 animate-pulse">
      <div className="skeleton h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
      </div>
    </div>
  )

  const hasContent = featured.length > 0 || newArrivals.length > 0 || onSale.length > 0

  return (
    <div className="space-y-14">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)` }}>
        {/* BG decoration */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 bg-white" />

        <div className="relative px-8 md:px-14 py-14 md:py-20 max-w-2xl">
          {store?.logo && (
            <img src={store.logo} alt={store.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg mb-5" />
          )}
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 leading-tight">
            {store?.name}
          </h1>
          {store?.description && (
            <p className="text-white/80 text-lg mb-8 leading-relaxed">{store.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link to={`/store/${storeSlug}/products`}
              className="inline-flex items-center gap-2 bg-white font-bold px-7 py-3.5 rounded-2xl transition-all hover:bg-gray-100 active:scale-[0.98] shadow-lg"
              style={{ color: primaryColor }}>
              Shop All <ArrowRight size={16} />
            </Link>
            {onSale.length > 0 && (
              <Link to={`/store/${storeSlug}/products?onSale=true`}
                className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-white/30 transition-all">
                <Flame size={15} /> On Sale
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <SectionHeader icon={FolderOpen} title="Browse Categories"
            iconBg="bg-indigo-100" iconColor="text-indigo-600" primaryColor={primaryColor} />
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
            <Link to={`/store/${storeSlug}/products`}
              className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-white border-2 border-indigo-100 rounded-2xl hover:border-indigo-400 transition-all min-w-[100px] group"
              style={{}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50">
                <Package size={20} className="text-indigo-500" />
              </div>
              <span className="text-xs font-bold text-indigo-600 text-center">All Products</span>
            </Link>
            {categories.map(cat => (
              <Link key={cat._id} to={`/store/${storeSlug}/products?category=${cat._id}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-card transition-all min-w-[100px] group">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name}
                    className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: primaryColor + '20' }}>
                    <Tag size={20} style={{ color: primaryColor }} />
                  </div>
                )}
                <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-indigo-600 transition-colors leading-tight">
                  {cat.name}
                </span>
                {cat.productCount > 0 && (
                  <span className="text-[10px] text-gray-400">{cat.productCount}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <div>
          <SectionHeader
            icon={Sparkles} title="New Arrivals"
            subtitle="Just landed — fresh additions to the store"
            href={`/store/${storeSlug}/products?newArrival=true`}
            iconBg="bg-emerald-100" iconColor="text-emerald-600"
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {newArrivals.map(p => (
              <ProductCard key={p._id} product={p} storeSlug={storeSlug} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* On Sale */}
      {onSale.length > 0 && (
        <div>
          <SectionHeader
            icon={Flame} title="On Sale"
            subtitle="Limited-time deals — don't miss out"
            href={`/store/${storeSlug}/products?onSale=true`}
            iconBg="bg-red-100" iconColor="text-red-600"
            primaryColor={primaryColor}
          />
          <div className="relative rounded-2xl overflow-hidden">
            {/* sale accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, #ef4444, #f97316, #eab308)` }} />
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-b-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} className="text-red-500" />
                <span className="text-sm font-bold text-red-700">
                  🔥 Save up to {Math.max(...onSale.map(p => p.discountPercent || 0))}% — selected items
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {onSale.map(p => (
                  <ProductCard key={p._id} product={p} storeSlug={storeSlug} currency={currency} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <div>
          <SectionHeader
            icon={Star} title="Featured"
            subtitle="Hand-picked top products by the store"
            href={`/store/${storeSlug}/products?featured=true`}
            iconBg="bg-amber-100" iconColor="text-amber-600"
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(p => (
              <ProductCard key={p._id} product={p} storeSlug={storeSlug} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: primaryColor + '20' }}>
            <Package size={32} style={{ color: primaryColor }} />
          </div>
          <h3 className="font-display text-2xl font-bold text-gray-800 mb-2">Coming Soon</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Products are being added. Browse the catalog or check back soon!
          </p>
          <Link to={`/store/${storeSlug}/products`}
            className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-2xl text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}>
            Browse All <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
