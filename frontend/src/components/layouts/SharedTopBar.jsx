import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { customerApi } from '../../api/services'
import { Bell, Search, ChevronDown, Store, ShieldCheck, User, LogOut, Settings } from 'lucide-react'

export default function SharedTopBar({ onMenuToggle, panelType = 'vendor' }) {
  const { user }  = useSelector(s => s.auth)
  const { myStore } = useSelector(s => s.store)
  const navigate    = useNavigate()
  const [notifCount, setNotifCount] = useState(0)
  const [userMenu,   setUserMenu]   = useState(false)

  useEffect(() => {
    if (user?.role === 'customer' || user?.role === 'vendor') {
      customerApi.getNotifs().then(r => setNotifCount(r.data.unreadCount || 0)).catch(() => {})
    }
  }, [user])

  const panelLabel = panelType === 'admin' ? 'Super Admin' : 'Vendor Dashboard'
  const panelIcon  = panelType === 'admin' ? ShieldCheck : Store

  return (
    <header className={`flex items-center justify-between px-6 h-16 flex-shrink-0 border-b ${panelType === 'admin' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className={`lg:hidden p-2 rounded-lg ${panelType === 'admin' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}
        <div className="hidden lg:flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${panelType === 'admin' ? 'bg-indigo-600' : 'bg-indigo-50'}`}>
            <panelIcon size={14} className={panelType === 'admin' ? 'text-white' : 'text-indigo-600'} />
          </div>
          <span className={`text-sm font-semibold ${panelType === 'admin' ? 'text-gray-300' : 'text-gray-500'}`}>{panelLabel}</span>
        </div>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        {/* View storefront */}
        {panelType === 'vendor' && myStore?.slug && (
          <a href={`/store/${myStore.slug}`} target="_blank" rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
            <Store size={13} /> View Store
          </a>
        )}

        {/* Notifications bell */}
        <div className="relative">
          <button className={`relative p-2 rounded-xl transition-colors ${panelType === 'admin' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Bell size={17} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setUserMenu(!userMenu)}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors ${panelType === 'admin' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden ${panelType === 'admin' ? 'bg-indigo-700' : 'bg-indigo-100'}`}>
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <span className={`text-xs font-bold ${panelType === 'admin' ? 'text-indigo-200' : 'text-indigo-600'}`}>{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <span className={`text-sm font-semibold hidden sm:block ${panelType === 'admin' ? 'text-gray-300' : 'text-gray-700'}`}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={13} className={panelType === 'admin' ? 'text-gray-500' : 'text-gray-400'} />
          </button>

          {userMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${panelType === 'admin' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              {panelType === 'vendor' && (
                <button onClick={() => { navigate('/dashboard/settings'); setUserMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings size={14} /> Store Settings
                </button>
              )}
              <button onClick={() => { navigate('/dashboard?logout=1'); setUserMenu(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
