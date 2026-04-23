import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/authSlice'
import {
  LayoutDashboard, Store, Users, BarChart3, LogOut, BookOpen,
  ShieldCheck, Image, CreditCard, Menu, X, Bell, Globe,
  FileText, Layers, Receipt
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/stores',        label: 'Stores',        icon: Store },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Receipt },
  { to: '/admin/plans',         label: 'Plan Builder',  icon: Layers },
  { to: '/admin/users',         label: 'Users',         icon: Users },
  { to: '/admin/banners',       label: 'Banners',       icon: Image },
  { to: '/admin/cms',           label: 'CMS Pages',     icon: FileText },
  { to: '/admin/blog',          label: 'Blog',          icon: BookOpen },
  { to: '/admin/analytics',     label: 'Analytics',     icon: BarChart3 },
]

export default function AdminLayout() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const SidebarContent = () => (
    <aside className="w-60 flex flex-col bg-gray-900 h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">Admin Panel</p>
            <p className="text-xs text-gray-500">SaaSStore Platform</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white">
          <X size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-800 flex-shrink-0 space-y-1">
        <a href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
          <Globe size={14} /> View Platform
        </a>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <div className="hidden lg:flex flex-shrink-0"><SidebarContent /></div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-shrink-0 shadow-2xl"><SidebarContent /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 h-14 flex items-center px-4 sm:px-6 flex-shrink-0 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-800 rounded-xl text-gray-400">
            <Menu size={17} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Platform Live</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-400"><Bell size={15} /></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">
          <Outlet />
        </main>

        <footer className="bg-gray-900 border-t border-gray-800 px-6 py-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <ShieldCheck size={12} />
              <span>SaaSStore Admin © {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-4 text-gray-600">
              {['Privacy','Terms','Support'].map(l => <a key={l} href="#" className="hover:text-gray-400">{l}</a>)}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
