import { useEffect, useState } from 'react'
import { analyticsApi, adminApi } from '../../api/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Store, Users, ShoppingCart, DollarSign, Activity, Globe, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'

const KPI = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 hover:bg-gray-800 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-white mb-0.5">{value}</p>
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
)

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [recentStores, setRecentStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    Promise.all([
      analyticsApi.getPlatformAnalytics({ period }),
      adminApi.getStores({ limit: 5 }),
    ]).then(([aRes, sRes]) => {
      setData(aRes.data.data)
      setRecentStores(sRes.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [period])

  const s = data?.summary || {}
  const chartData = data?.newStores || []
  const topStores = data?.topStores || []
  const planDist = data?.planDistribution || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Platform Overview</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
            <Activity size={12} className="text-green-400" />
            <span className="text-green-400">Live</span> · Updated just now
          </p>
        </div>
        <div className="flex gap-1.5 bg-gray-800 rounded-xl p-1">
          {['7d','30d','1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period===p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Stores" value={s.totalStores?.toLocaleString()||'0'} icon={Store} color="bg-indigo-600" sub={`${s.activeStores||0} active`} />
        <KPI label="Platform Users" value={s.totalUsers?.toLocaleString()||'0'} icon={Users} color="bg-violet-600" />
        <KPI label="Total Orders" value={s.totalOrders?.toLocaleString()||'0'} icon={ShoppingCart} color="bg-blue-600" sub={`Last ${period}`} />
        <KPI label="GMV" value={`$${(s.platformRevenue||0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-600" sub={`Last ${period}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-display font-bold">New Store Registrations</h3>
              <p className="text-gray-400 text-xs mt-0.5">Stores joining the platform</p>
            </div>
          </div>
          {loading ? <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Loading...</div> :
            chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{fontSize:10,fill:'#6b7280'}} tickFormatter={d=>format(new Date(d),'MMM d')} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:10,fill:'#6b7280'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor:'#111827',border:'1px solid #374151',borderRadius:12}} labelStyle={{color:'#fff'}} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#ag)" dot={false} name="stores"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>}
        </div>

        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-white font-display font-bold mb-1">Plan Distribution</h3>
          <p className="text-gray-400 text-xs mb-5">Across all stores</p>
          <div className="space-y-3">
            {[['free','bg-gray-500','Free'],['basic','bg-blue-500','Basic'],['pro','bg-indigo-500','Pro'],['enterprise','bg-amber-500','Enterprise']].map(([plan,color,label]) => {
              const count = planDist[plan]||0
              const total = Object.values(planDist).reduce((a,b)=>a+b,0)||1
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{width:`${Math.round((count/total)*100)}%`}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="text-white font-display font-bold">Top Stores by Revenue</h3>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-700/50">
            {topStores.slice(0,5).map((store,i) => (
              <div key={store._id} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{background:`hsl(${i*60},60%,50%)20`,color:`hsl(${i*60},60%,60%)`}}>{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{store.name}</p>
                  <p className="text-gray-400 text-xs">{store.owner?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-sm">${(store.stats?.totalRevenue||0).toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{store.stats?.totalOrders||0} orders</p>
                </div>
              </div>
            ))}
            {topStores.length === 0 && <div className="p-8 text-center text-gray-600 text-sm">No revenue data yet</div>}
          </div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="text-white font-display font-bold">Recently Joined Stores</h3>
            <Globe size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-700/50">
            {recentStores.map(store => (
              <div key={store._id} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{background:store.branding?.primaryColor||'#6366f1'}}>
                  {store.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{store.name}</p>
                  <p className="text-gray-400 text-xs">/{store.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${store.plan==='free'?'bg-gray-700 text-gray-400':store.plan==='pro'?'bg-indigo-900 text-indigo-300':'bg-blue-900 text-blue-300'}`}>{store.plan}</span>
                  <span className={`w-2 h-2 rounded-full ${store.status==='active'?'bg-green-400':'bg-red-400'}`}/>
                </div>
              </div>
            ))}
            {recentStores.length === 0 && <div className="p-8 text-center text-gray-600 text-sm">No stores yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
