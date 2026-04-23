import { useEffect, useState } from 'react'
import { useParams, useOutletContext, Link } from 'react-router-dom'
import { ordersApi } from '../../api/services'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const { store, storeSlug, primaryColor } = useOutletContext()
  const [order, setOrder] = useState(null)

  useEffect(() => { ordersApi.getOne(orderId).then(r => setOrder(r.data.data)).catch(console.error) }, [orderId])

  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primaryColor + '20' }}>
        <CheckCircle size={48} style={{ color: primaryColor }} />
      </div>
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
      {order && <p className="text-sm font-mono bg-gray-100 rounded-lg px-4 py-2 inline-block mb-6">Order #{order.orderNumber}</p>}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left mb-6 space-y-3">
        <p className="font-semibold text-gray-800">What happens next?</p>
        {['You will receive a confirmation email shortly', 'The vendor will process your order', 'You can track your order status anytime'].map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: primaryColor }}>{i+1}</span>
            {s}
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Link to={`/store/${storeSlug}/track/${orderId}`} className="btn-secondary flex items-center gap-2"><Package size={15} /> Track Order</Link>
        <Link to={`/store/${storeSlug}/products`} className="btn-primary flex items-center gap-2">Continue Shopping <ArrowRight size={15} /></Link>
      </div>
    </div>
  )
}
