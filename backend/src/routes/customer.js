const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { Wishlist, Notification, RefundRequest } = require('../models/index');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
router.get('/wishlist', protect, async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate({ path: 'product', select: 'name images price comparePrice labels slug store status', populate: { path: 'store', select: 'name slug branding settings' } })
      .sort({ addedAt: -1 });
    // Filter out deleted/archived products
    const valid = items.filter(i => i.product && i.product.status !== 'archived');
    res.json({ success: true, data: valid, count: valid.length });
  } catch (err) { next(err); }
});

router.post('/wishlist', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const exists = await Wishlist.findOne({ user: req.user._id, product: productId });
    if (exists) {
      await Wishlist.deleteOne({ _id: exists._id });
      return res.json({ success: true, action: 'removed', message: 'Removed from wishlist' });
    }
    await Wishlist.create({ user: req.user._id, product: productId, store: product.store });
    res.json({ success: true, action: 'added', message: 'Added to wishlist' });
  } catch (err) { next(err); }
});

router.delete('/wishlist/:productId', protect, async (req, res, next) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id, product: req.params.productId });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) { next(err); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.get('/notifications', protect, async (req, res, next) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    const unread = notifs.filter(n => !n.isRead).length;
    res.json({ success: true, data: notifs, unreadCount: unread });
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/notifications/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { next(err); }
});

// ─── REFUND REQUESTS ──────────────────────────────────────────────────────────
router.get('/refunds', protect, async (req, res, next) => {
  try {
    const refunds = await RefundRequest.find({ user: req.user._id })
      .populate('order', 'orderNumber pricing createdAt')
      .populate('store', 'name slug logo')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: refunds });
  } catch (err) { next(err); }
});

router.post('/refunds', protect, async (req, res, next) => {
  try {
    const { orderId, reason, items, amount, evidence } = req.body;
    const order = await Order.findOne({ _id: orderId, customer: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['delivered', 'shipped', 'out_for_delivery'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Can only request refund for delivered or shipped orders' });
    }
    const existing = await RefundRequest.findOne({ order: orderId, user: req.user._id, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ success: false, message: 'A refund request already exists for this order' });

    const refund = await RefundRequest.create({
      order: orderId, user: req.user._id, store: order.store,
      reason, items, amount: amount || order.pricing.total, evidence,
    });
    await refund.populate('order', 'orderNumber pricing');
    res.status(201).json({ success: true, data: refund, message: 'Refund request submitted' });
  } catch (err) { next(err); }
});

// ─── MY REVIEWS ───────────────────────────────────────────────────────────────
router.get('/reviews', protect, async (req, res, next) => {
  try {
    const Review = require('mongoose').model('Review');
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images slug store')
      .populate('store', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});

// ─── PROFILE UPDATE ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true }).populate('store');
    res.json({ success: true, data: user.toSafeObject(), message: 'Profile updated' });
  } catch (err) { next(err); }
});

module.exports = router;
