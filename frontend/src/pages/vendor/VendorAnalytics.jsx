import { useEffect, useState } from 'react'
import { analyticsApi } from '../../api/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { LoadingPage } from '../../components/ui/index'
import { format } from 'date-fns'

const COLORS = ['#6366f1','#f97316','#10b981','#f59e0b','#ef4444','#8b5cf6']

export default function VendorAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    analyticsApi.getVendorAnalytics({ period }).then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [period])

  if (loading) return <LoadingPage />

  const statusData = data?.ordersByStatus ? Object.entries(data.ordersByStatus).map(([name, value]) => ({ name, value })) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Detailed performance insights</p></div>
        <div className="flex gap-2">
          {['7d','30d','90d','1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.revenueChart || []}>
              <defs><linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => format(new Date(d), 'MMM d')} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v?.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#c1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenueChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => format(new Date(d), 'MMM d')} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="orders" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {statusData.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => v.replace(/_/g,' ')} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {data?.topProducts?.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-4">Top Products by Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={100} />
                <Tooltip formatter={v => [`$${v?.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="#f97316" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
