import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../../api/services'
import { ShoppingCart, Eye, Search } from 'lucide-react'
import { StatusBadge, SearchInput, Pagination, Select, EmptyState } from '../../components/ui/index'
import { format } from 'date-fns'

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const LIMIT = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await ordersApi.getVendorOrders({ page, limit: LIMIT, ...(search && { search }), ...(status && { status }) })
      setOrders(data.data)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { fetch() }, [fetch])

  const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput onSearch={setSearch} placeholder="Search by order # or customer..." className="flex-1" />
          <Select value={status} onChange={e => setStatus(e.target.value)} className="w-40">
            <option value="">All Status</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="skeleton h-4 w-20" /></td>)}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will appear here when customers start buying" />
                </td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/dashboard/orders/${order._id}`} className="font-bold text-primary-600 hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {order.customer?.name || order.guestInfo?.name || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-400">{order.customer?.email || order.guestInfo?.email}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td className="font-bold text-gray-900">${order.pricing?.total?.toFixed(2)}</td>
                    <td><StatusBadge status={order.payment?.status} /></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <Link to={`/dashboard/orders/${order._id}`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-flex">
                        <Eye size={15} className="text-gray-500" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
