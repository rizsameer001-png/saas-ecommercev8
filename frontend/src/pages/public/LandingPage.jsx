import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { ArrowRight, Store, ShoppingCart, BarChart3, CreditCard, Package, Shield, Zap, Globe, Star, TrendingUp, CheckCircle, Sparkles, Flame, ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES=[
  { headline:'Launch Your Store in Minutes', sub:'Everything you need to sell online — beautiful storefronts, powerful analytics, and seamless payments.', cta:'Start Selling Free', ctaLink:'/register', badge:'✨ Now with CSV import/export', gradient:'from-indigo-900 via-indigo-800 to-purple-900', accent:'#818cf8', image:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80' },
  { headline:'Accept Payments Globally', sub:'Integrated with Stripe, Razorpay, and PayPal. One setup, every gateway. Let customers pay their way.', cta:'Explore Payments', ctaLink:'/register', badge:'💳 Stripe · Razorpay · PayPal · COD', gradient:'from-emerald-900 via-teal-800 to-cyan-900', accent:'#34d399', image:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80' },
  { headline:'Built for Growth', sub:'Advanced analytics, smart inventory, mega-menu navigation, custom domains, and automated alerts — all out of the box.', cta:'See All Features', ctaLink:'/register', badge:'📊 Real-time analytics & custom domains', gradient:'from-violet-900 via-purple-800 to-fuchsia-900', accent:'#c084fc', image:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80' },
]

function HeroCarousel(){
  const[idx,setIdx]=useState(0)
  const[fade,setFade]=useState(true)
  const go=(n)=>{ setFade(false); setTimeout(()=>{ setIdx(n); setFade(true) },300) }
  useEffect(()=>{ const t=setTimeout(()=>go((idx+1)%SLIDES.length),6000); return()=>clearTimeout(t) },[idx])
  const s=SLIDES[idx]
  return(
    <section className={`relative overflow-hidden bg-gradient-to-br ${s.gradient} min-h-[580px] flex items-center`}>
      <div className="absolute inset-0"><img src={s.image} alt="" className="w-full h-full object-cover opacity-10"/><div className={`absolute inset-0 bg-gradient-to-r ${s.gradient} opacity-90`}/></div>
      <div className="absolute inset-0 opacity-10" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-15 blur-3xl`} style={{background:s.accent}}/>
      <div className="relative max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className={`transition-all duration-500 ${fade?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-semibold mb-5 backdrop-blur-sm">{s.badge}</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">{s.headline}</h1>
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-lg">{s.sub}</p>
          <div className="flex flex-wrap gap-4">
            <Link to={s.ctaLink} className="inline-flex items-center gap-2 bg-white font-bold text-gray-900 px-7 py-4 rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-sm">{s.cta} <ArrowRight size={15}/></Link>
            <Link to="/marketplace" className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/20 transition-all text-sm">View Marketplace</Link>
          </div>
        </div>
        <div className={`hidden lg:block transition-all duration-500 ${fade?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
            <img src={s.image} alt="" className="w-full h-52 object-cover rounded-2xl mb-4"/>
            <div className="grid grid-cols-3 gap-3">
              {[['10K+','Stores'],['2M+','Products'],['$50M+','GMV']].map(([v,l])=>(
                <div key={l} className="bg-white/10 rounded-xl p-3 text-center"><p className="font-display font-bold text-white text-lg">{v}</p><p className="text-white/60 text-xs">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button onClick={()=>go((idx-1+SLIDES.length)%SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><ChevronLeft size={18}/></button>
      <button onClick={()=>go((idx+1)%SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><ChevronRight size={18}/></button>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_,i)=><button key={i} onClick={()=>go(i)} className={`rounded-full transition-all ${i===idx?'bg-white w-6 h-2':'bg-white/40 w-2 h-2'}`}/>)}
      </div>
    </section>
  )
}

const FEATURES=[
  {icon:Zap,bg:'bg-amber-50 text-amber-600',title:'Instant Setup',desc:'Launch your store in under 5 minutes. Beautiful storefronts, no code needed.'},
  {icon:CreditCard,bg:'bg-blue-50 text-blue-600',title:'Multi-Gateway Payments',desc:'Configure Stripe, Razorpay, PayPal, Bank Transfer — from a single settings page.'},
  {icon:BarChart3,bg:'bg-indigo-50 text-indigo-600',title:'Smart Analytics',desc:'Revenue charts, order tracking, customer insights in real-time.'},
  {icon:Package,bg:'bg-emerald-50 text-emerald-600',title:'CSV Import/Export',desc:'Bulk upload thousands of products via CSV. Export any time.'},
  {icon:Globe,bg:'bg-violet-50 text-violet-600',title:'Custom Domains',desc:'Connect your own domain with TXT-record DNS verification.'},
  {icon:Shield,bg:'bg-red-50 text-red-600',title:'Secure & Reliable',desc:'JWT auth, bcrypt, tenant isolation — enterprise security out of the box.'},
]

const PLANS=[
  {name:'Free',price:0,col:'gray',features:['10 Products','100 Orders/mo','1 GB Storage','Community Support']},
  {name:'Basic',price:29,col:'blue',features:['100 Products','1,000 Orders/mo','5 GB Storage','Analytics','Email Support']},
  {name:'Pro',price:79,col:'indigo',popular:true,features:['1,000 Products','10,000 Orders/mo','Custom Domain','API Access','Priority Support','Advanced SEO']},
  {name:'Enterprise',price:199,col:'amber',features:['Unlimited Everything','White-Label','100 GB Storage','Dedicated Manager']},
]
const PLG={gray:'from-gray-500 to-gray-600',blue:'from-blue-500 to-blue-600',indigo:'from-indigo-500 to-purple-600',amber:'from-amber-500 to-orange-500'}

export default function LandingPage(){
  const[billing,setBilling]=useState('monthly')
  const[stores,setStores]=useState([])
  useEffect(()=>{ api.get('/stores?limit=6').then(r=>setStores(r.data.data||[])).catch(()=>{}) },[])

  return(
    <div>
      <HeroCarousel/>
      {/* Stats */}
      <div className="bg-gray-900 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-5">
          {[['10K+','Stores',Store],['2M+','Products',Package],['5M+','Orders',ShoppingCart],['$50M+','GMV',TrendingUp],['120+','Countries',Globe]].map(([v,l,Icon])=>(
            <div key={l} className="flex items-center gap-2.5"><Icon size={15} className="text-indigo-400 flex-shrink-0"/><div><p className="font-bold text-white text-sm">{v}</p><p className="text-[11px] text-gray-500">{l}</p></div></div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-20"><div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-2">Why SaaSStore?</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">Everything you need, nothing you don't</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Built for modern eCommerce — fast, flexible, and production-ready from day one.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({icon:Icon,bg,title,desc})=>(
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-card transition-all group">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><Icon size={20}/></div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div></section>

      {/* Featured stores */}
      {stores.length>0&&(
        <section className="py-16 bg-gray-50"><div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Featured Stores</h2>
            <p className="text-gray-500">Join thousands of vendors already selling on SaaSStore</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stores.map(s=>(
              <Link key={s._id} to={`/store/${s.slug}`} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-card transition-all group text-center">
                {s.logo?<img src={s.logo} alt={s.name} className="w-12 h-12 rounded-xl object-cover mx-auto mb-3 group-hover:scale-105 transition-transform"/>
                  :<div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 group-hover:scale-105 transition-transform" style={{background:s.branding?.primaryColor||'#6366f1'}}>{s.name?.[0]}</div>}
                <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                <p className="text-[10px] text-gray-400 capitalize mt-0.5">{s.plan}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8"><Link to="/stores" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 justify-center">View all stores <ArrowRight size={13}/></Link></div>
        </div></section>
      )}

      {/* Pricing */}
      <section className="py-20"><div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-500 mb-6">Start free. Upgrade when you're ready to grow.</p>
          <div className="inline-flex bg-gray-100 rounded-2xl p-1.5">
            {['monthly','yearly'].map(b=>(
              <button key={b} onClick={()=>setBilling(b)} className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${billing===b?'bg-white text-indigo-600 shadow-sm':'text-gray-500'}`}>
                {b} {b==='yearly'&&<span className="text-[10px] text-green-600 ml-1">SAVE 17%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map(p=>{
            const price=billing==='yearly'?Math.round(p.price*0.83):p.price
            return(
              <div key={p.name} className={`relative bg-white rounded-3xl border-2 overflow-hidden transition-all hover:shadow-card-hover ${p.popular?'border-indigo-400 shadow-glow':'border-gray-100'}`}>
                {p.popular&&<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"/>}
                {p.popular&&<div className="absolute top-4 right-4"><span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</span></div>}
                <div className={`p-6 bg-gradient-to-br ${PLG[p.col]}`}>
                  <p className="font-display font-bold text-white text-lg">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1"><span className="font-display font-bold text-white text-4xl">${price}</span><span className="text-white/70 text-sm">/mo</span></div>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-6">
                    {p.features.map(f=>(
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle size={13} className="text-green-500 flex-shrink-0"/>{f}</li>
                    ))}
                  </ul>
                  <Link to="/register" className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 ${p.popular?'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm':'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                    {p.name==='Free'?'Get Started Free':'Start Free Trial'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div></section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Sparkles size={32} className="text-indigo-300 mx-auto mb-4"/>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Ready to start selling?</h2>
          <p className="text-indigo-200 text-lg mb-8">Join 10,000+ vendors who trust SaaSStore to power their business.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 shadow-xl text-sm">Create Free Store <ArrowRight size={15}/></Link>
            <Link to="/marketplace" className="inline-flex items-center gap-2 border border-white/30 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 text-sm">Browse Marketplace</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
