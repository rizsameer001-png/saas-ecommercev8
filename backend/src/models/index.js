const { Category } = require('./Category');
const mongoose = require('mongoose');
const slugify = require('slugify');

// ─── Cart Model ────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: mongoose.Schema.Types.ObjectId,
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: Number,    // Locked price at time of adding
  name: String,
  image: String,
  variantInfo: String
});

const cartSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,  // For guest carts
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
  }
}, { timestamps: true, toJSON: { virtuals: true } });

cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.index({ user: 1, store: 1 });
cartSchema.index({ sessionId: 1, store: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.model('Cart', cartSchema);

// ─── Coupon Model ─────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscount: Number,  // Cap for percentage discounts
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  usageLimitPerUser: { type: Number, default: 1 },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  startsAt: { type: Date, default: Date.now },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  description: String,
  usedBy: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

couponSchema.index({ store: 1, code: 1 }, { unique: true });
couponSchema.index({ store: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

// ─── Review Model ─────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 200 },
  body: { type: String, maxlength: 2000 },
  images: [String],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
  vendorReply: {
    message: String,
    repliedAt: Date
  }
}, { timestamps: true });

reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ store: 1, rating: -1 });

// Update product rating after review
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      'stats.rating': Math.round(stats[0].avgRating * 10) / 10,
      'stats.reviewCount': stats[0].count
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Category, Cart, Coupon, Review };

// ─── Wishlist Model ────────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store:   { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now },
}, { timestamps: false });
wishlistSchema.index({ user: 1, product: 1, store: 1 }, { unique: true });
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// ─── RefundRequest Model ───────────────────────────────────────────────────────
const refundSchema = new mongoose.Schema({
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  store:    { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  reason:   { type: String, required: true, maxlength: 1000 },
  items:    [{ orderItemId: mongoose.Schema.Types.ObjectId, quantity: Number }],
  amount:   Number,
  evidence: [String],   // image URLs
  status:   { type: String, enum: ['pending','approved','rejected','refunded'], default: 'pending' },
  vendorNote: String,
  resolvedAt: Date,
}, { timestamps: true });
refundSchema.index({ user: 1, status: 1 });
refundSchema.index({ store: 1, status: 1 });
const RefundRequest = mongoose.model('RefundRequest', refundSchema);

// ─── Notification Model ────────────────────────────────────────────────────────
const notifSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['order_update','payment','promotion','system','refund'], default: 'system' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    String,
  isRead:  { type: Boolean, default: false },
  icon:    String,
}, { timestamps: true });
notifSchema.index({ user: 1, isRead: 1 });
notifSchema.index({ user: 1, createdAt: -1 });
const Notification = mongoose.model('Notification', notifSchema);

module.exports = { Category: require('./Category'), Cart, Coupon, Review, Wishlist, RefundRequest, Notification };
