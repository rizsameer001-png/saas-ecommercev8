import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../../api/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, ArrowRight, AlertTriangle, Plus } from 'lucide-react'
import { StatCard, StatusBadge, LoadingPage, EmptyState } from '../../components/ui/index'
import { format } from 'date-fns'

export default function VendorDashboard() {
  const { myStore } = useSelector(s => s.store)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await analyticsApi.getVendorAnalytics({ period })
        setAnalytics(data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  if (loading) return <LoadingPage />

  const s = analytics?.summary || {}
  const currency = myStore?.settings?.currencySymbol || '$'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's what's happening with your store</p>
        </div>
        <div className="flex items-center gap-2">
          {['7d','30d','90d','1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={s.revenue?.toFixed(2) || '0.00'} icon={DollarSign} prefix={currency} growth={s.revenueGrowth} color="primary" />
        <StatCard title="Total Orders" value={s.orders || 0} icon={ShoppingCart} growth={s.ordersGrowth} color="blue" />
        <StatCard title="Customers" value={s.customers || 0} icon={Users} color="green" />
        <StatCard title="Avg Order Value" value={(s.avgOrderValue || 0).toFixed(2)} icon={TrendingUp} prefix={currency} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-gray-800">Revenue Over Time</h3>
          </div>
          {analytics?.revenueChart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.revenueChart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={d => format(new Date(d), 'MMM d')} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${currency}${v}`} />
                <Tooltip formatter={(v) => [`${currency}${v.toFixed(2)}`, 'Revenue']} labelFormatter={d => format(new Date(d), 'MMM d, yyyy')} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} title="No revenue data yet" description="Start selling to see your revenue chart" />
          )}
        </div>

        {/* Order Status */}
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-5">Orders by Status</h3>
          {analytics?.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-bold text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShoppingCart} title="No orders yet" />
          )}
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-gray-800">Recent Orders</h3>
            <Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {analytics?.recentOrders?.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentOrders.map(order => (
                <Link key={order._id} to={`/dashboard/orders/${order._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customer?.name || order.guestInfo?.name || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{currency}{order.pricing?.total?.toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will appear here when customers start buying" action={<Link to={`/store/${myStore?.slug}`} className="btn-primary text-sm">View Store</Link>} />
          )}
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-gray-800">Low Stock Alert</h3>
            <Link to="/dashboard/products" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {analytics?.lowStockProducts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.lowStockProducts.map(product => (
                <div key={product._id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-amber-600">{product.inventory} left in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Package} title="All products well-stocked" description="No products running low right now" action={<Link to="/dashboard/products/new" className="btn-primary text-sm flex items-center gap-1.5"><Plus size={14} /> Add Product</Link>} />
          )}
        </div>
      </div>

      {/* Top Products */}
      {analytics?.topProducts?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-5">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-lg text-xs font-bold flex items-center justify-center">{i+1}</span>
                        {p.name}
                      </div>
                    </td>
                    <td className="font-semibold">{p.unitsSold}</td>
                    <td className="font-bold text-gray-900">{currency}{p.revenue?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
