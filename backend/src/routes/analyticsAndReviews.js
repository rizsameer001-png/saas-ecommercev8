// routes/analytics.js
const analyticsRouter = require('express').Router();
const analyticsCtrl = require('../controllers/analyticsController');
const { protect, authorize, resolveStore } = require('../middleware/auth');

analyticsRouter.get('/vendor', protect, authorize('vendor', 'super_admin'), analyticsCtrl.getVendorAnalytics);
analyticsRouter.get('/platform', protect, authorize('super_admin'), analyticsCtrl.getPlatformAnalytics);

module.exports = analyticsRouter;

// ─── routes/reviews.js ────────────────────────────────────────────────────────
const { Review } = require('../models/index');
const reviewRouter = require('express').Router();
const { protect: prot, optionalAuth, resolveStore: rs } = require('../middleware/auth');

// Get product reviews
reviewRouter.get('/product/:productId', rs, async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    
    const stats = {
      average: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      count: reviews.length,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
    reviews.forEach(r => { stats.distribution[r.rating]++; });
    
    res.json({ success: true, data: reviews, stats });
  } catch (err) { next(err); }
});

// Create review
reviewRouter.post('/', rs, prot, async (req, res, next) => {
  try {
    const existing = await Review.findOne({ product: req.body.productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

    const review = await Review.create({ ...req.body, product: req.body.productId, user: req.user._id, store: req.store._id });
    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// Update review
reviewRouter.put('/:id', rs, prot, async (req, res, next) => {
  try {
    const review = await Review.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

// Vendor reply to review
reviewRouter.post('/:id/reply', rs, prot, async (req, res, next) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, store: req.store._id },
      { vendorReply: { message: req.body.message, repliedAt: new Date() } },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

module.exports = { analyticsRouter, reviewRouter };
