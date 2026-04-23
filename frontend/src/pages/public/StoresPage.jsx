import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { storesApi } from '../../api/services'
import { Store, Search, ArrowRight } from 'lucide-react'

export default function StoresPage() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    storesApi.getAll({ search }).then(r => setStores(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [search])

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">Browse Stores</h1>
        <p className="text-gray-500 mb-6">Discover and shop from our growing marketplace of vendors</p>
        <div className="relative max-w-md mx-auto">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores..." className="input pl-10 w-full" />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card"><div className="skeleton h-32 w-full mb-4 rounded-xl" /><div className="skeleton h-5 w-40 mb-2" /><div className="skeleton h-4 w-full" /></div>)}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20"><Store size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No stores found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stores.map(store => (
            <Link key={store._id} to={`/store/${store.slug}`} className="card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="h-24 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: store.branding?.primaryColor + '20' || '#f0f0ff' }}>
                {store.logo ? <img src={store.logo} alt={store.name} className="h-16 object-contain" /> : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: store.branding?.primaryColor || '#6366f1' }}>
                    {store.name?.[0]}
                  </div>
                )}
              </div>
              <h3 className="font-display font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{store.name}</h3>
              {store.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{store.stats?.totalProducts || 0} products</span>
                <span className="text-xs font-semibold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">Visit <ArrowRight size={12} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
