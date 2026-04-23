import { useSelector, useDispatch } from 'react-redux'
import { useOutletContext, Link } from 'react-router-dom'
import { selectCartItems, selectCartTotal, updateCartItem, removeCartItem, applyCoupon } from '../../store/cartSlice'
import { ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function CartPageImpl() {
  const { store, storeSlug, primaryColor } = useOutletContext()
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const coupon = useSelector(s => s.cart.coupon)
  const dispatch = useDispatch()
  const [couponCode, setCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const currency = store?.settings?.currencySymbol || '$'

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true)
    await dispatch(applyCoupon({ storeSlug, code: couponCode }))
    setApplyingCoupon(false)
  }

  const discount = coupon?.discount || 0
  const finalTotal = Math.max(0, total - discount)

  if (items.length === 0) return (
    <div className="text-center py-24">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <ShoppingCart size={36} className="text-gray-400" />
      </div>
      <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
      <Link to={`/store/${storeSlug}/products`} className="btn-primary inline-flex items-center gap-2">
        Continue Shopping <ArrowRight size={16} />
      </Link>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">Shopping Cart ({items.length})</h1>
        {items.map(item => (
          <div key={item._id} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <ShoppingCart size={24} className="m-auto mt-6 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{item.name}</p>
              {item.variantInfo && <p className="text-sm text-gray-500">{item.variantInfo}</p>}
              <p className="text-sm font-bold text-gray-900 mt-1">{currency}{item.price?.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => dispatch(updateCartItem({ storeSlug, itemId: item._id, quantity: item.quantity - 1 }))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"><Minus size={13} /></button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button onClick={() => dispatch(updateCartItem({ storeSlug, itemId: item._id, quantity: item.quantity + 1 }))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"><Plus size={13} /></button>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{currency}{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => dispatch(removeCartItem({ storeSlug, itemId: item._id }))} className="text-red-400 hover:text-red-600 transition-colors mt-2">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-display font-bold text-gray-800">Order Summary</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input pl-8 text-sm" />
            </div>
            <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode} className="btn-secondary text-sm px-3 disabled:opacity-50">Apply</button>
          </div>
          {coupon && <p className="text-sm text-green-600 font-medium">✓ {coupon.code} — saved {currency}{discount.toFixed(2)}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{currency}{total.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{currency}{discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100"><span>Total</span><span>{currency}{finalTotal.toFixed(2)}</span></div>
          </div>
          <Link to={`/store/${storeSlug}/checkout`} className="block text-center text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
            Proceed to Checkout
          </Link>
        </div>
        <Link to={`/store/${storeSlug}/products`} className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors">← Continue Shopping</Link>
      </div>
    </div>
  )
}
