require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')
const Store    = require('../models/Store')
const Product  = require('../models/Product')
const Category = require('../models/Category')
const Order    = require('../models/Order')
const Subscription = require('../models/Subscription')
const { Coupon } = require('../models/index')

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_ecommerce'

const seed = async () => {
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB')

  // Clean
  await Promise.all([
    User.deleteMany(), Store.deleteMany(), Product.deleteMany(),
    Category.deleteMany(), Order.deleteMany(), Coupon.deleteMany(), Subscription.deleteMany()
  ])
  console.log('🗑️  Cleared existing data')

  // ── Super Admin ────────────────────────────────────────────────────────────
  const admin = await User.create({ name:'Super Admin', email:'admin@demo.com', password:'password123', role:'super_admin', isActive:true, isEmailVerified:true })
  console.log('👤 Admin:', admin.email)

  // ── Vendor + Store ─────────────────────────────────────────────────────────
  const vendor = await User.create({ name:'TechGear Store', email:'vendor@demo.com', password:'password123', role:'vendor', isActive:true, isEmailVerified:true })

  const store = await Store.create({
    name:'TechGear Pro', slug:'techgear-pro', owner:vendor._id,
    description:'Premium tech accessories and gadgets for the modern professional.',
    branding:{ primaryColor:'#6366f1', secondaryColor:'#8b5cf6', accentColor:'#f97316' },
    settings:{ currency:'USD', currencySymbol:'$', taxRate:8, freeShippingThreshold:50, allowGuestCheckout:true },
    status:'active', plan:'pro',
    limits:{ maxProducts:1000, maxOrders:10000, storageGB:20 },
  })

  vendor.store = store._id
  await vendor.save({ validateBeforeSave:false })

  // Vendor 2 (Fashion)
  const vendor2 = await User.create({ name:'Luxe Fashion', email:'vendor2@demo.com', password:'password123', role:'vendor', isActive:true, isEmailVerified:true })
  const store2 = await Store.create({
    name:'Luxe Fashion', slug:'luxe-fashion', owner:vendor2._id,
    description:'Curated fashion collections for every occasion.',
    branding:{ primaryColor:'#ec4899', secondaryColor:'#f43f5e', accentColor:'#f59e0b' },
    settings:{ currency:'USD', currencySymbol:'$', taxRate:5, allowGuestCheckout:true },
    status:'active', plan:'basic', limits:{ maxProducts:100, maxOrders:1000, storageGB:5 },
  })
  vendor2.store = store2._id
  await vendor2.save({ validateBeforeSave:false })

  // Customer
  const customer = await User.create({
    name:'John Customer', email:'customer@demo.com', password:'password123',
    role:'customer', isActive:true, isEmailVerified:true,
    addresses:[{ label:'Home', street:'123 Main St', city:'New York', state:'NY', country:'USA', postalCode:'10001', isDefault:true }]
  })

  console.log('🏪 Stores: techgear-pro, luxe-fashion')

  // ── Multilevel Categories (TechGear) ────────────────────────────────────────
  const electronics = await Category.create({ store:store._id, name:'Electronics', slug:'electronics', depth:0, path:['Electronics'], sortOrder:1 })
  const laptops     = await Category.create({ store:store._id, name:'Laptops', slug:'laptops', parent:electronics._id, depth:1, path:['Electronics','Laptops'], sortOrder:1 })
  const gaming      = await Category.create({ store:store._id, name:'Gaming Laptops', slug:'gaming-laptops', parent:laptops._id, depth:2, path:['Electronics','Laptops','Gaming Laptops'], sortOrder:1 })
  const ultrabooks  = await Category.create({ store:store._id, name:'Ultrabooks', slug:'ultrabooks', parent:laptops._id, depth:2, path:['Electronics','Laptops','Ultrabooks'], sortOrder:2 })
  const audio       = await Category.create({ store:store._id, name:'Audio', slug:'audio', parent:electronics._id, depth:1, path:['Electronics','Audio'], sortOrder:2 })
  const accessories = await Category.create({ store:store._id, name:'Accessories', slug:'accessories', parent:electronics._id, depth:1, path:['Electronics','Accessories'], sortOrder:3 })
  const phones      = await Category.create({ store:store._id, name:'Phones', slug:'phones', parent:electronics._id, depth:1, path:['Electronics','Phones'], sortOrder:4 })

  // Fashion categories
  const clothing   = await Category.create({ store:store2._id, name:'Clothing', slug:'clothing', depth:0, path:['Clothing'], sortOrder:1 })
  const tops       = await Category.create({ store:store2._id, name:'Tops', slug:'tops', parent:clothing._id, depth:1, path:['Clothing','Tops'], sortOrder:1 })
  const bottoms    = await Category.create({ store:store2._id, name:'Bottoms', slug:'bottoms', parent:clothing._id, depth:1, path:['Clothing','Bottoms'], sortOrder:2 })
  const fashionAcc = await Category.create({ store:store2._id, name:'Accessories', slug:'accessories', depth:0, path:['Accessories'], sortOrder:2 })

  console.log('📁 Categories created (3 levels deep)')

  // ── Products (TechGear) ────────────────────────────────────────────────────
  const BASE = 'https://images.unsplash.com'
  const products1 = await Product.insertMany([
    {
      store:store._id, name:'UltraBook Pro 15"', slug:'ultrabook-pro-15',
      description:'The ultimate productivity laptop with Intel Core i9, 32GB RAM, and 1TB NVMe SSD. Perfect for developers and creative professionals who demand the best.',
      shortDescription:'High-performance ultrabook for professionals',
      price:1299.99, comparePrice:1599.99, category:ultrabooks._id,
      images:[{ url:`${BASE}/photo-1496181133206-80ce9b88a853?w=600`, isPrimary:true }],
      videos:[{ type:'youtube', url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeId:'dQw4w9WgXcQ', thumbnail:'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', title:'UltraBook Pro Review' }],
      inventory:25, sku:'LT-001',
      labels:{ isFeatured:true, isNewArrival:false, isOnSale:true },
      attributes:{ storage:['512GB','1TB'], ram:['16GB','32GB'], custom:[{ key:'Display', value:'15.6" 4K OLED' },{ key:'Battery', value:'72Wh, 12hr' }] },
      status:'active', stats:{ views:450, sales:23, revenue:29900, rating:4.8, reviewCount:15 },
      newArrivalUntil: null,
    },
    {
      store:store._id, name:'Wireless Noise-Cancel Headphones', slug:'wireless-nc-headphones',
      description:'Studio-quality sound with 40-hour battery life and industry-leading active noise cancellation.',
      shortDescription:'Premium ANC headphones with 40hr battery',
      price:299.99, comparePrice:399.99, category:audio._id,
      images:[{ url:`${BASE}/photo-1505740420928-5e560c06d30e?w=600`, isPrimary:true }],
      inventory:60, sku:'AU-001',
      labels:{ isFeatured:true, isNewArrival:true, isOnSale:true },
      attributes:{ color:['Black','White','Navy'], custom:[{ key:'Driver Size', value:'40mm' },{ key:'Impedance', value:'32Ω' }] },
      status:'active', stats:{ views:820, sales:58, revenue:17399, rating:4.9, reviewCount:42 },
      newArrivalUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      store:store._id, name:'Mechanical Keyboard RGB', slug:'mechanical-keyboard-rgb',
      description:'Tactile Cherry MX Blue switches with per-key RGB lighting and aircraft-grade aluminium body.',
      shortDescription:'RGB mechanical keyboard with Cherry MX switches',
      price:149.99, comparePrice:199.99, category:accessories._id,
      images:[{ url:`${BASE}/photo-1541140532154-b024d705b90a?w=600`, isPrimary:true }],
      inventory:45, sku:'KB-001',
      labels:{ isFeatured:false, isNewArrival:true, isOnSale:true },
      attributes:{ color:['Black','White','Gray'], custom:[{ key:'Switch Type', value:'Cherry MX Blue' },{ key:'Layout', value:'TKL (80%)' }] },
      status:'active', stats:{ views:312, sales:34, revenue:5099, rating:4.7, reviewCount:28 },
      newArrivalUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      store:store._id, name:'4K Webcam Pro', slug:'4k-webcam-pro',
      description:'Crystal clear 4K video conferencing with built-in ring light and AI noise-canceling microphone.',
      shortDescription:'4K webcam with built-in ring light',
      price:189.99, category:accessories._id,
      images:[{ url:`${BASE}/photo-1587620962725-abab7fe55159?w=600`, isPrimary:true }],
      inventory:30, sku:'CAM-001',
      labels:{ isFeatured:false, isNewArrival:true, isOnSale:false },
      attributes:{ custom:[{ key:'Resolution', value:'4K 30fps / 1080p 60fps' },{ key:'FOV', value:'90°' }] },
      status:'active', stats:{ views:185, sales:12, revenue:2280, rating:4.5, reviewCount:9 },
      newArrivalUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      store:store._id, name:'USB-C Hub 12-in-1', slug:'usb-c-hub-12in1',
      description:'Expand your laptop with HDMI 4K@60Hz, 3× USB-A 3.0, SD/microSD, and 100W PD charging.',
      shortDescription:'Ultimate USB-C hub for laptop expansion',
      price:79.99, comparePrice:99.99, category:accessories._id,
      images:[{ url:`${BASE}/photo-1558618666-fcd25c85cd64?w=600`, isPrimary:true }],
      inventory:80, sku:'HUB-001',
      labels:{ isFeatured:false, isNewArrival:false, isOnSale:true },
      attributes:{ custom:[{ key:'Ports', value:'12-in-1' },{ key:'PD Charging', value:'100W' }] },
      status:'active', stats:{ views:290, sales:67, revenue:5359, rating:4.6, reviewCount:51 },
    },
  ])

  // Fashion products
  await Product.insertMany([
    {
      store:store2._id, name:'Classic White Tee', slug:'classic-white-tee',
      description:'Premium 100% organic cotton t-shirt. Minimal, versatile, and sustainably produced.',
      shortDescription:'Organic cotton classic fit t-shirt',
      price:39.99, comparePrice:59.99, category:tops._id,
      images:[{ url:`${BASE}/photo-1521572163474-6864f9cf17ab?w=600`, isPrimary:true }],
      inventory:75, sku:'TEE-001', hasVariants:true,
      variantAttributes:[{ name:'Size', values:['XS','S','M','L','XL','XXL'] },{ name:'Color', values:['White','Black','Gray'] }],
      variants:[
        { name:'White / S', options:[{ attribute:'Size', value:'S' },{ attribute:'Color', value:'White' }], price:39.99, inventory:20, sku:'TEE-W-S' },
        { name:'White / M', options:[{ attribute:'Size', value:'M' },{ attribute:'Color', value:'White' }], price:39.99, inventory:30, sku:'TEE-W-M' },
        { name:'Black / M', options:[{ attribute:'Size', value:'M' },{ attribute:'Color', value:'Black' }], price:39.99, inventory:25, sku:'TEE-B-M' },
      ],
      labels:{ isFeatured:true, isNewArrival:true, isOnSale:true },
      attributes:{ size:['XS','S','M','L','XL','XXL'], color:['White','Black','Gray'], material:['Cotton'] },
      status:'active', stats:{ views:340, sales:89, revenue:3559, rating:4.7, reviewCount:63 },
      newArrivalUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      store:store2._id, name:'Slim Fit Chinos', slug:'slim-fit-chinos',
      description:'Modern slim-fit chinos in stretch cotton blend. Smart casual perfection.',
      shortDescription:'Stretch cotton slim chinos',
      price:89.99, comparePrice:119.99, category:bottoms._id,
      images:[{ url:`${BASE}/photo-1473966968600-fa801b869a1a?w=600`, isPrimary:true }],
      inventory:40, sku:'CHI-001',
      labels:{ isFeatured:false, isNewArrival:false, isOnSale:true },
      attributes:{ size:['S','M','L','XL','XXL'], color:['Beige','Navy','Olive','Gray'], material:['Cotton','Polyester'] },
      status:'active', stats:{ views:210, sales:34, revenue:3060, rating:4.5, reviewCount:22 },
    },
  ])

  // Update product counts on categories
  const catUpdates = [ultrabooks._id, laptops._id, audio._id, accessories._id, phones._id, tops._id, bottoms._id]
  for (const catId of catUpdates) {
    const count = await Product.countDocuments({ category:catId, status:'active' })
    await Category.findByIdAndUpdate(catId, { productCount:count })
  }

  // ── Coupons ────────────────────────────────────────────────────────────────
  await Coupon.insertMany([
    { store:store._id, code:'WELCOME10', type:'percentage', value:10, description:'Welcome discount', isActive:true },
    { store:store._id, code:'SAVE20', type:'fixed', value:20, minOrderAmount:100, description:'$20 off $100+', isActive:true },
    { store:store2._id, code:'FASHION15', type:'percentage', value:15, maxDiscount:30, description:'15% off fashion', isActive:true },
  ])

  // ── Subscriptions ──────────────────────────────────────────────────────────
  const features1 = Subscription.getPlanFeatures('pro')
  await Subscription.create({
    store:store._id, vendor:vendor._id, plan:'pro', status:'active', billingCycle:'monthly',
    amount:79, gateway:'manual', features:features1,
    currentPeriodStart:new Date(),
    currentPeriodEnd:new Date(Date.now() + 30*24*60*60*1000),
  })
  const features2 = Subscription.getPlanFeatures('basic')
  await Subscription.create({
    store:store2._id, vendor:vendor2._id, plan:'basic', status:'active', billingCycle:'monthly',
    amount:29, gateway:'manual', features:features2,
    currentPeriodStart:new Date(),
    currentPeriodEnd:new Date(Date.now() + 30*24*60*60*1000),
  })

  // Update store stats
  await Store.findByIdAndUpdate(store._id, { 'stats.totalProducts':5 })
  await Store.findByIdAndUpdate(store2._id, { 'stats.totalProducts':2 })

  console.log('✅ Seed complete!\n')
  console.log('─────────────────────────────────────────────')
  console.log('Demo Accounts:')
  console.log('  Super Admin:  admin@demo.com / password123')
  console.log('  Vendor 1:     vendor@demo.com / password123  →  /store/techgear-pro')
  console.log('  Vendor 2:     vendor2@demo.com / password123 →  /store/luxe-fashion')
  console.log('  Customer:     customer@demo.com / password123')
  console.log('\nCategories (TechGear):')
  console.log('  Electronics → Laptops → Ultrabooks')
  console.log('  Electronics → Laptops → Gaming Laptops')
  console.log('  Electronics → Audio')
  console.log('  Electronics → Accessories')
  console.log('\nCoupon Codes:')
  console.log('  TechGear: WELCOME10, SAVE20')
  console.log('  Luxe:     FASHION15')
  console.log('─────────────────────────────────────────────')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
