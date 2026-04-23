import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import {
  CreditCard, Globe, CheckCircle, AlertCircle, Copy, RefreshCw,
  Eye, EyeOff, Plus, Trash2, Save, Shield, Zap, ExternalLink
} from 'lucide-react'
import { Button, Input, Textarea, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

// ─── Gateway toggle card ──────────────────────────────────────────────────────
function GatewayCard({ id, label, icon: Icon, iconColor, children, enabled, onToggle, description }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${enabled ? 'border-indigo-400 shadow-sm' : 'border-gray-100'}`}>
      <div className={`flex items-center justify-between px-5 py-4 ${enabled ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${iconColor}`}>
            {Icon ? <Icon size={18} /> : <span>{label[0]}</span>}
          </div>
          <div>
            <p className="font-display font-bold text-gray-800">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={onToggle} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
        </label>
      </div>
      {enabled && <div className="px-5 py-5 space-y-3 border-t border-gray-100">{children}</div>}
    </div>
  )
}

// ─── Secret field with show/hide ─────────────────────────────────────────────
function SecretField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input w-full pr-10 font-mono text-sm"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function VendorPaymentSettings() {
  const { myStore }  = useSelector(s => s.store)
  const [tab, setTab] = useState('payments')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Payment state
  const [payments, setPayments] = useState({
    stripe:       { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
    razorpay:     { enabled: false, keyId: '', keySecret: '' },
    paypal:       { enabled: false, clientId: '', clientSecret: '', sandbox: true },
    cod:          { enabled: true,  label: 'Cash on Delivery', instructions: '' },
    bankTransfer: { enabled: false, bankName: '', accountName: '', accountNumber: '', routingNumber: '', instructions: '' },
  })

  // Domain state
  const [domain,    setDomain]    = useState('')
  const [domainInfo, setDomainInfo] = useState(null)
  const [verified,  setVerified]  = useState(false)
  const [token,     setToken]     = useState('')

  useEffect(() => {
    if (!myStore) return
    setDomain(myStore.customDomain || '')
    setVerified(myStore.domainVerified || false)

    api.get('/store-settings/payment-settings')
      .then(r => setPayments(p => ({ ...p, ...r.data.data })))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [myStore])

  const setGw   = (gw, field, val) => setPayments(p => ({ ...p, [gw]: { ...p[gw], [field]: val } }))
  const toggleGw = (gw) => setPayments(p => ({ ...p, [gw]: { ...p[gw], enabled: !p[gw].enabled } }))

  const savePayments = async () => {
    setSaving(true)
    try {
      await api.put('/store-settings/payment-settings', payments)
      toast.success('Payment settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const saveDomain = async () => {
    if (!domain.trim()) return toast.error('Enter a domain name')
    setSaving(true)
    try {
      const { data } = await api.post('/store-settings/custom-domain', { domain: domain.trim() })
      setDomainInfo(data.data)
      setToken(data.data.verificationToken)
      toast.success('Domain saved — complete DNS verification below')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const verifyDomain = async () => {
    setVerifying(true)
    try {
      const { data } = await api.post('/store-settings/custom-domain/verify')
      if (data.verified) {
        setVerified(true); toast.success('Domain verified! Your custom domain is now live.')
      } else {
        toast.error('DNS not verified yet. Allow 24–48 hours for propagation.')
      }
    } catch { toast.error('Verification check failed') }
    finally { setVerifying(false) }
  }

  const removeDomain = async () => {
    try {
      await api.delete('/store-settings/custom-domain')
      setDomain(''); setDomainInfo(null); setVerified(false); setToken('')
      toast.success('Custom domain removed')
    } catch { toast.error('Failed to remove') }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => {})
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="xl" /></div>

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Payments & Domain</h1>
        <p className="page-subtitle">Configure payment gateways and custom domain</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-100">
        {[['payments','💳 Payment Gateways'],['domain','🌐 Custom Domain']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab===t?'border-indigo-500 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── PAYMENT GATEWAYS ── */}
      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <Shield size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Secret keys are stored securely and never exposed to customers. Masked in display after saving.</p>
          </div>

          {/* Stripe */}
          <GatewayCard id="stripe" label="Stripe" icon={CreditCard} iconColor="bg-indigo-100 text-indigo-600"
            description="Credit/Debit cards, Apple Pay, Google Pay" enabled={payments.stripe.enabled}
            onToggle={() => toggleGw('stripe')}>
            <Input label="Publishable Key (pk_live_... or pk_test_...)" value={payments.stripe.publicKey}
              onChange={v => setGw('stripe','publicKey',v)} placeholder="pk_live_xxx" />
            <SecretField label="Secret Key (sk_live_... or sk_test_...)" value={payments.stripe.secretKey}
              onChange={v => setGw('stripe','secretKey',v)} placeholder="sk_live_xxx"
              hint="Never share this key. Used server-side only." />
            <SecretField label="Webhook Secret (whsec_...)" value={payments.stripe.webhookSecret}
              onChange={v => setGw('stripe','webhookSecret',v)} placeholder="whsec_xxx"
              hint="From your Stripe Dashboard → Webhooks." />
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium">
              Get Stripe API keys <ExternalLink size={11} />
            </a>
          </GatewayCard>

          {/* Razorpay */}
          <GatewayCard id="razorpay" label="Razorpay" icon={Zap} iconColor="bg-blue-100 text-blue-600"
            description="UPI, Net Banking, Cards, Wallets, EMI (India)" enabled={payments.razorpay.enabled}
            onToggle={() => toggleGw('razorpay')}>
            <Input label="Key ID (rzp_live_... or rzp_test_...)" value={payments.razorpay.keyId}
              onChange={v => setGw('razorpay','keyId',v)} placeholder="rzp_live_xxx" />
            <SecretField label="Key Secret" value={payments.razorpay.keySecret}
              onChange={v => setGw('razorpay','keySecret',v)} placeholder="Your Razorpay secret" />
            <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              Get Razorpay API keys <ExternalLink size={11} />
            </a>
          </GatewayCard>

          {/* PayPal */}
          <GatewayCard id="paypal" label="PayPal" icon={null} iconColor="bg-blue-100 text-blue-800"
            description="PayPal account or card via PayPal" enabled={payments.paypal.enabled}
            onToggle={() => toggleGw('paypal')}>
            <Input label="Client ID" value={payments.paypal.clientId}
              onChange={v => setGw('paypal','clientId',v)} placeholder="AaB3dEfGhI..." />
            <SecretField label="Client Secret" value={payments.paypal.clientSecret}
              onChange={v => setGw('paypal','clientSecret',v)} placeholder="Your PayPal secret" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={payments.paypal.sandbox}
                onChange={e => setGw('paypal','sandbox',e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Use Sandbox (test) mode</span>
            </label>
          </GatewayCard>

          {/* COD */}
          <GatewayCard id="cod" label="Cash on Delivery" icon={null} iconColor="bg-green-100 text-green-600"
            description="Customer pays cash at delivery" enabled={payments.cod.enabled}
            onToggle={() => toggleGw('cod')}>
            <Input label="Label shown to customers" value={payments.cod.label}
              onChange={v => setGw('cod','label',v)} placeholder="Cash on Delivery" />
            <Textarea label="Instructions (optional)" value={payments.cod.instructions}
              onChange={e => setGw('cod','instructions',e.target.value)} rows={2}
              placeholder="e.g. Please have exact change ready" />
          </GatewayCard>

          {/* Bank Transfer */}
          <GatewayCard id="bankTransfer" label="Bank Transfer" icon={null} iconColor="bg-emerald-100 text-emerald-600"
            description="Manual bank / wire transfer" enabled={payments.bankTransfer.enabled}
            onToggle={() => toggleGw('bankTransfer')}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bank Name" value={payments.bankTransfer.bankName} onChange={v => setGw('bankTransfer','bankName',v)} placeholder="First National Bank" />
              <Input label="Account Name" value={payments.bankTransfer.accountName} onChange={v => setGw('bankTransfer','accountName',v)} placeholder="Your Business Name" />
              <Input label="Account Number" value={payments.bankTransfer.accountNumber} onChange={v => setGw('bankTransfer','accountNumber',v)} placeholder="000-1234567" />
              <Input label="Routing / Sort Code" value={payments.bankTransfer.routingNumber} onChange={v => setGw('bankTransfer','routingNumber',v)} placeholder="021000021" />
            </div>
            <Textarea label="Payment Instructions" value={payments.bankTransfer.instructions}
              onChange={e => setGw('bankTransfer','instructions',e.target.value)} rows={3}
              placeholder="Include your order number in the transfer reference." />
          </GatewayCard>

          <Button onClick={savePayments} loading={saving} className="w-full justify-center py-3 text-base">
            <Save size={15} /> Save Payment Settings
          </Button>
        </div>
      )}

      {/* ── CUSTOM DOMAIN ── */}
      {tab === 'domain' && (
        <div className="space-y-5">
          <div className="card space-y-4">
            <h3 className="font-display font-bold text-gray-800">Custom Domain</h3>
            <p className="text-sm text-gray-500">Connect your own domain (e.g. <code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">www.mybrand.com</code>) to your SaaSStore storefront.</p>

            {verified && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle size={16} className="text-green-500" />
                <p className="text-sm font-semibold text-green-700">✓ Domain verified and active: <strong>{myStore?.customDomain}</strong></p>
              </div>
            )}

            <div className="flex gap-2">
              <Input value={domain} onChange={e => setDomain(e.target.value)}
                placeholder="www.yourdomain.com" className="flex-1"
                label="Your Domain" />
              <div className="pt-6">
                <Button onClick={saveDomain} loading={saving}>Set Domain</Button>
              </div>
            </div>

            {/* DNS Instructions */}
            {(domainInfo || myStore?.customDomain) && !verified && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-800 mb-3">⚙️ Add ONE of these DNS records to verify your domain:</p>

                  {/* Option 1: CNAME */}
                  <div className="bg-white rounded-xl border border-amber-100 p-3 mb-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">Option 1 — CNAME Record</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[['Type','CNAME'],['Name','www'],['Value','shops.saasstore.com']].map(([k,v]) => (
                        <div key={k} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-400 font-medium">{k}</p>
                          <p className="font-mono font-bold text-gray-800 mt-0.5 truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option 2: TXT */}
                  {token && (
                    <div className="bg-white rounded-xl border border-amber-100 p-3">
                      <p className="text-xs font-bold text-gray-600 mb-2">Option 2 — TXT Verification Record</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Type</p><p className="font-mono font-bold text-gray-800 mt-0.5">TXT</p></div>
                        <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Name</p><p className="font-mono font-bold text-gray-800 mt-0.5">@</p></div>
                        <div className="bg-gray-50 rounded-lg p-2 col-span-3">
                          <p className="text-gray-400">Value</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-mono font-bold text-gray-800 text-[10px] truncate flex-1">{token}</p>
                            <button onClick={() => copyToClipboard(token)} className="text-indigo-500 hover:text-indigo-700 flex-shrink-0"><Copy size={12}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-amber-700 mt-3">⏱ DNS changes can take 24–48 hours to propagate globally.</p>
                </div>

                <Button onClick={verifyDomain} loading={verifying} variant="secondary" className="w-full justify-center">
                  <RefreshCw size={14} /> Check DNS Verification
                </Button>
              </div>
            )}

            {myStore?.customDomain && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Current: <span className="text-indigo-600">{myStore.customDomain}</span></p>
                  <p className="text-xs text-gray-400">{verified ? '✅ Verified & Active' : '⏳ Pending DNS verification'}</p>
                </div>
                <button onClick={removeDomain} className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            )}
          </div>

          {/* Steps guide */}
          <div className="card">
            <h4 className="font-semibold text-gray-800 mb-4">How to connect your domain</h4>
            <div className="space-y-4">
              {[
                { n: '1', title: 'Enter your domain', desc: 'Type your domain name above (e.g. shop.yourbrand.com) and click Set Domain.' },
                { n: '2', title: 'Add DNS record', desc: 'Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add the CNAME or TXT record shown above.' },
                { n: '3', title: 'Wait for propagation', desc: 'DNS changes usually take 1–4 hours, but can take up to 48 hours globally.' },
                { n: '4', title: 'Verify ownership', desc: 'Come back and click "Check DNS Verification". Once verified, your domain will go live immediately.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">{n}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
