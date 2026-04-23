const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  // Internal identifier
  key:   { type: String, required: true, unique: true, lowercase: true, trim: true }, // 'free','basic','pro','enterprise' or custom
  name:  { type: String, required: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },   // show on pricing page
  sortOrder: { type: Number, default: 0 },
  badge: String,    // e.g. "Most Popular"
  badgeColor: String,

  // Pricing
  pricing: {
    monthly: { type: Number, default: 0, min: 0 },
    yearly:  { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    trialDays: { type: Number, default: 0 },
  },

  // Gateway price IDs
  gatewayIds: {
    stripe:   { monthly: String, yearly: String },
    razorpay: { monthly: String, yearly: String },
    paypal:   { monthly: String, yearly: String },
  },

  // Feature limits
  features: {
    maxProducts:     { type: Number, default: 10   },   // -1 = unlimited
    maxOrders:       { type: Number, default: 100  },
    storageGB:       { type: Number, default: 1    },
    customDomain:    { type: Boolean, default: false },
    analytics:       { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    apiAccess:       { type: Boolean, default: false },
    whiteLabelStore: { type: Boolean, default: false },
    multiStaff:      { type: Boolean, default: false },
    advancedSeo:     { type: Boolean, default: false },
    csvImportExport: { type: Boolean, default: false },
    banners:         { type: Boolean, default: true  },
  },

  // Display feature list for pricing page
  featureList: [{ text: String, included: { type: Boolean, default: true } }],

  // UI theming
  theme: {
    gradient: { type: String, default: 'from-gray-500 to-gray-600' },
    accentColor: String,
  },
}, { timestamps: true, toJSON: { virtuals: true } });

// planSchema.index({ key: 1 }, { unique: true });
planSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', planSchema);
