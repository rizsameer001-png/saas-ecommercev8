import { Outlet, useParams, NavLink, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStore } from '../../store/storeSlice'
import { fetchCart } from '../../store/cartSlice'
import { logout } from '../../store/authSlice'
import { ShoppingCart, Search, Menu, X, User, LogOut, Package, ChevronDown } from 'lucide-react'
import { selectCartCount } from '../../store/cartSlice'
import CartDrawer from '../storefront/CartDrawer'
import { LoadingPage } from '../ui/index'

export default function StorefrontLayout() {
  const { storeSlug } = useParams()
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const { currentStore, loading } = useSelector(s => s.store)
  const { user, isAuthenticated }  = useSelector(s => s.auth)
  const cartCount   = useSelector(selectCartCount)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen]             = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')

  useEffect(() => {
    if (storeSlug) {
      dispatch(fetchStore(storeSlug))
      dispatch(fetchCart(storeSlug))
    }
  }, [storeSlug, dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/store/${storeSlug}/products?search=${encodeURIComponent(searchQuery)}`)
  }

  if (loading && !currentStore) return <LoadingPage />
  if (!currentStore && !loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Store Not Found</h2>
        <p className="text-gray-500 mb-6">This store doesn't exist or is currently unavailable.</p>
        <Link to="/stores" className="btn-primary">Browse Stores</Link>
      </div>
    </div>
  )

  const store = currentStore
  const primaryColor = store?.branding?.primaryColor || '#6366f1'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Banner */}
      {store?.banner && (
        <div className="w-full h-40 sm:h-52 overflow-hidden relative">
          <img src={store.banner} alt={`${store.name} banner`}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}

      {/* Store Header */}
      <header className={`bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm ${store?.banner ? '' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          {/* Logo / Name */}
          <Link to={`/store/${storeSlug}`} className="flex items-center gap-3 flex-shrink-0 mr-2">
            {store?.logo ? (
              <img src={store.logo} alt={store.name}
                className="h-10 w-10 rounded-xl object-cover border border-gray-100 shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm"
                style={{ backgroundColor: primaryColor }}>
                {store?.name?.[0]}
              </div>
            )}
            <div className="hidden sm:block">
              <span className="font-display font-bold text-lg text-gray-900 leading-tight">{store?.name}</span>
              {store?.branding?.tagline && <p className="text-xs text-gray-400">{store.branding.tagline}</p>}
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input pl-10 w-full text-sm" />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {isAuthenticated ? (
              <div className="relative group hidden sm:block">
                <button className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600">{user?.name?.[0]}</span>
                  </div>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                  <Link to={`/store/${storeSlug}/my-orders`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Package size={14} /> My Orders
                  </Link>
                  <button onClick={() => dispatch(logout())}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <User size={15} /> Sign In
              </Link>
            )}

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ backgroundColor: primaryColor }}>
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Nav links */}
        <div className="border-t border-gray-50 hidden md:block">
          <div className="max-w-7xl mx-auto px-6 flex gap-1">
            <NavLink to={`/store/${storeSlug}`} end
              className={({ isActive }) => `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-b-2 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              style={({ isActive }) => isActive ? { borderBottomColor: primaryColor, color: primaryColor } : {}}>
              Home
            </NavLink>
            <NavLink to={`/store/${storeSlug}/products`}
              className={({ isActive }) => `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? '' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              style={({ isActive }) => isActive ? { borderBottomColor: primaryColor, color: primaryColor } : {}}>
              Products
            </NavLink>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..." className="input pl-9 w-full text-sm" />
            </div>
          </form>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet context={{ store, storeSlug, primaryColor }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-16 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {store?.logo ? (
              <img src={store.logo} alt={store.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: primaryColor }}>{store?.name?.[0]}</div>
            )}
            <span className="font-display font-bold text-gray-800">{store?.name}</span>
          </div>
          <p className="text-xs text-gray-400">Powered by SaaSStore</p>
          {store?.contact?.email && (
            <a href={`mailto:${store.contact.email}`} className="text-xs text-gray-500 hover:text-gray-700">
              {store.contact.email}
            </a>
          )}
        </div>
      </footer>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} storeSlug={storeSlug} store={store} />
    </div>
  )
}
