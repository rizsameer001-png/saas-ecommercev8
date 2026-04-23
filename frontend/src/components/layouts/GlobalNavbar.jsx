import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'
import api from '../../api/axios'
import {
  Store, Search, User, LogOut, LayoutDashboard, ShieldCheck,
  Sparkles, ChevronDown, X, TrendingUp, Flame, Star, Menu,
  Package, Globe, ArrowRight, Heart
} from 'lucide-react'

/* ── Mega Panel ────────────────────────────────────────────────────────────── */
function MegaPanel({ menuKey, onClose }) {
  const [products, setProducts] = useState([])
  const [stores,   setStores]   = useState([])
  const [loading,  setLoading]  = useState(false)

  const CFG = {
    newArrival: { label: 'New Arrivals', icon: Sparkles, accent: '#059669', bg: '#f0fdf4', border: '#bbf7d0', tagBg: '#10b981', desc: 'Just landed this month' },
    onSale:     { label: 'On Sale',      icon: Flame,    accent: '#dc2626', bg: '#fff1f2', border: '#fecaca', tagBg: '#ef4444', desc: 'Limited-time deals'     },
    featured:   { label: 'Featured',     icon: Star,     accent: '#d97706', bg: '#fffbeb', border: '#fde68a', tagBg: '#f59e0b', desc: 'Curated top picks'      },
    stores:     { label: 'Explore Stores', icon: Globe,  accent: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', tagBg: '#6366f1', desc: 'Browse all stores'      },
  }
  const cfg = CFG[menuKey] || CFG.featured
  const Icon = cfg.icon

  useEffect(() => {
    if (!menuKey) return
    setLoading(true)
    if (menuKey === 'stores') {
      api.get('/stores?limit=6').then(r => setStores(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
    } else {
      api.get(`/products/labeled?label=${menuKey}&limit=8`).then(r => setProducts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
    }
  }, [menuKey])

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[800px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      style={{ boxShadow: '0 30px 80px -10px rgba(0,0,0,0.2)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: cfg.bg, borderColor: cfg.border }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.accent + '20' }}>
            <Icon size={17} style={{ color: cfg.accent }} />
          </div>
          <div>
            <p className="font-display font-bold text-gray-900">{cfg.label}</p>
            <p className="text-xs text-gray-500">{cfg.desc}</p>
          </div>
        </div>
        <Link to={menuKey === 'stores' ? '/stores' : `/marketplace?label=${menuKey}`}
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ background: cfg.accent }}>
          View all <ArrowRight size={11} />
        </Link>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array(8).fill(0).map((_,i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl" />
                <div className="h-2.5 bg-gray-100 rounded" />
                <div className="h-2.5 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : menuKey === 'stores' ? (
          <div className="grid grid-cols-3 gap-3">
            {stores.map(s => (
              <Link key={s._id} to={`/store/${s.slug}`} onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 group transition-all">
                {s.logo
                  ? <img src={s.logo} alt={s.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: s.branding?.primaryColor || cfg.accent }}>{s.name?.[0]}</div>}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">{s.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.plan}</p>
                </div>
              </Link>
            ))}
            <Link to="/stores" onClick={onClose} className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 text-xs font-semibold text-gray-400 hover:text-indigo-500 transition-all">
              <Globe size={13} /> All Stores
            </Link>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No products yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {products.map(p => {
              const img  = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url
              const disc = p.comparePrice > p.price ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0
              return (
                <Link key={p._id} to={`/store/${p.store?.slug}/products/${p.slug || p._id}`} onClick={onClose}
                  className="group flex flex-col">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative mb-2">
                    {img
                      ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={22} /></div>}
                    {disc > 0 && (
                      <span className="absolute top-1.5 left-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: cfg.tagBg }}>
                        -{disc}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-gray-900">{p.store?.settings?.currencySymbol || '$'}{p.price?.toFixed(2)}</span>
                    {p.comparePrice > p.price && <span className="text-[10px] text-gray-400 line-through">${p.comparePrice?.toFixed(2)}</span>}
                  </div>
                  {p.store?.name && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.store.name}</p>}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Search Bar ─────────────────────────────────────────────────────────────── */
function SearchBar() {
  const [q, setQ]         = useState('')
  const [open, setOpen]   = useState(false)
  const navigate          = useNavigate()
  const POPULAR = ['Laptops','Headphones','T-Shirts','Books','Sneakers','Cameras','Keyboards','Watches']

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) { navigate(`/marketplace?search=${encodeURIComponent(q)}`); setOpen(false) }
  }

  return (
    <div className="relative">
      <form onSubmit={submit}>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search all stores…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white focus:border-indigo-300 transition-all" />
        </div>
      </form>
      {open && !q && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">Popular</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR.map(s => (
              <button key={s} type="button" onMouseDown={() => { navigate(`/marketplace?search=${encodeURIComponent(s)}`); setOpen(false) }}
                className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 rounded-full border border-gray-100 hover:border-indigo-200 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Navbar ─────────────────────────────────────────────────────────────── */
const NAV = [
  { key: 'newArrival', label: 'New Arrivals', icon: Sparkles, color: '#059669' },
  { key: 'onSale',     label: 'On Sale',      icon: Flame,    color: '#dc2626' },
  { key: 'featured',   label: 'Featured',     icon: Star,     color: '#d97706' },
  { key: 'stores',     label: 'Stores',       icon: Globe,    color: '#6366f1' },
]

export default function GlobalNavbar() {
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [active, setActive]     = useState(null)
  const [userMenu, setUserMenu] = useState(false)
  const [mobile,   setMobile]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const megaRef = useRef()
  const userRef = useRef()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setActive(null)
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { setActive(null); setMobile(false) }, [location.pathname])

  const handleLogout = () => { dispatch(logout()); navigate('/'); setUserMenu(false) }

  return (
    <header className={`bg-white sticky top-0 z-40 transition-all ${scrolled ? 'shadow-lg' : 'border-b border-gray-100'}`}>
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Store size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900 hidden sm:block">SaaSStore</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg hidden md:block"><SearchBar /></div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <div className="relative" ref={userRef}>
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  {user?.role === 'vendor' && (
                    <button onClick={() => { navigate('/dashboard'); setUserMenu(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard size={14} className="text-indigo-500" /> Vendor Dashboard
                    </button>
                  )}
                  {user?.role === 'super_admin' && (
                    <button onClick={() => { navigate('/admin'); setUserMenu(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <ShieldCheck size={14} className="text-purple-500" /> Admin Panel
                    </button>
                  )}
                  <button onClick={() => { navigate('/account'); setUserMenu(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <User size={14} className="text-gray-400" /> My Account
                  </button>
                  <div className="border-t border-gray-50" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login"    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">Sign In</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:opacity-90 shadow-sm transition-all">Start Selling</Link>
            </div>
          )}
          <button onClick={() => setMobile(!mobile)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mega Menu Nav Bar */}
      <div className="hidden md:block border-t border-gray-50" ref={megaRef}>
        <div className="max-w-7xl mx-auto px-6 flex items-center relative">
          <Link to="/marketplace" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all mr-1">
            <TrendingUp size={14} /> Marketplace
          </Link>
          <Link to="/blog" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all mr-1">
            Blog
          </Link>

          {NAV.map(item => (
            <button key={item.key}
              onMouseEnter={() => setActive(item.key)}
              onClick={() => setActive(active === item.key ? null : item.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${active === item.key ? 'bg-gray-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              style={active === item.key ? { color: item.color } : {}}>
              <item.icon size={14} style={active === item.key ? { color: item.color } : {}} />
              <span>{item.label}</span>
              <ChevronDown size={11} className={`transition-transform ${active === item.key ? 'rotate-180' : ''} text-gray-400`} />
            </button>
          ))}

          {/* Mega Panel */}
          {active && (
            <div className="absolute left-0 right-0" style={{ top: '100%' }} onMouseLeave={() => setActive(null)}>
              <MegaPanel menuKey={active} onClose={() => setActive(null)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3 border-t border-gray-50 pt-3"><SearchBar /></div>

      {/* Mobile drawer */}
      {mobile && (
        <div className="md:hidden border-t border-gray-100 bg-white pb-4">
          <div className="px-4 pt-3 space-y-0.5">
            <Link to="/marketplace" onClick={() => setMobile(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl">
              <TrendingUp size={15} /> Marketplace
            </Link>
            {NAV.map(item => (
              <Link key={item.key} to={item.key === 'stores' ? '/stores' : `/marketplace?label=${item.key}`}
                onClick={() => setMobile(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-gray-50"
                style={{ color: item.color }}>
                <item.icon size={15} /> {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-3 flex gap-2 border-t border-gray-100 mt-2">
                <Link to="/login"    onClick={() => setMobile(false)} className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Sign In</Link>
                <Link to="/register" onClick={() => setMobile(false)} className="flex-1 text-center py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Start Selling</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
