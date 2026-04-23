import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { ordersApi } from '../../api/services'
import { StatusBadge } from '../../components/ui/index'
import { CheckCircle, Package } from 'lucide-react'
import { format } from 'date-fns'

const STEPS = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered']

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const { primaryColor } = useOutletContext()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { ordersApi.getOne(orderId).then(r => setOrder(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [orderId])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>

  const currentStep = STEPS.indexOf(order.status)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.status !== 'cancelled' && (
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={step} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i <= currentStep ? 'bg-primary-50' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${i < currentStep ? 'bg-green-500' : i === currentStep ? '' : 'bg-gray-200'}`} style={i === currentStep ? { backgroundColor: primaryColor } : {}}>
                  {i < currentStep ? <CheckCircle size={14} className="text-white" /> : <span className="text-white text-xs font-bold">{i+1}</span>}
                </div>
                <span className={`text-sm font-medium capitalize ${i <= currentStep ? 'text-gray-800' : 'text-gray-400'}`}>{step.replace(/_/g,' ')}</span>
                {i === currentStep && <span className="ml-auto text-xs font-semibold" style={{ color: primaryColor }}>Current</span>}
              </div>
            ))}
          </div>
        )}

        {order.tracking?.trackingNumber && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-gray-800 mb-1">Tracking Information</p>
            <p className="text-gray-600">Carrier: <span className="font-medium">{order.tracking.carrier}</span></p>
            <p className="text-gray-600">Tracking #: <span className="font-mono font-medium">{order.tracking.trackingNumber}</span></p>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-semibold text-gray-800 text-sm">Items Ordered</p>
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <span className="flex-1 text-gray-700">{item.name} × {item.quantity}</span>
              <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
            <span>Total</span><span>${order.pricing?.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
