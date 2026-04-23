import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import { CheckCircle, Zap, Crown, Rocket, Star, CreditCard, AlertCircle, Clock, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const PLAN_ICONS = { free: Star, basic: Zap, pro: Rocket, enterprise: Crown }
const PLAN_COLORS = {
  free:       { bg: 'from-gray-500 to-gray-600',  ring: 'ring-gray-200',  badge: 'bg-gray-100 text-gray-700' },
  basic:      { bg: 'from-blue-500 to-blue-600',  ring: 'ring-blue-200',  badge: 'bg-blue-100 text-blue-700' },
  pro:        { bg: 'from-indigo-500 to-purple-600', ring: 'ring-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  enterprise: { bg: 'from-amber-500 to-orange-600', ring: 'ring-amber-200', badge: 'bg-amber-100 text-amber-700' },
}

const FEATURE_LABELS = {
  maxProducts: 'Products', maxOrders: 'Orders/mo', storageGB: 'Storage (GB)',
  customDomain: 'Custom Domain', analytics: 'Advanced Analytics',
  prioritySupport: 'Priority Support', apiAccess: 'API Access',
  whiteLabelStore: 'White-Label Store', multiStaff: 'Multi-Staff Access', advancedSeo: 'Advanced SEO',
}

export default function VendorBilling() {
  const { user } = useSelector(s => s.auth)
  const [sub, setSub] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions'),
      api.get('/admin-ext/plans'),
    ]).then(([subRes, plansRes]) => {
      setSub(subRes.data.data)
      setPlans(plansRes.data.data)
    }).catch(console.error).finally(() => setLoading(false))

    // Handle PayPal return
    const params = new URLSearchParams(window.location.search)
    if (params.get('success')) toast.success('Subscription activated!')
    if (params.get('cancelled')) toast.error('Payment cancelled')
    if (params.get('paypal') === 'success') {
      api.post('/subscriptions/paypal/activate', {}).then(() => {
        toast.success('PayPal subscription activated!')
        window.location.reload()
      })
    }
  }, [])

  const handleStripe = async (plan) => {
    setProcessing(true)
    try {
      const { data } = await api.post('/subscriptions/stripe/checkout', { plan, billingCycle })
      if (data.url) window.location.href = data.url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stripe checkout failed')
    } finally { setProcessing(false) }
  }

  const handleRazorpay = async (plan) => {
    setProcessing(true)
    try {
      const { data } = await api.post('/subscriptions/razorpay/create', { plan, billingCycle })
      const options = {
        key: data.keyId,
        subscription_id: data.data.id,
        name: 'SaaSStore',
        description: `${plan} Plan - ${billingCycle}`,
        handler: async () => {
          await api.get('/subscriptions')
          toast.success('Razorpay subscription activated!')
          window.location.reload()
        },
        prefill: { email: user?.email, name: user?.name },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Razorpay not configured')
    } finally { setProcessing(false) }
  }

  const handlePayPal = async (plan) => {
    setProcessing(true)
    try {
      const { data } = await api.post('/subscriptions/paypal/create', { plan, billingCycle })
      if (data.approvalUrl) window.location.href = data.approvalUrl
      else toast.error('PayPal not configured')
    } catch (err) {
      toast.error(err.response?.data?.message || 'PayPal not configured')
    } finally { setProcessing(false) }
  }

  const handleCancel = async () => {
    try {
      await api.post('/subscriptions/cancel', { reason: 'Cancelled by vendor' })
      toast.success('Subscription will cancel at period end')
      setCancelModal(false)
      window.location.reload()
    } catch (err) { toast.error('Failed to cancel') }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  const currentPlan = plans.find(p => p.id === sub?.plan) || plans[0]
  const daysLeft = sub?.daysUntilExpiry
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isExpired = daysLeft !== null && daysLeft <= 0 && sub?.status !== 'free'

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Billing & Subscription</h1>
        <p className="page-subtitle">Manage your plan and payment methods</p>
      </div>

      {/* Expiry Alert */}
      {(isExpiringSoon || isExpired || sub?.status === 'past_due') && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
          isExpired || sub?.status === 'past_due' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <AlertCircle size={20} className={isExpired ? 'text-red-500' : 'text-amber-500'} />
          <div>
            <p className={`font-semibold ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
              {isExpired ? 'Your plan has expired' : sub?.status === 'past_due' ? 'Payment failed — update your payment method' : `Your plan expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
            </p>
            <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isExpired ? 'Renew now to restore full access to your store.' : 'Renew early to avoid interruption.'}
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      {sub && (
        <div className="card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${PLAN_COLORS[sub.plan]?.bg || PLAN_COLORS.free.bg} flex items-center justify-center`}>
                {(() => { const Icon = PLAN_ICONS[sub.plan] || Star; return <Icon size={24} className="text-white" /> })()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-display text-xl font-bold text-gray-900 capitalize">{sub.plan} Plan</h2>
                  <span className={`badge ${sub.status === 'active' ? 'badge-green' : sub.status === 'expired' ? 'badge-red' : sub.status === 'past_due' ? 'badge-red' : 'badge-yellow'}`}>
                    {sub.status}
                  </span>
                  {sub.gateway && sub.gateway !== 'manual' && (
                    <span className="badge badge-blue capitalize">{sub.gateway}</span>
                  )}
                </div>
                {sub.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock size={13} />
                    {sub.status === 'cancelled' ? 'Access until' : 'Renews'}: {format(new Date(sub.currentPeriodEnd), 'MMMM d, yyyy')}
                    {daysLeft !== null && daysLeft > 0 && <span className="text-gray-400">({daysLeft}d left)</span>}
                  </p>
                )}
              </div>
            </div>
            {sub.plan !== 'free' && sub.status === 'active' && (
              <button onClick={() => setCancelModal(true)} className="text-sm text-red-500 hover:text-red-700 font-medium">Cancel Plan</button>
            )}
          </div>

          {/* Feature Usage */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
            {['maxProducts','maxOrders','storageGB','customDomain','analytics'].map(f => {
              const val = sub.features?.[f]
              const isNum = typeof val === 'number'
              return (
                <div key={f} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{FEATURE_LABELS[f]}</p>
                  <p className="font-bold text-gray-900">{isNum ? (val === -1 ? '∞' : val.toLocaleString()) : (val ? '✓' : '✗')}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
          Yearly <span className="text-green-600 text-xs font-bold">(Save ~17%)</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map(plan => {
          const Icon = PLAN_ICONS[plan.id] || Star
          const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
          const isCurrent = sub?.plan === plan.id
          const isPopular = plan.popular

          return (
            <div key={plan.id} className={`relative bg-white rounded-3xl border-2 overflow-hidden transition-all ${
              isCurrent ? 'border-indigo-500 shadow-glow' : isPopular ? 'border-indigo-300 shadow-card' : 'border-gray-100 shadow-sm hover:shadow-card'
            }`}>
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <span className="badge badge-green text-[10px]">Current</span>
                </div>
              )}

              <div className="p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-lg capitalize mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-display text-3xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-400 text-sm">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>

                <div className="space-y-2 mb-6">
                  {Object.entries(FEATURE_LABELS).slice(0, 5).map(([key, label]) => {
                    const val = plan.features?.[key]
                    const isNum = typeof val === 'number'
                    const enabled = isNum ? val > 0 || val === -1 : !!val
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={13} className={enabled ? 'text-green-500' : 'text-gray-200'} />
                        <span className={enabled ? 'text-gray-700' : 'text-gray-300'}>
                          {isNum ? `${val === -1 ? 'Unlimited' : val.toLocaleString()} ${label}` : label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {plan.id === 'free' ? (
                  <div className="text-center py-2 text-sm text-gray-400 font-medium">Current free plan</div>
                ) : isCurrent ? (
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 cursor-default">
                    ✓ Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => { setSelectedPlan(plan.id); setPaymentModal(true) }}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                      isPopular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
                               : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {sub?.plan === 'free' || !sub ? 'Get Started' : 'Switch Plan'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Invoices */}
      {sub?.invoices?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-gray-800 mb-4">Invoice History</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Gateway</th><th></th></tr></thead>
              <tbody>
                {sub.invoices.map((inv, i) => (
                  <tr key={i}>
                    <td>{inv.paidAt ? format(new Date(inv.paidAt), 'MMM d, yyyy') : '—'}</td>
                    <td className="font-bold">${inv.amount?.toFixed(2)}</td>
                    <td><span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{inv.status}</span></td>
                    <td className="capitalize">{inv.gateway}</td>
                    <td>{inv.pdf && <a href={inv.pdf} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">PDF</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {paymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPaymentModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
            <button onClick={() => setPaymentModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl">
              <X size={18} />
            </button>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Choose Payment Method</h3>
            <p className="text-sm text-gray-500 mb-6 capitalize">
              {selectedPlan} Plan · {billingCycle} · ${plans.find(p => p.id === selectedPlan)?.[billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice']}/mo
            </p>

            <div className="space-y-3">
              {[
                { id: 'stripe', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Amex via Stripe', onClick: () => { setPaymentModal(false); handleStripe(selectedPlan) } },
                { id: 'razorpay', label: 'Razorpay', icon: '🏦', desc: 'UPI, Net Banking, Cards (India)', onClick: () => { setPaymentModal(false); handleRazorpay(selectedPlan) } },
                { id: 'paypal', label: 'PayPal', icon: '🔵', desc: 'PayPal account or card', onClick: () => { setPaymentModal(false); handlePayPal(selectedPlan) } },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={method.onClick}
                  disabled={processing}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left disabled:opacity-50"
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCancelModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-gray-500 mb-6">Your plan will remain active until {sub?.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy') : 'period end'}. After that, you'll be on the free plan.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="flex-1 btn-secondary">Keep Plan</button>
              <button onClick={handleCancel} className="flex-1 btn-danger">Cancel Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
