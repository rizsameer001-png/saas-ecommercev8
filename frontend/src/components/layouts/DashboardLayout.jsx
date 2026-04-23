import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'
import { useEffect, useState } from 'react'
import { fetchMyStore } from '../../store/storeSlice'
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Percent,
  BarChart3, Settings, LogOut, Store, Users, Menu,
  ExternalLink, Bell, CreditCard, AlertTriangle,
  List, Image, Download, Globe, X
} from 'lucide-react'
import api from '../../api/axios'

const NAV = [
  { to: '/dashboard',                label: 'Overview',       icon: LayoutDashboard, end: true },
  { to: '/dashboard/orders',         label: 'Orders',         icon: ShoppingCart },
  { to: '/dashboard/products',       label: 'Products',       icon: Package },
  { to: '/dashboard/categories',     label: 'Categories',     icon: Tag },
  { to: '/dashboard/attributes',     label: 'Attributes',     icon: List },
  { to: '/dashboard/coupons',        label: 'Coupons',        icon: Percent },
  { to: '/dashboard/banners',        label: 'Banners & Ads',  icon: Image },
  { to: '/dashboard/customers',      label: 'Customers',      icon: Users },
  { to: '/dashboard/analytics',      label: 'Analytics',      icon: BarChart3 },
  { to: '/dashboard/import-export',  label: 'Import / Export',icon: Download },
  { to: '/dashboard/payment-settings',label: 'Payments & Domain', icon: Globe },
  { to: '/dashboard/billing',        label: 'Billing',        icon: CreditCard },
  { to: '/dashboard/settings',       label: 'Settings',       icon: Settings },
]

const PLAN_PILL = { free:'bg-gray-100 text-gray-600', basic:'bg-blue-100 text-blue-700', pro:'bg-indigo-100 text-indigo-700', enterprise:'bg-amber-100 text-amber-700' }

export default function DashboardLayout() {
  const { user }    = useSelector(s => s.auth)
  const { myStore } = useSelector(s => s.store)
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sub, setSub] = useState(null)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => { dispatch(fetchMyStore()) }, [dispatch])
  useEffect(() => {
    api.get('/subscriptions').then(r => setSub(r.data.data)).catch(() => {})
    api.get('/customer/notifications').then(r => setNotifCount(r.data.unreadCount || 0)).catch(() => {})
  }, [])

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const SidebarContent = () => (
    <aside className="w-64 flex flex-col bg-white border-r border-gray-100 h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-gray-900 text-sm truncate">{myStore?.name || 'My Store'}</p>
            <p className="text-xs text-gray-400">Vendor Dashboard</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>
      </div>

      {/* Subscription badge */}
      {sub && (
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PLAN_PILL[sub.plan] || PLAN_PILL.free}`}>
              {sub.plan} Plan
            </span>
            {sub.daysUntilExpiry !== null && sub.daysUntilExpiry <= 7 && sub.daysUntilExpiry > 0 && (
              <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                <AlertTriangle size={11} /> {sub.daysUntilExpiry}d
              </div>
            )}
            {sub.status === 'expired' && <span className="text-xs font-bold text-red-600">Expired</span>}
          </div>
          {(sub.plan === 'free' || sub.status === 'expired') && (
            <button onClick={() => navigate('/dashboard/billing')}
              className="mt-1.5 text-xs text-indigo-600 font-semibold hover:underline">
              Upgrade Plan →
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            <Icon size={15} />
            <span className="truncate">{label}</span>
            {label === 'Billing' && sub?.status === 'expired' && (
              <span className="ml-auto w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0 space-y-1">
        {myStore && (
          <a href={`/store/${myStore.slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
            <ExternalLink size={14} /> View Storefront
          </a>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0"><SidebarContent /></div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex-shrink-0 shadow-2xl animate-slide-right"><SidebarContent /></div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 flex-shrink-0 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
            <Menu size={17} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/dashboard/billing')} className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell size={16} className="text-gray-600" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
