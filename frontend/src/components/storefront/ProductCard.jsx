import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/cartSlice'
import { useState } from 'react'

export default function ProductCard({ product, storeSlug, currency = '$' }) {
  const dispatch = useDispatch()
  const [adding, setAdding] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.hasVariants) return // Go to product page for variants
    setAdding(true)
    await dispatch(addToCart({ storeSlug, productId: product._id, quantity: 1 }))
    setTimeout(() => setAdding(false), 1000)
  }

  const image = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url

  return (
    <Link
      to={`/store/${storeSlug}/products/${product.slug || product._id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ShoppingCart size={32} className="text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.comparePrice > product.price && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted) }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
        >
          <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>

        {/* Add to Cart */}
        {!product.hasVariants && product.inStock && (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="absolute bottom-3 left-3 right-3 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-600 active:scale-[0.98]"
          >
            <ShoppingCart size={13} />
            {adding ? 'Added!' : 'Add to Cart'}
          </button>
        )}
        {product.hasVariants && (
          <div className="absolute bottom-3 left-3 right-3 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            Select Options
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {product.category && (
          <p className="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">
            {product.category?.name}
          </p>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors flex-1">
          {product.name}
        </h3>

        {/* Rating */}
        {product.stats?.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={10} className={s <= Math.round(product.stats.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.stats.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-gray-900">{currency}{product.price?.toFixed(2)}</span>
          {product.comparePrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{currency}{product.comparePrice?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
