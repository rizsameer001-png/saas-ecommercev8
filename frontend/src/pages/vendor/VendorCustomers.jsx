import { useEffect, useState } from 'react'
import { ordersApi } from '../../api/services'
import { Users } from 'lucide-react'
import { EmptyState, StatusBadge } from '../../components/ui/index'
import { format } from 'date-fns'

export default function VendorCustomers() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.getVendorOrders({ limit: 100 }).then(r => setOrders(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const customers = Object.values(orders.reduce((acc, o) => {
    const key = o.customer?._id || o.guestInfo?.email || 'guest'
    if (!acc[key]) acc[key] = { name: o.customer?.name || o.guestInfo?.name || 'Guest', email: o.customer?.email || o.guestInfo?.email, orders: 0, spent: 0, lastOrder: o.createdAt, isGuest: !o.customer }
    acc[key].orders++
    acc[key].spent += o.pricing?.total || 0
    if (new Date(o.createdAt) > new Date(acc[key].lastOrder)) acc[key].lastOrder = o.createdAt
    return acc
  }, {})).sort((a, b) => b.spent - a.spent)

  return (
    <div className="space-y-5 animate-fade-in">
      <div><h1 className="page-title">Customers</h1><p className="page-subtitle">{customers.length} unique customers</p></div>
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Last Order</th><th>Type</th></tr></thead>
          <tbody>
            {loading ? Array(6).fill(0).map((_, i) => <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j}><div className="skeleton h-4 w-24" /></td>)}</tr>)
              : customers.length === 0 ? <tr><td colSpan={5}><EmptyState icon={Users} title="No customers yet" description="Customers will appear after first orders" /></td></tr>
              : customers.map((c, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-primary-600">{c.name?.[0]?.toUpperCase()}</span></div>
                      <div><p className="font-medium text-gray-800 text-sm">{c.name}</p><p className="text-xs text-gray-500">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="font-semibold">{c.orders}</td>
                  <td className="font-bold text-gray-900">${c.spent.toFixed(2)}</td>
                  <td className="text-sm text-gray-500">{format(new Date(c.lastOrder), 'MMM d, yyyy')}</td>
                  <td><StatusBadge status={c.isGuest ? 'inactive' : 'active'} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
