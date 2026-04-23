import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ordersApi } from '../../api/services'
import { StatusBadge } from '../../components/ui/index'
import { Package } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomerOrdersPage() {
  const { store, storeSlug, primaryColor } = useOutletContext()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { ordersApi.getMyOrders().then(r => setOrders(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl mb-4" />) :
        orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <Link to={`/store/${storeSlug}/products`} className="btn-primary inline-flex mt-4">Start Shopping</Link>
          </div>
        ) : orders.map(order => (
          <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 hover:shadow-card transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <span>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span className="font-bold text-gray-900">${order.pricing?.total?.toFixed(2)}</span>
            </div>
            <Link to={`/store/${storeSlug}/track/${order._id}`} className="text-sm font-semibold" style={{ color: primaryColor }}>Track Order →</Link>
          </div>
        ))
      }
    </div>
  )
}
