// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' }
  return (
    <div className={`${sizes[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`} />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors text-sm font-medium',
    outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: '', lg: 'px-7 py-3.5 text-base' }

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} inline-flex items-center gap-2 ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input ${error ? 'border-red-400' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={`input resize-none ${error ? 'border-red-400' : ''} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-slide-up`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-display font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active: 'badge-green', pending: 'badge-yellow', confirmed: 'badge-blue',
  processing: 'badge-blue', shipped: 'badge-purple', delivered: 'badge-green',
  cancelled: 'badge-red', paid: 'badge-green', failed: 'badge-red',
  refunded: 'badge-gray', draft: 'badge-gray', inactive: 'badge-gray',
  free: 'badge-gray', basic: 'badge-blue', pro: 'badge-purple', enterprise: 'badge-green',
  out_for_delivery: 'badge-purple', packed: 'badge-blue', suspended: 'badge-red',
}

export function StatusBadge({ status }) {
  return (
    <span className={STATUS_COLORS[status] || 'badge-gray'}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-primary-400" />
        </div>
      )}
      <h3 className="text-lg font-display font-bold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ title, value, icon: Icon, growth, prefix = '', suffix = '', color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  const isPositive = growth >= 0

  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-display font-bold text-gray-900 mt-0.5">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(growth)}% vs last period
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {p}
          </button>
        )
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
import { Upload, ImageIcon } from 'lucide-react'

export function ImageUpload({ value, onChange, multiple = false, className = '' }) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files)
    if (multiple) {
      const urls = files.map(f => URL.createObjectURL(f))
      onChange(urls)
    } else {
      onChange(URL.createObjectURL(files[0]))
    }
  }

  return (
    <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all ${className}`}>
      <input type="file" accept="image/*" multiple={multiple} onChange={handleChange} className="hidden" />
      {value ? (
        <img src={Array.isArray(value) ? value[0] : value} alt="" className="w-full h-32 object-cover rounded-lg" />
      ) : (
        <>
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
            <ImageIcon size={20} className="text-primary-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">Click to upload image</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
        </>
      )}
    </label>
  )
}

// ─── Search Input ─────────────────────────────────────────────────────────────
import { Search } from 'lucide-react'
import { useState, useCallback } from 'react'

export function SearchInput({ onSearch, placeholder = 'Search...', className = '' }) {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e) => {
    setValue(e.target.value)
    onSearch(e.target.value)
  }, [onSearch])

  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="input pl-9 pr-4"
      />
    </div>
  )
}

// ─── Price Display ────────────────────────────────────────────────────────────
export function Price({ amount, currency = '$', className = '' }) {
  return (
    <span className={className}>
      {currency}{typeof amount === 'number' ? amount.toFixed(2) : '0.00'}
    </span>
  )
}

// ─── Rating Stars ─────────────────────────────────────────────────────────────
import { Star } from 'lucide-react'

export function RatingStars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="text-center py-12 text-gray-400">Loading...</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

// ─── Dropdown ────────────────────────────────────────────────────────────────
import { useRef } from 'react'
import { MoreVertical } from 'lucide-react'

export function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden animate-slide-up">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
