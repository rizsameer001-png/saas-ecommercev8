const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sku: String,
  variantInfo: String,  // e.g. "Red / XL"
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // null for guest orders
  },
  // Guest info (for guest checkout)
  guestInfo: {
    name: String,
    email: String,
    phone: String
  },
  items: [orderItemSchema],
  // Pricing breakdown
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  // Shipping
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  // Payment
  payment: {
    method: { type: String, enum: ['stripe', 'razorpay', 'cod', 'wallet'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    razorpayOrderId: String,
    paidAt: Date,
    refundedAmount: { type: Number, default: 0 },
    refundedAt: Date
  },
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  },
  // Tracking
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  // Timeline
  statusHistory: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: {
    customer: String,   // Note from customer
    vendor: String,     // Internal vendor note
    admin: String       // Internal admin note
  },
  isGift: { type: Boolean, default: false },
  giftMessage: String,
  cancelReason: String,
  cancelledAt: Date,
  source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Pre-save: Generate order number ─────────────────────────────────────────
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments({ store: this.store });
    const storePrefix = 'ORD';
    this.orderNumber = `${storePrefix}-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      message: 'Order placed',
      timestamp: new Date()
    });
  }
  next();
});

// ─── Virtual: Is order editable ───────────────────────────────────────────────
orderSchema.virtual('isEditable').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

orderSchema.virtual('isCancellable').get(function() {
  return !['delivered', 'cancelled', 'returned', 'refunded'].includes(this.status);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'guestInfo.email': 1 });

module.exports = mongoose.model('Order', orderSchema);
