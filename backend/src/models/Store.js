const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logo: String,
  banner: String,
  // Branding
  branding: {
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    accentColor: { type: String, default: '#f59e0b' },
    fontFamily: { type: String, default: 'Inter' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  // Contact
  contact: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  // Social media
  social: {
    instagram: String,
    twitter: String,
    facebook: String,
    youtube: String
  },
  // Settings
  settings: {
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    shippingEnabled: { type: Boolean, default: true },
    freeShippingThreshold: { type: Number, default: 0 },
    allowGuestCheckout: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: false },
    lowStockAlert: { type: Number, default: 10 }
  },
  // Payment methods enabled for this store
  // paymentMethods: {
  //   stripe: { enabled: Boolean, accountId: String },
  //   razorpay: { enabled: Boolean, keyId: String },
  //   cod: { enabled: Boolean, default: true }
  // },

  paymentMethods: {
  stripe: { enabled: { type: Boolean } , accountId: String },
  razorpay: { enabled: { type: Boolean }, keyId: String },
  cod: { 
    enabled: { type: Boolean, default: true } 
  }
},
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  isVerified: { type: Boolean, default: false },
  // Stats (cached)
  stats: {
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 }
  },
  // Subscription plan (inherited from owner)
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  // Limits based on plan
  limits: {
    maxProducts: { type: Number, default: 10 },
    maxOrders: { type: Number, default: 100 },
    storageGB: { type: Number, default: 1 }
  },

  // Extended payment gateway settings (per-store credentials)
  paymentSettings: {
    // Which gateways are enabled
    enabledGateways: { type: [String], default: ['cod'] },
    // Stripe
    stripe: {
      enabled:    { type: Boolean, default: false },
      publicKey:  String,   // pk_live_xxx or pk_test_xxx (stored encrypted in production)
      secretKey:  String,   // sk_live_xxx — only used server-side
      webhookSecret: String,
    },
    // Razorpay
    razorpay: {
      enabled:    { type: Boolean, default: false },
      keyId:      String,   // rzp_live_xxx
      keySecret:  String,
    },
    // PayPal
    paypal: {
      enabled:    { type: Boolean, default: false },
      clientId:   String,
      clientSecret: String,
      sandbox:    { type: Boolean, default: true },
    },
    // Cash on Delivery
    cod: {
      enabled: { type: Boolean, default: true },
      label:   { type: String, default: 'Cash on Delivery' },
      instructions: String,
    },
    // Bank Transfer
    bankTransfer: {
      enabled: { type: Boolean, default: false },
      bankName: String, accountName: String, accountNumber: String,
      routingNumber: String, instructions: String,
    },
  },

  // Custom domain config
  customDomain: String,
  domainVerified: { type: Boolean, default: false },
  domainVerificationToken: String,

  tags: [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Virtual: Store URL ────────────────────────────────────────────────────────
storeSchema.virtual('url').get(function() {
  if (this.customDomain) return `https://${this.customDomain}`;
  return `${process.env.FRONTEND_URL}/store/${this.slug}`;
});

// ─── Index ─────────────────────────────────────────────────────────────────────
// storeSchema.index({ slug: 1 });
storeSchema.index({ owner: 1 });
storeSchema.index({ status: 1 });
storeSchema.index({ 'stats.totalRevenue': -1 });

module.exports = mongoose.model('Store', storeSchema);
