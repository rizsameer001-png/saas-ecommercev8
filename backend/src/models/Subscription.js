const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Plan details
  plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'cancelled', 'expired', 'paused'],
    default: 'trialing'
  },

  // Billing cycle
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: { type: Number, default: 0 }, // price paid
  currency: { type: String, default: 'USD' },

  // Dates
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date,

  // Grace period: 3-day window after expiry before storefront is locked
  gracePeriodDays: { type: Number, default: 3 },
  gracePeriodEnds: Date,   // set when status changes to 'expired'

  cancelReason: String,

  // Gateway references (one gateway active at a time)
  gateway: { type: String, enum: ['stripe', 'razorpay', 'paypal', 'manual'], default: 'manual' },

  // Stripe
  stripe: {
    customerId: String,
    subscriptionId: String,
    priceId: String,
    paymentMethodId: String,
    invoiceId: String,
    latestInvoiceStatus: String,
  },

  // Razorpay
  razorpay: {
    subscriptionId: String,
    planId: String,
    customerId: String,
    paymentId: String,
  },

  // PayPal
  paypal: {
    subscriptionId: String,
    planId: String,
    orderId: String,
    payerId: String,
  },

  // Feature access flags (derived from plan, but can be overridden by admin)
  features: {
    maxProducts:    { type: Number, default: 10 },
    maxOrders:      { type: Number, default: 100 },
    storageGB:      { type: Number, default: 1 },
    customDomain:   { type: Boolean, default: false },
    analytics:      { type: Boolean, default: false },
    prioritySupport:{ type: Boolean, default: false },
    apiAccess:      { type: Boolean, default: false },
    whiteLabelStore:{ type: Boolean, default: false },
    multiStaff:     { type: Boolean, default: false },
    advancedSeo:    { type: Boolean, default: false },
  },

  // Notification tracking
  notifications: {
    expiryWarning7Sent: { type: Boolean, default: false },
    expiryWarning3Sent: { type: Boolean, default: false },
    expiryWarning1Sent: { type: Boolean, default: false },
    expiredSent:        { type: Boolean, default: false },
  },

  // Payment history
  invoices: [{
    invoiceId:   String,
    amount:      Number,
    currency:    String,
    status:      { type: String, enum: ['paid', 'pending', 'failed', 'refunded'] },
    gateway:     String,
    paidAt:      Date,
    periodStart: Date,
    periodEnd:   Date,
    pdf:         String,
  }],

  metadata: { type: Map, of: String },
}, { timestamps: true });

// ─── Static: get plan feature limits ────────────────────────────────────────
subscriptionSchema.statics.getPlanFeatures = function(plan, billingCycle = 'monthly') {
  const plans = {
    free:       { maxProducts: 10,   maxOrders: 100,    storageGB: 1,   customDomain: false, analytics: false, prioritySupport: false, apiAccess: false, whiteLabelStore: false, multiStaff: false, advancedSeo: false },
    basic:      { maxProducts: 100,  maxOrders: 1000,   storageGB: 5,   customDomain: false, analytics: true,  prioritySupport: false, apiAccess: false, whiteLabelStore: false, multiStaff: false, advancedSeo: false },
    pro:        { maxProducts: 1000, maxOrders: 10000,  storageGB: 20,  customDomain: true,  analytics: true,  prioritySupport: true,  apiAccess: true,  whiteLabelStore: false, multiStaff: true,  advancedSeo: true  },
    enterprise: { maxProducts: -1,   maxOrders: -1,     storageGB: 100, customDomain: true,  analytics: true,  prioritySupport: true,  apiAccess: true,  whiteLabelStore: true,  multiStaff: true,  advancedSeo: true  },
  };
  return plans[plan] || plans.free;
};

subscriptionSchema.statics.getPlanPrice = function(plan, billingCycle = 'monthly') {
  const prices = {
    free:       { monthly: 0,   yearly: 0 },
    basic:      { monthly: 29,  yearly: 290 },
    pro:        { monthly: 79,  yearly: 790 },
    enterprise: { monthly: 199, yearly: 1990 },
  };
  return prices[plan]?.[billingCycle] || 0;
};

// ─── Virtual: days until expiry ─────────────────────────────────────────────
subscriptionSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.currentPeriodEnd) return null;
  return Math.ceil((new Date(this.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));
});

subscriptionSchema.virtual('isActive').get(function() {
  if (['active', 'trialing'].includes(this.status)) {
    return !this.currentPeriodEnd || new Date(this.currentPeriodEnd) > new Date();
  }
  return false;
});

// In grace period = expired but storefront still accessible
subscriptionSchema.virtual('isInGracePeriod').get(function() {
  if (this.status !== 'expired') return false;
  if (!this.gracePeriodEnds) return false;
  return new Date(this.gracePeriodEnds) > new Date();
});

subscriptionSchema.virtual('storefrontAccessible').get(function() {
  return this.isActive || this.isInGracePeriod || this.plan === 'free';
});

subscriptionSchema.index({ store: 1 }, { unique: true });
subscriptionSchema.index({ vendor: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
