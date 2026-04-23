// CheckoutPage.jsx
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { selectCartItems, selectCartTotal, selectCartCoupon, resetCart } from '../../store/cartSlice'
import { ordersApi } from '../../api/services'
import { ShoppingCart, CreditCard, Truck, Lock } from 'lucide-react'
import { Input, Select } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { store, storeSlug, primaryColor } = useOutletContext()
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartTotal)
  const coupon = useSelector(selectCartCoupon)
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const currency = store?.settings?.currencySymbol || '$'

  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: '',
    street: '', city: '', state: '', country: '', postalCode: '',
    paymentMethod: 'cod',
    guestInfo: { name: user?.name || '', email: user?.email || '', phone: '' }
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const discount = coupon?.discount || 0
  const tax = ((subtotal - discount) * (store?.settings?.taxRate || 0)) / 100
  const shipping = store?.settings?.freeShippingThreshold > 0 && subtotal >= store.settings.freeShippingThreshold ? 0 : 0
  const total = subtotal - discount + tax + shipping

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return toast.error('Cart is empty')
    setLoading(true)
    try {
      const orderItems = items.map(item => ({ productId: item.product?._id || item.product, quantity: item.quantity, variantId: item.variant }))
      const shippingAddress = { name: form.name, street: form.street, city: form.city, state: form.state, country: form.country, postalCode: form.postalCode, phone: form.phone }
      const { data } = await ordersApi.create(storeSlug, {
        items: orderItems,
        shippingAddress,
        paymentMethod: form.paymentMethod,
        couponCode: coupon?.code,
        guestInfo: !user ? { name: form.name, email: form.email, phone: form.phone } : undefined,
      })
      dispatch(resetCart())
      navigate(`/store/${storeSlug}/order-success/${data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Lock size={20} style={{ color: primaryColor }} /> Secure Checkout
      </h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-800 flex items-center gap-2"><Truck size={16} /> Contact & Shipping</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} required className="col-span-2 sm:col-span-1" />
              <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="col-span-2 sm:col-span-1" />
              <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} className="col-span-2" />
              <Input label="Street Address *" value={form.street} onChange={e => set('street', e.target.value)} required className="col-span-2" />
              <Input label="City *" value={form.city} onChange={e => set('city', e.target.value)} required />
              <Input label="State/Province" value={form.state} onChange={e => set('state', e.target.value)} />
              <Input label="Country *" value={form.country} onChange={e => set('country', e.target.value)} required />
              <Input label="Postal Code *" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} required />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-display font-bold text-gray-800 flex items-center gap-2"><CreditCard size={16} /> Payment Method</h2>
            <div className="space-y-3">
              {[['cod', '💵 Cash on Delivery'], ['stripe', '💳 Credit / Debit Card (Stripe)'], ['razorpay', '🏦 Razorpay (UPI / Cards)']].map(([v, l]) => (
                <label key={v} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === v ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value={v} checked={form.paymentMethod === v} onChange={() => set('paymentMethod', v)} className="accent-primary-600" />
                  <span className="font-medium text-gray-700">{l}</span>
                </label>
              ))}
            </div>
            {form.paymentMethod === 'stripe' && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">You'll be redirected to enter card details securely after placing the order.</p>}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-24">
            <h2 className="font-display font-bold text-gray-800">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin">
              {items.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-900">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm pt-2 border-t border-gray-100">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{currency}{discount.toFixed(2)}</span></div>}
              {tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax ({store?.settings?.taxRate}%)</span><span>{currency}{tax.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100"><span>Total</span><span>{currency}{total.toFixed(2)}</span></div>
            </div>
            <button type="submit" disabled={loading} className="w-full text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
              {loading ? 'Placing Order...' : `Place Order · ${currency}${total.toFixed(2)}`}
            </button>
            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1"><Lock size={10} /> Secured by SSL encryption</p>
          </div>
        </div>
      </form>
    </div>
  )
}
