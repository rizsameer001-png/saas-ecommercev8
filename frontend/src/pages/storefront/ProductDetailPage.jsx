import { useEffect, useState, useMemo } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { productsApi } from '../../api/services'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/cartSlice'
import {
  ShoppingCart, Star, Minus, Plus, ChevronLeft, Play,
  Package, Tag, ChevronRight, Youtube, X, Heart, Check,
  Truck, Shield, RotateCcw, ZoomIn
} from 'lucide-react'
import { RatingStars } from '../../components/ui/index'

/* ─────────────────────────────────────────────────────────────────────────────
   VIDEO MODAL
───────────────────────────────────────────────────────────────────────────── */
function VideoModal({ video, onClose }) {
  if (!video) return null
  const src = video.type === 'youtube' && video.youtubeId
    ? `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`
    : video.url
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
      onClick={onClose}>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors">
          <X size={16} />
        </button>
        {video.type === 'youtube' || video.youtubeId
          ? <iframe src={src} title={video.title || 'Video'} className="w-full h-full" allowFullScreen allow="autoplay" />
          : <video src={video.url} controls autoPlay className="w-full h-full" />
        }
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIZE SELECTOR  (chips)
───────────────────────────────────────────────────────────────────────────── */
function SizeSelector({ values, selected, onChange, outOfStockValues = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map(v => {
        const isOut = outOfStockValues.includes(v)
        const isSel = selected === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => !isOut && onChange(isSel ? null : v)}
            disabled={isOut}
            className={`min-w-[44px] px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              isSel
                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                : isOut
                ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed bg-gray-50'
                : 'border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'
            }`}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   COLOR SWATCH SELECTOR
───────────────────────────────────────────────────────────────────────────── */
function ColorSelector({ values, selected, onChange }) {
  // values: [{ label, value, colorHex, imageUrl }]
  return (
    <div className="flex flex-wrap gap-2.5">
      {values.map(v => {
        const isSel = selected === v.value
        const hasHex = !!v.colorHex
        return (
          <button
            key={v.value}
            type="button"
            title={v.label}
            onClick={() => onChange(isSel ? null : v.value)}
            className={`relative flex-shrink-0 transition-all ${
              isSel ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            {/* Outer ring when selected */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
              isSel ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-300'
            }`}>
              {/* Color circle or image swatch */}
              {v.imageUrl ? (
                <img src={v.imageUrl} alt={v.label}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full border border-gray-200 shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: v.colorHex || '#e5e7eb' }}
                >
                  {isSel && (
                    <Check size={12}
                      style={{
                        color: v.colorHex ? (
                          parseInt(v.colorHex.replace('#','').padStart(6,'0').slice(0,2), 16) * 0.299 +
                          parseInt(v.colorHex.replace('#','').padStart(6,'0').slice(2,4), 16) * 0.587 +
                          parseInt(v.colorHex.replace('#','').padStart(6,'0').slice(4,6), 16) * 0.114 > 186
                        ) ? '#000' : '#fff' : '#fff'
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ATTRIBUTE DETAILS TABLE  (material, weight, format, custom…)
───────────────────────────────────────────────────────────────────────────── */
function AttributeTable({ attrs, productAttributes }) {
  const rows = []

  // From simple attributes field
  const addRow = (label, value) => {
    const display = Array.isArray(value) ? value.join(', ') : value
    if (display && String(display).trim()) rows.push({ label, display: String(display) })
  }
  if (attrs) {
    addRow('Material', attrs.material)
    addRow('Weight', attrs.weight)
    if (attrs.bookFormat) addRow('Format', attrs.bookFormat.charAt(0).toUpperCase() + attrs.bookFormat.slice(1))
    if (attrs.packageContents) addRow('Package Contents', attrs.packageContents)
    ;(attrs.custom || []).filter(c => c.key && c.value).forEach(c => addRow(c.key, c.value))
  }

  // From productAttributes (store-level reusable attributes)
  if (productAttributes?.length) {
    productAttributes.forEach(pa => {
      const type = pa.attributeType
      const vals = pa.selectedValues || []
      // Skip size and color — shown in dedicated selectors above
      if (['size_uk', 'size_clothing', 'size', 'Size', 'color', 'Color'].some(s =>
        pa.attributeName?.toLowerCase().includes(s.toLowerCase()) &&
        (type === 'dropdown' || type === 'checkbox' || type === 'color_swatch'))) return
      if (vals.length) addRow(pa.attributeName, vals.map(v => v.label).join(', '))
    })
  }

  if (!rows.length) return null

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Tag size={14} className="text-gray-500" />
        <p className="font-semibold text-gray-700 text-sm">Product Details</p>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(({ label, display }, i) => (
          <div key={i} className="flex px-4 py-2.5 text-sm">
            <span className="w-36 text-gray-500 font-medium flex-shrink-0">{label}</span>
            <span className="text-gray-800 leading-relaxed">{display}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { idOrSlug } = useParams()
  const { store, storeSlug, primaryColor } = useOutletContext()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [product,       setProduct]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [qty,           setQty]           = useState(1)
  const [activeImg,     setActiveImg]     = useState(0)
  const [activeVideo,   setActiveVideo]   = useState(null)
  const [adding,        setAdding]        = useState(false)
  const [zoomed,        setZoomed]        = useState(false)

  // Attribute-based selection
  const [selectedSize,  setSelectedSize]  = useState(null)  // label string
  const [selectedColor, setSelectedColor] = useState(null)  // value string

  const currency = store?.settings?.currencySymbol || '$'

  useEffect(() => {
    productsApi.getOne(storeSlug, idOrSlug)
      .then(r => { setProduct(r.data.data); setActiveImg(0) })
      .catch(() => navigate(`/store/${storeSlug}/products`))
      .finally(() => setLoading(false))
  }, [idOrSlug, storeSlug])

  /* ── Derive size/color options from productAttributes (reusable) ── */
  const sizeOptions = useMemo(() => {
    if (!product) return []
    // From reusable productAttributes
    const sizePA = product.productAttributes?.find(pa =>
      pa.attributeName?.toLowerCase().includes('size') &&
      (pa.attributeType === 'dropdown' || pa.attributeType === 'checkbox')
    )
    if (sizePA?.selectedValues?.length) return sizePA.selectedValues.map(v => v.label)
    // Fallback: simple attributes.size
    return product.attributes?.size || []
  }, [product])

  const colorOptions = useMemo(() => {
    if (!product) return []
    // 1. From reusable productAttributes — prefer color_swatch or image_swatch
    const colorPA = product.productAttributes?.find(pa =>
      pa.attributeName?.toLowerCase().includes('color') ||
      pa.attributeType === 'color_swatch' ||
      pa.attributeType === 'image_swatch'
    )
    if (colorPA?.selectedValues?.length) {
      return colorPA.selectedValues.map(v => ({
        label:    v.label  || v.value,
        value:    v.value  || v.label,
        colorHex: v.colorHex || null,
        imageUrl: v.imageUrl || null,
      }))
    }
    // 2. Derive from variant options that have colorHex
    const fromVariants = []
    const seen = new Set()
    ;(product.variants || []).forEach(variant => {
      ;(variant.options || []).forEach(opt => {
        if (opt.attribute?.toLowerCase().includes('color') && !seen.has(opt.value)) {
          seen.add(opt.value)
          fromVariants.push({ label: opt.value, value: opt.value, colorHex: opt.colorHex || null, imageUrl: opt.imageUrl || null })
        }
      })
    })
    if (fromVariants.length) return fromVariants

    // 3. Fallback: simple attributes.color strings (no hex — shown as named swatches)
    return (product.attributes?.color || []).map(c => ({
      label: c, value: c.toLowerCase().replace(/\s+/g,'_'), colorHex: null, imageUrl: null
    }))
  }, [product])

  /* ── Find matching variant from selections ── */
  const matchedVariant = useMemo(() => {
    if (!product?.variants?.length) return null
    if (!selectedSize && !selectedColor) return null

    return product.variants.find(v => {
      const opts = v.options || []
      const sizeMatch = !selectedSize || opts.some(o =>
        o.attribute?.toLowerCase().includes('size') &&
        (o.value?.toLowerCase() === selectedSize?.toLowerCase() || o.value === selectedSize)
      )
      const colorMatch = !selectedColor || opts.some(o =>
        o.attribute?.toLowerCase().includes('color') &&
        (o.value?.toLowerCase() === selectedColor?.toLowerCase() || o.value === selectedColor)
      )
      return sizeMatch && colorMatch
    })
  }, [product, selectedSize, selectedColor])

  /* ── When color changes → switch main image if variant has one ── */
  useEffect(() => {
    if (!product) return
    if (matchedVariant?.image) {
      // Find the image in the images array by URL, or keep activeImg
      const idx = product.images?.findIndex(img => img.url === matchedVariant.image)
      if (idx !== -1 && idx !== undefined) setActiveImg(idx)
    }
  }, [matchedVariant])

  /* ── Derived price & stock ── */
  const displayPrice     = matchedVariant ? matchedVariant.price : product?.price
  const displayCompare   = matchedVariant ? null : product?.comparePrice
  const discountPct      = displayCompare > displayPrice
    ? Math.round(((displayCompare - displayPrice) / displayCompare) * 100)
    : 0

  const variantInStock   = matchedVariant
    ? (matchedVariant.inventory > 0 || !product?.trackInventory)
    : (product?.inStock)

  const needsSelection   = (sizeOptions.length > 0 || colorOptions.length > 0) && !matchedVariant && product?.hasVariants

  /* ── Out-of-stock sizes (for a given color) ── */
  const outOfStockSizes = useMemo(() => {
    if (!product?.variants?.length || !product.trackInventory) return []
    return sizeOptions.filter(size =>
      product.variants.some(v => {
        const opts = v.options || []
        const sizeMatch  = opts.some(o => o.attribute?.toLowerCase().includes('size') && o.value === size)
        const colorMatch = !selectedColor || opts.some(o => o.attribute?.toLowerCase().includes('color') && o.value === selectedColor)
        return sizeMatch && colorMatch && v.inventory === 0
      })
    )
  }, [product, sizeOptions, selectedColor])

  const handleAddToCart = async () => {
    if (!product) return
    if (needsSelection) return
    setAdding(true)
    try {
      await dispatch(addToCart({
        storeSlug,
        productId: product._id,
        quantity: qty,
        variantId: matchedVariant?._id,
      }))
      setTimeout(() => setAdding(false), 1200)
    } catch { setAdding(false) }
  }

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="skeleton aspect-square rounded-2xl" />
      <div className="space-y-4">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-6 rounded-lg" />)}</div>
    </div>
  )
  if (!product) return null

  const images   = product.images || []
  const videos   = product.videos || []
  const breadcrumb = product.category?.path || []

  return (
    <div>
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            <span>/</span>
            {i < breadcrumb.length - 1
              ? <span className="hover:text-gray-700 cursor-pointer">{crumb}</span>
              : <span className="text-gray-700 font-medium">{crumb}</span>}
            {i < breadcrumb.length - 1 && <ChevronRight size={12} />}
          </span>
        ))}
        {product.category && !breadcrumb.length && (
          <><span>/</span><span className="text-gray-700 font-medium">{product.category.name}</span></>
        )}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

        {/* ── LEFT: Image gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group cursor-zoom-in"
            onClick={() => setZoomed(!zoomed)}>
            {images[activeImg]?.url ? (
              <img
                src={images[activeImg].url}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${zoomed ? 'scale-150' : 'group-hover:scale-105'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package size={64} />
              </div>
            )}

            {/* Label badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              {product.labels?.isNewArrival && (
                <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">✨ New</span>
              )}
              {discountPct > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">🔥 -{discountPct}% OFF</span>
              )}
              {product.labels?.isFeatured && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">⭐ Featured</span>
              )}
            </div>

            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <ZoomIn size={10} /> Click to zoom
            </div>
          </div>

          {/* Thumbnail strip */}
          {(images.length > 1 || videos.length > 0) && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((img, i) => (
                <button key={i} onClick={() => { setActiveImg(i); setZoomed(false) }}
                  className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    i === activeImg ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
                  }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {videos.map((v, i) => (
                <button key={`v${i}`} onClick={() => setActiveVideo(v)}
                  className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200 hover:border-red-400 relative group transition-all">
                  {v.thumbnail
                    ? <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Play size={16} className="text-gray-400" /></div>}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                      <Play size={11} className="text-white ml-0.5" />
                    </div>
                  </div>
                  {v.type === 'youtube' && <Youtube size={9} className="absolute top-1 right-1 text-red-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info ── */}
        <div className="space-y-5">
          {/* Category pill */}
          {product.category && (
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: primaryColor }}>
              {product.category.name}
            </span>
          )}

          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product.stats?.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <RatingStars rating={product.stats.rating} size={15} />
              <span className="text-sm text-gray-500">({product.stats.reviewCount} reviews)</span>
              <span className="text-gray-200">·</span>
              <span className="text-sm text-gray-400">{product.stats.views} views</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 py-1">
            <span className="font-display text-3xl font-bold text-gray-900">
              {currency}{(displayPrice || 0).toFixed(2)}
            </span>
            {displayCompare > displayPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {currency}{displayCompare.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Save {discountPct}%
                </span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-gray-500 leading-relaxed text-[15px]">{product.shortDescription}</p>
          )}

          <hr className="border-gray-100" />

          {/* ── COLOR SELECTOR ── */}
          {colorOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-bold text-gray-800">
                  Color
                  {selectedColor && (
                    <span className="ml-2 text-gray-500 font-normal">
                      — {colorOptions.find(c => c.value === selectedColor)?.label}
                    </span>
                  )}
                </p>
                {selectedColor && (
                  <button onClick={() => setSelectedColor(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
                )}
              </div>
              <ColorSelector
                values={colorOptions}
                selected={selectedColor}
                onChange={setSelectedColor}
              />
            </div>
          )}

          {/* ── SIZE SELECTOR ── */}
          {sizeOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-bold text-gray-800">
                  Size
                  {selectedSize && <span className="ml-2 text-gray-500 font-normal">— {selectedSize}</span>}
                </p>
                {selectedSize && (
                  <button onClick={() => setSelectedSize(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
                )}
              </div>
              <SizeSelector
                values={sizeOptions}
                selected={selectedSize}
                onChange={setSelectedSize}
                outOfStockValues={outOfStockSizes}
              />
            </div>
          )}

          {/* ── GENERIC VARIANT fallback (if product.variants but no attribute selectors matched) ── */}
          {product.hasVariants && product.variants?.length > 0 && sizeOptions.length === 0 && colorOptions.length === 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2.5">Select Option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => {
                  const isOut = v.inventory === 0 && product.trackInventory
                  const isSel = matchedVariant?._id === v._id
                  return (
                    <button key={v._id} type="button"
                      onClick={() => {
                        // Toggle selection via a dummy mechanism
                        setSelectedSize(isSel ? null : v.name)
                      }}
                      disabled={isOut}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        isSel ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-900'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}>
                      {v.name}
                      {isOut && <span className="ml-1 text-xs opacity-60">(Out)</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selection prompt */}
          {needsSelection && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm">
              <span>👆</span>
              <span className="font-medium">
                Please select {[sizeOptions.length > 0 && !selectedSize && 'a size', colorOptions.length > 0 && !selectedColor && 'a color'].filter(Boolean).join(' and ')}
              </span>
            </div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm">
            {variantInStock ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-700 font-medium">In Stock</span>
                {product.trackInventory && matchedVariant && matchedVariant.inventory > 0 && matchedVariant.inventory <= 10 && (
                  <span className="text-amber-600 text-xs">· Only {matchedVariant.inventory} left!</span>
                )}
                {product.trackInventory && !product.hasVariants && product.inventory > 0 && product.inventory <= 10 && (
                  <span className="text-amber-600 text-xs">· Only {product.inventory} left!</span>
                )}
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Qty + Add to Cart */}
          <div className="flex gap-3">
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                <Minus size={14} />
              </button>
              <span className="px-4 font-bold text-gray-800 min-w-[36px] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)}
                className="px-3 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || (!variantInStock && product.trackInventory) || needsSelection}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: primaryColor }}>
              <ShoppingCart size={17} />
              {adding
                ? '✓ Added!'
                : !variantInStock && product.trackInventory
                ? 'Out of Stock'
                : needsSelection
                ? 'Select Options'
                : 'Add to Cart'}
            </button>

            <button className="w-12 h-12 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all flex-shrink-0">
              <Heart size={17} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck,     label: 'Free Delivery', sub: 'On orders over $50' },
              { icon: Shield,    label: 'Secure Pay',    sub: 'SSL encrypted checkout' },
              { icon: RotateCcw, label: 'Easy Returns',  sub: '30-day return policy' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                <Icon size={16} className="text-gray-400 mb-1" />
                <p className="text-[11px] font-bold text-gray-700">{label}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESCRIPTION + DETAILS (below fold) ── */}
      <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description */}
        {product.description && (
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Description</h2>
            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-[15px] whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Attribute table */}
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl mb-4">Specifications</h2>
          <AttributeTable attrs={product.attributes} productAttributes={product.productAttributes} />
        </div>
      </div>

      {/* ── VIDEOS (below fold) ── */}
      {videos.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display font-bold text-gray-900 text-xl mb-5 flex items-center gap-2">
            <Play size={18} className="text-red-500" /> Product Videos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {videos.map((v, i) => (
              <button key={i} onClick={() => setActiveVideo(v)}
                className="group relative aspect-video bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-indigo-300 transition-all">
                {v.thumbnail
                  ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><Play size={24} className="text-gray-400" /></div>}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={18} className="text-white ml-1" />
                  </div>
                </div>
                {v.type === 'youtube' && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Youtube size={8} /> YouTube
                  </div>
                )}
                {v.title && (
                  <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 text-white text-xs font-medium px-2 py-1.5 truncate">
                    {v.title}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
