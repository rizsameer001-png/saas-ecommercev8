import { useEffect, useState } from 'react'
import { adminApi } from '../../api/services'
import { StatusBadge } from '../../components/ui/index'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = () => adminApi.getUsers().then(r => setUsers(r.data.data)).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])

  const toggleStatus = async (id) => {
    try { await adminApi.toggleUserStatus(id); toast.success('User status updated'); fetch() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-display font-bold text-white">Users</h1><p className="text-gray-400 text-sm mt-1">Manage platform users</p></div>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700">{['User','Role','Store','Joined','Status','Action'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-5 py-3"><div className="skeleton h-4 w-24 bg-gray-700" /></td>)}</tr>)
              : users.map(u => (
                <tr key={u._id} className="border-t border-gray-700 hover:bg-gray-700/40 transition-colors">
                  <td className="px-5 py-3"><p className="text-white font-medium">{u.name}</p><p className="text-gray-400 text-xs">{u.email}</p></td>
                  <td className="px-5 py-3"><span className={`badge ${u.role === 'super_admin' ? 'badge-red' : u.role === 'vendor' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                  <td className="px-5 py-3 text-gray-300 text-xs">{u.store?.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3"><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleStatus(u._id)} className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${u.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
