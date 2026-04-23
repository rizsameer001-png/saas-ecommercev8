import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersApi } from '../../api/services'
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, CreditCard, User } from 'lucide-react'
import { Button, StatusBadge, Modal, Select, Input } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirm Order' },
  { value: 'processing', label: 'Mark Processing' },
  { value: 'packed', label: 'Mark Packed' },
  { value: 'shipped', label: 'Mark Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Mark Delivered' },
  { value: 'cancelled', label: 'Cancel Order' },
]

export default function VendorOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusModal, setStatusModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', message: '', trackingNumber: '', carrier: '', cancelReason: '' })

  useEffect(() => {
    ordersApi.getOne(id).then(r => setOrder(r.data.data)).catch(() => toast.error('Order not found')).finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      const { data } = await ordersApi.updateStatus(id, statusForm)
      setOrder(data.data)
      setStatusModal(false)
      toast.success(`Order status updated to ${statusForm.status}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally { setUpdating(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>

  const TIMELINE = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
  const currentStep = TIMELINE.indexOf(order.status)

  return (
    <div className="max-w-5xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">Order #{order.orderNumber}</h1>
            <p className="page-subtitle">{format(new Date(order.createdAt), 'MMMM d, yyyy · h:mm a')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Button onClick={() => { setStatusForm({ status: '', message: '', trackingNumber: order.tracking?.trackingNumber || '', carrier: order.tracking?.carrier || '', cancelReason: '' }); setStatusModal(true) }}>
            Update Status
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-5">Order Progress</h3>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < currentStep ? 'bg-green-500 text-white' :
                    i === currentStep ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStep ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <p className={`text-[10px] mt-1 font-medium whitespace-nowrap ${i <= currentStep ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.replace(/_/g, ' ')}
                  </p>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={20} className="m-auto mt-3 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    {item.variantInfo && <p className="text-xs text-gray-500">{item.variantInfo}</p>}
                    {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
              {[
                { label: 'Subtotal', value: order.pricing?.subtotal },
                order.pricing?.couponDiscount > 0 && { label: `Coupon (${order.pricing?.couponCode})`, value: -order.pricing?.couponDiscount },
                order.pricing?.tax > 0 && { label: `Tax (${order.pricing?.taxRate}%)`, value: order.pricing?.tax },
                { label: 'Shipping', value: order.pricing?.shipping },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-medium ${value < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {value < 0 ? '-' : ''}${Math.abs(value)?.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>${order.pricing?.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-4">Activity Log</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{h.message || h.status}</p>
                    <p className="text-xs text-gray-400">{format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-3 flex items-center gap-2"><User size={15} /> Customer</h3>
            {order.customer ? (
              <div>
                <p className="font-semibold text-gray-800">{order.customer.name}</p>
                <p className="text-sm text-gray-500">{order.customer.email}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-800">{order.guestInfo?.name}</p>
                <p className="text-sm text-gray-500">{order.guestInfo?.email}</p>
                <span className="badge badge-gray mt-1">Guest</span>
              </div>
            )}
          </div>

          {/* Shipping */}
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={15} /> Shipping Address</h3>
            <address className="text-sm text-gray-600 not-italic space-y-0.5">
              <p className="font-semibold text-gray-800">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && <p className="mt-1">📞 {order.shippingAddress.phone}</p>}
            </address>
          </div>

          {/* Payment */}
          <div className="card">
            <h3 className="font-display font-bold text-gray-800 mb-3 flex items-center gap-2"><CreditCard size={15} /> Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-800 uppercase">{order.payment?.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={order.payment?.status} />
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction</span>
                  <span className="font-mono text-xs text-gray-600 truncate ml-2">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking?.trackingNumber && (
            <div className="card">
              <h3 className="font-display font-bold text-gray-800 mb-3 flex items-center gap-2"><Truck size={15} /> Tracking</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Carrier:</span> <span className="font-medium">{order.tracking.carrier}</span></p>
                <p><span className="text-gray-500">Tracking #:</span> <span className="font-mono font-medium">{order.tracking.trackingNumber}</span></p>
                {order.tracking.trackingUrl && (
                  <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">Track Package →</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status">
        <div className="space-y-4">
          <Select label="New Status" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
            <option value="">Select status...</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Input label="Note (optional)" value={statusForm.message} onChange={e => setStatusForm(f => ({ ...f, message: e.target.value }))} placeholder="Add a note..." />
          {statusForm.status === 'shipped' && (
            <>
              <Input label="Tracking Number" value={statusForm.trackingNumber} onChange={e => setStatusForm(f => ({ ...f, trackingNumber: e.target.value }))} placeholder="e.g. 1Z999AA10123456784" />
              <Input label="Carrier" value={statusForm.carrier} onChange={e => setStatusForm(f => ({ ...f, carrier: e.target.value }))} placeholder="e.g. FedEx, UPS, DHL" />
            </>
          )}
          {statusForm.status === 'cancelled' && (
            <Input label="Cancellation Reason" value={statusForm.cancelReason} onChange={e => setStatusForm(f => ({ ...f, cancelReason: e.target.value }))} placeholder="Reason for cancellation..." />
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} loading={updating} disabled={!statusForm.status}>Update Status</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
