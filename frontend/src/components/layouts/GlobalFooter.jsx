import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import {
  Store, Sparkles, Flame, Star, Instagram, Twitter,
  Facebook, Youtube, ArrowRight, Globe, Mail
} from 'lucide-react'

const STATIC_LINKS = {
  Discover: [
    { label: 'New Arrivals',  to: '/marketplace?label=newArrival', icon: Sparkles, iconColor: 'text-emerald-400' },
    { label: 'On Sale',       to: '/marketplace?label=onSale',     icon: Flame,    iconColor: 'text-red-400'     },
    { label: 'Featured',      to: '/marketplace?label=featured',   icon: Star,     iconColor: 'text-amber-400'   },
    { label: 'All Stores',    to: '/stores' },
    { label: 'Marketplace',   to: '/marketplace' },
  ],
  Vendors: [
    { label: 'Start Selling',    to: '/register?role=vendor' },
    { label: 'Vendor Dashboard', to: '/dashboard' },
    { label: 'Import / Export',  to: '/dashboard/import-export' },
    { label: 'Custom Domain',    to: '/dashboard/payment-settings' },
  ],
}

const SOCIALS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter,   href: '#', label: 'Twitter'   },
  { icon: Facebook,  href: '#', label: 'Facebook'  },
  { icon: Youtube,   href: '#', label: 'YouTube'   },
]

// Group CMS footer links by footerGroup
function useCmsFooterLinks() {
  const [links, setLinks] = useState({ company: [], legal: [], support: [] })
  useEffect(() => {
    api.get('/admin-ext/cms?footerOnly=true')
      .then(r => {
        const pages = r.data.data || []
        const grouped = { company: [], legal: [], support: [] }
        pages.forEach(p => {
          if (p.showInFooter && p.footerGroup && grouped[p.footerGroup]) {
            grouped[p.footerGroup].push({ label: p.footerLabel || p.title, to: `/pages/${p.slug}` })
          }
        })
        setLinks(grouped)
      })
      .catch(() => {})
  }, [])
  return links
}

export default function GlobalFooter() {
  const cms = useCmsFooterLinks()

  // Build the Legal/Company/Support columns only if they have links
  const dynamicCols = Object.entries({
    Company: cms.company,
    Legal:   cms.legal,
    Support: cms.support,
  }).filter(([, links]) => links.length > 0)

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Store size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">SaaSStore</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
              The complete multi-tenant eCommerce platform. Launch your store, sell globally, grow fast.
            </p>
            <div className="flex gap-3 mb-6">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-all hover:scale-105">
                  <Icon size={15} className="text-gray-400" />
                </a>
              ))}
            </div>
            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Stay updated</p>
              <form onSubmit={e => e.preventDefault()} className="flex gap-2">
                <input type="email" placeholder="your@email.com"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl transition-colors flex-shrink-0">
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Discover + Vendors */}
          {Object.entries(STATIC_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-5">{section}</h4>
              <ul className="space-y-3">
                {links.map(({ label, to, icon: Icon, iconColor }) => (
                  <li key={label}>
                    <Link to={to}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                      {Icon && <Icon size={12} className={`${iconColor} flex-shrink-0`} />}
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Dynamic CMS columns — Legal / Company / Support */}
          {dynamicCols.length > 0 && (
            <div>
              {dynamicCols.map(([colLabel, links]) => (
                <div key={colLabel} className="mb-6 last:mb-0">
                  <h4 className="text-white font-semibold text-sm mb-3">{colLabel}</h4>
                  <ul className="space-y-2.5">
                    {links.map(({ label, to }) => (
                      <li key={label}>
                        <Link to={to} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} SaaSStore Platform. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-xs text-gray-600">
            {/* Static fallback legal links if no CMS pages */}
            {cms.legal.length === 0 && ['Privacy Policy','Terms of Service','Cookie Policy'].map(l => (
              <span key={l} className="text-gray-600">{l}</span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Globe size={12} />
            <span>Built for global commerce</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
