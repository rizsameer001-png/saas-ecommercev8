import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Info, Package, ArrowRight } from 'lucide-react'
import { Button, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

const CSV_COLUMNS = [
  { col: 'name',            type: 'Text',    required: true,  desc: 'Product name' },
  { col: 'sku',             type: 'Text',    required: false, desc: 'Unique stock code (used for update matching)' },
  { col: 'status',          type: 'Enum',    required: false, desc: 'active | draft | inactive | archived (default: active)' },
  { col: 'price',           type: 'Number',  required: true,  desc: 'Selling price (e.g. 29.99)' },
  { col: 'comparePrice',    type: 'Number',  required: false, desc: 'Original price for discount display' },
  { col: 'costPrice',       type: 'Number',  required: false, desc: 'Your cost (not shown to customers)' },
  { col: 'inventory',       type: 'Number',  required: false, desc: 'Stock quantity (default: 0)' },
  { col: 'trackInventory',  type: 'Boolean', required: false, desc: 'true | false (default: true)' },
  { col: 'isFeatured',      type: 'Boolean', required: false, desc: 'true | false — show in Featured section' },
  { col: 'isNewArrival',    type: 'Boolean', required: false, desc: 'true | false — show in New Arrivals' },
  { col: 'isOnSale',        type: 'Boolean', required: false, desc: 'true | false — show in On Sale' },
  { col: 'category',        type: 'Text',    required: false, desc: 'Category name (must exist in your store)' },
  { col: 'tags',            type: 'Text',    required: false, desc: 'Tags separated by | (e.g. summer|sale|trending)' },
  { col: 'description',     type: 'Text',    required: false, desc: 'Full product description' },
  { col: 'shortDescription',type: 'Text',    required: false, desc: 'Short summary for listings' },
  { col: 'size',            type: 'Text',    required: false, desc: 'Sizes separated by | (e.g. S|M|L|XL)' },
  { col: 'color',           type: 'Text',    required: false, desc: 'Colors separated by | (e.g. Red|Blue|Black)' },
  { col: 'material',        type: 'Text',    required: false, desc: 'Materials separated by |' },
  { col: 'storage',         type: 'Text',    required: false, desc: 'Storage options separated by | (e.g. 64GB|128GB)' },
  { col: 'ram',             type: 'Text',    required: false, desc: 'RAM options separated by |' },
  { col: 'weight',          type: 'Text',    required: false, desc: 'Weight string (e.g. 250g or 1.2kg)' },
  { col: 'bookFormat',      type: 'Enum',    required: false, desc: 'paperback | hardcover | ebook | audiobook' },
  { col: 'packageContents', type: 'Text',    required: false, desc: 'What is inside the box' },
  { col: 'imageUrl1–5',     type: 'URL',     required: false, desc: 'Up to 5 image URLs (first is primary)' },
  { col: 'youtubeUrl',      type: 'URL',     required: false, desc: 'YouTube video link' },
  { col: 'freeShipping',    type: 'Boolean', required: false, desc: 'true | false' },
  { col: 'barcode',         type: 'Text',    required: false, desc: 'Barcode / EAN / UPC' },
  { col: 'metaTitle',       type: 'Text',    required: false, desc: 'SEO page title' },
  { col: 'metaDescription', type: 'Text',    required: false, desc: 'SEO description' },
]

export default function VendorCSVImportExport() {
  const { myStore } = useSelector(s => s.store)
  const [dragging,  setDragging]  = useState(false)
  const [file,      setFile]      = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result,    setResult]    = useState(null)
  const fileRef = useRef()
  const slug = myStore?.slug

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
    else toast.error('Please drop a .csv file')
  }

  const handleImport = async () => {
    if (!file) return toast.error('Please select a CSV file first')
    if (!slug) return toast.error('Store not found')
    setImporting(true); setResult(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await api.post('/csv/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-store-slug': slug }
      })
      setResult(data.data)
      toast.success(data.message)
      setFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed')
    } finally { setImporting(false) }
  }

  const handleExport = async (status = '') => {
    if (!slug) return
    setExporting(true)
    try {
      const params = status ? `?status=${status}` : ''
      const response = await api.get(`/csv/export${params}`, {
        headers: { 'x-store-slug': slug },
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `${slug}-products-${Date.now()}.csv`)
      document.body.appendChild(link); link.click(); link.remove()
      toast.success('Products exported!')
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/csv/template', {
        headers: { 'x-store-slug': slug },
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url; link.setAttribute('download', 'product-import-template.csv')
      document.body.appendChild(link); link.click(); link.remove()
      toast.success('Template downloaded!')
    } catch { toast.error('Failed to download template') }
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Import / Export Products</h1>
        <p className="page-subtitle">Bulk manage your product catalog via CSV files</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* IMPORT */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Upload size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">Import Products</h3>
              <p className="text-xs text-gray-400">Upload a CSV to create or update products</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) setFile(f) }} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <span className="font-semibold text-indigo-700 text-sm">{file.name}</span>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                  className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            ) : (
              <>
                <Upload size={28} className={`mx-auto mb-2 transition-colors ${dragging ? 'text-indigo-500' : 'text-gray-300'}`} />
                <p className="text-sm font-semibold text-gray-700">Drop your CSV here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Max 5 MB · .csv files only</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              <Download size={12} /> Download template
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700"><strong>Upsert logic:</strong> If a row has a SKU matching an existing product, that product is updated. Otherwise a new product is created.</p>
          </div>

          <Button onClick={handleImport} loading={importing} className="w-full justify-center">
            <Upload size={14} /> Import CSV
          </Button>

          {/* Result */}
          {result && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                {result.skipped === 0 ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
                <p className="text-sm font-semibold text-gray-700">Import Results</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {[['Created', result.created, 'text-green-600'], ['Updated', result.updated, 'text-blue-600'], ['Skipped', result.skipped, 'text-amber-600']].map(([l, v, c]) => (
                  <div key={l} className="p-3 text-center">
                    <p className={`font-display font-bold text-xl ${c}`}>{v}</p>
                    <p className="text-xs text-gray-400">{l}</p>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div className="px-4 pb-3 border-t border-gray-100 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-red-600 mt-2 mb-1">Errors ({result.errors.length}):</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* EXPORT */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Download size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">Export Products</h3>
              <p className="text-xs text-gray-400">Download your products as a CSV file</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'All Products',      status: '',         desc: 'Export everything (all statuses)' },
              { label: 'Active Products',   status: 'active',   desc: 'Only visible, active products' },
              { label: 'Draft Products',    status: 'draft',    desc: 'Products not yet published' },
              { label: 'Archived Products', status: 'archived', desc: 'Soft-deleted / archived products' },
            ].map(({ label, status, desc }) => (
              <button key={label} onClick={() => handleExport(status)} disabled={exporting}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group disabled:opacity-50">
                <Download size={15} className="text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={13} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}
          </div>

          {exporting && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Spinner size="sm" /> <span className="text-sm text-gray-500">Generating export…</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Exported CSV can be edited and re-imported. SKU-based matching prevents duplicate creation.</p>
          </div>
        </div>
      </div>

      {/* CSV Column reference */}
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-4">CSV Column Reference</h3>
        <div className="overflow-x-auto">
          <table className="table text-xs">
            <thead>
              <tr><th>Column</th><th>Type</th><th>Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              {CSV_COLUMNS.map(c => (
                <tr key={c.col}>
                  <td><code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{c.col}</code></td>
                  <td><span className="text-gray-500">{c.type}</span></td>
                  <td>
                    {c.required
                      ? <span className="text-red-600 font-bold">Yes</span>
                      : <span className="text-gray-300">No</span>}
                  </td>
                  <td className="text-gray-500">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
