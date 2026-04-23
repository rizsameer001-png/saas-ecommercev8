import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { couponsApi } from '../../api/services'
import { Plus, Trash2, Percent } from 'lucide-react'
import { Button, Modal, Input, Select, StatusBadge, EmptyState, ConfirmDialog } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const DEFAULT = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', description: '', isActive: true }

export default function VendorCoupons() {
  const { myStore } = useSelector(s => s.store)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState(null)

  const fetch = async () => {
    if (!myStore?.slug) return
    setLoading(true)
    try { const { data } = await couponsApi.getAll(myStore.slug); setCoupons(data.data) }
    catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [myStore?.slug])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, value: parseFloat(form.value), minOrderAmount: parseFloat(form.minOrderAmount) || 0, maxDiscount: parseFloat(form.maxDiscount) || undefined, usageLimit: parseInt(form.usageLimit) || undefined }
      await couponsApi.create(myStore.slug, payload)
      toast.success('Coupon created!'); setModal(false); setForm(DEFAULT); fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create coupon') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await couponsApi.delete(myStore.slug, delTarget._id); toast.success('Coupon deleted'); setDelTarget(null); fetch() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Coupons</h1><p className="page-subtitle">{coupons.length} coupons</p></div>
        <Button onClick={() => setModal(true)}><Plus size={15} /> Create Coupon</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Usage</th><th>Expires</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {loading ? Array(4).fill(0).map((_, i) => <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton h-4 w-20" /></td>)}</tr>)
              : coupons.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Percent} title="No coupons yet" description="Create discount codes for your customers" action={<Button onClick={() => setModal(true)}><Plus size={14} /> Create Coupon</Button>} /></td></tr>
              : coupons.map(c => (
                <tr key={c._id}>
                  <td><span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{c.code}</span></td>
                  <td className="capitalize">{c.type.replace('_', ' ')}</td>
                  <td className="font-semibold">{c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `$${c.value}` : 'Free Ship'}</td>
                  <td>{c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td>{c.expiresAt ? format(new Date(c.expiresAt), 'MMM d, yyyy') : 'Never'}</td>
                  <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  <td><button onClick={() => setDelTarget(c)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Coupon">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Code *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="col-span-2" />
          <Select label="Type *" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
          </Select>
          <Input label="Value *" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '10.00'} />
          <Input label="Min Order ($)" type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" />
          {form.type === 'percentage' && <Input label="Max Discount ($)" type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="No limit" />}
          <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" />
          <Input label="Expires At" type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="col-span-2" />
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal note..." className="col-span-2" />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Create Coupon</Button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} title="Delete Coupon" message={`Delete coupon "${delTarget?.code}"?`} danger />
    </div>
  )
}
