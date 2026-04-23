import { useEffect, useState } from 'react'
import { analyticsApi } from '../../api/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444']

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => { analyticsApi.getPlatformAnalytics({ period }).then(r => setData(r.data.data)).catch(console.error) }, [period])

  const planData = data?.planDistribution ? Object.entries(data.planDistribution).map(([n, v]) => ({ name: n, value: v })) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold text-white">Platform Analytics</h1><p className="text-gray-400 text-sm mt-1">Global platform insights</p></div>
        <div className="flex gap-2">
          {['7d','30d','1y'].map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{p}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-white font-bold mb-4">New Store Registrations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.newStores || []}>
              <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => format(new Date(d), 'MMM d')} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 12 }} labelStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {planData.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-white font-bold mb-4">Plan Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
