import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { productsApi, categoriesApi } from '../../api/services'
import api from '../../api/axios'
import { Plus, Edit, Archive, Eye, Package, Search, Tag, Flame, Sparkles, Star, RotateCcw, Trash2, ChevronDown } from 'lucide-react'
import { Button, StatusBadge, SearchInput, Pagination, ActionMenu, EmptyState, ConfirmDialog, Select } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function VendorProducts() {
  const { myStore } = useSelector(s => s.store)
  const navigate = useNavigate()
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const [pages, setPages]           = useState(1)
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState('active')
  const [catFilter, setCatFilter]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkSelected, setBulkSelected] = useState([])
  const [bulkStatus, setBulkStatus]     = useState('')
  const LIMIT = 15

  const fetchProducts = useCallback(async () => {
    if (!myStore?.slug) return
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (search)    params.search   = search
      if (status)    params.status   = status
      if (catFilter) params.category = catFilter

      const { data } = await productsApi.getAll(myStore.slug, params)
      setProducts(data.data)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
    } catch (err) { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [myStore?.slug, page, search, status, catFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    if (myStore?.slug) {
      api.get('/categories?activeOnly=false', { headers: { 'x-store-slug': myStore.slug } })
        .then(r => setCategories(r.data.data)).catch(() => {})
    }
  }, [myStore?.slug])

  const handleArchive = async () => {
    try {
      await productsApi.delete(myStore.slug, deleteTarget._id)
      toast.success('Product archived')
      setDeleteTarget(null)
      fetchProducts()
    } catch { toast.error('Failed to archive') }
  }

  const handleRestore = async (product) => {
    try {
      await productsApi.update(myStore.slug, product._id, { status: 'active' })
      toast.success('Product restored to Active')
      fetchProducts()
    } catch { toast.error('Failed to restore') }
  }

  const handleBulkStatus = async () => {
    if (!bulkStatus || bulkSelected.length === 0) return
    try {
      await productsApi.bulkStatus(myStore.slug, { ids: bulkSelected, status: bulkStatus })
      toast.success(`${bulkSelected.length} products updated`)
      setBulkSelected([])
      setBulkStatus('')
      fetchProducts()
    } catch { toast.error('Bulk update failed') }
  }

  const toggleSelect = (id) => setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll    = () => setBulkSelected(bulkSelected.length === products.length ? [] : products.map(p => p._id))

  const currency = myStore?.settings?.currencySymbol || '$'

  // Category path display
  const getCategoryLabel = (product) => {
    if (!product.category) return '—'
    const cat = typeof product.category === 'object' ? product.category : categories.find(c => c._id === product.category)
    if (!cat) return '—'
    return cat.path?.join(' › ') || cat.name || '—'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} total products</p>
        </div>
        <Link to="/dashboard/products/new">
          <Button><Plus size={15} /> Add Product</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput onSearch={v => { setSearch(v); setPage(1) }} placeholder="Search products…" className="flex-1 min-w-48" />

          <Select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="w-36">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>

          <Select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }} className="w-48">
            <option value="">All Categories</option>
            {[...categories].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name)).map(c => (
              <option key={c._id} value={c._id}>{'— '.repeat(c.depth)}{c.name}</option>
            ))}
          </Select>

          {/* Bulk actions */}
          {bulkSelected.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600 font-medium">{bulkSelected.length} selected</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="input text-sm w-32 py-2">
                <option value="">Set status…</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archive</option>
              </select>
              <Button variant="secondary" onClick={handleBulkStatus} disabled={!bulkStatus}>Apply</Button>
              <button onClick={() => setBulkSelected([])} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={bulkSelected.length === products.length && products.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-indigo-600" />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Labels</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Sales</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(9).fill(0).map((_, j) => <td key={j}><div className="skeleton h-4 w-20" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description={status === 'archived' ? 'No archived products' : 'Add your first product to start selling'}
                      action={status !== 'archived' && (
                        <Link to="/dashboard/products/new">
                          <Button><Plus size={14} /> Add Product</Button>
                        </Link>
                      )}
                    />
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const img = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url
                  const isLow = product.trackInventory && product.inventory <= (product.lowStockAlert || 10) && product.inventory > 0
                  const isOut = product.trackInventory && product.inventory === 0 && !product.hasVariants

                  return (
                    <tr key={product._id} className={bulkSelected.includes(product._id) ? 'bg-indigo-50' : ''}>
                      <td>
                        <input type="checkbox"
                          checked={bulkSelected.includes(product._id)}
                          onChange={() => toggleSelect(product._id)}
                          className="w-4 h-4 rounded accent-indigo-600" />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                            {img
                              ? <img src={img} alt={product.name} className="w-full h-full object-cover" />
                              : <Package size={16} className="m-auto mt-3 text-gray-400" />
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                            {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                            {product.hasVariants && (
                              <p className="text-xs text-indigo-500">{product.variants?.length} variants</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 truncate max-w-[120px] block">
                          {getCategoryLabel(product)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {product.labels?.isFeatured   && <span className="badge bg-amber-100 text-amber-700 text-[10px]">⭐</span>}
                          {product.labels?.isNewArrival && <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">✨</span>}
                          {product.labels?.isOnSale     && <span className="badge bg-red-100 text-red-700 text-[10px]">🔥</span>}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{currency}{product.price?.toFixed(2)}</p>
                          {product.comparePrice > product.price && (
                            <p className="text-xs text-gray-400 line-through">{currency}{product.comparePrice?.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        {product.trackInventory ? (
                          <span className={`text-sm font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>
                            {product.hasVariants ? 'Variants' : product.inventory}
                            {isLow && !isOut && <span className="ml-1 text-[10px]">⚠️</span>}
                            {isOut && <span className="ml-1 text-[10px]">❌</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">∞</span>
                        )}
                      </td>
                      <td><StatusBadge status={product.status} /></td>
                      <td className="font-semibold text-gray-700 text-sm">{product.stats?.sales || 0}</td>
                      <td>
                        <ActionMenu items={[
                          {
                            label: 'View on store',
                            icon: Eye,
                            onClick: () => window.open(`/store/${myStore?.slug}/products/${product.slug || product._id}`, '_blank')
                          },
                          {
                            label: 'Edit',
                            icon: Edit,
                            onClick: () => navigate(`/dashboard/products/${product._id}/edit`)
                          },
                          product.status === 'archived'
                            ? { label: 'Restore', icon: RotateCcw, onClick: () => handleRestore(product) }
                            : { label: 'Archive', icon: Archive, onClick: () => setDeleteTarget(product), danger: true },
                        ]} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {products.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleArchive}
        title="Archive Product"
        message={`Archive "${deleteTarget?.name}"? It will be hidden from your store but not deleted. You can restore it later.`}
        danger
      />
    </div>
  )
}
