import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'

export default function PanelFooter({ panelType = 'vendor' }) {
  const year = new Date().getFullYear()
  const dark  = panelType === 'admin'

  return (
    <footer className={`flex-shrink-0 border-t px-6 py-4 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
            <Store size={10} className="text-white" />
          </div>
          <span className={dark ? 'text-gray-500' : 'text-gray-400'}>SaaSStore Platform © {year}</span>
        </div>
        <div className={`flex gap-4 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
          <a href="#" className="hover:text-indigo-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Support</a>
          {panelType === 'vendor' && (
            <Link to="/dashboard/billing" className="hover:text-indigo-500 transition-colors">Billing</Link>
          )}
        </div>
      </div>
    </footer>
  )
}
