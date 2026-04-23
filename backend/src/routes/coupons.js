// ─── routes/coupons.js ────────────────────────────────────────────────────────
const couponRouter = require('express').Router();
const { Coupon } = require('../models/index');
const { protect, authorize, resolveStore } = require('../middleware/auth');

couponRouter.get('/', protect, authorize('vendor', 'super_admin'), resolveStore, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ store: req.store._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

couponRouter.post('/', protect, authorize('vendor', 'super_admin'), resolveStore, async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, store: req.store._id, code: req.body.code?.toUpperCase() });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

couponRouter.put('/:id', protect, authorize('vendor', 'super_admin'), resolveStore, async (req, res, next) => {
  try {
    const coupon = await Coupon.findOneAndUpdate({ _id: req.params.id, store: req.store._id }, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

couponRouter.delete('/:id', protect, authorize('vendor', 'super_admin'), resolveStore, async (req, res, next) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id, store: req.store._id });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

couponRouter.post('/validate', resolveStore, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({
      store: req.store._id,
      code: code?.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderAmount} required` });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    }

    res.json({ success: true, data: coupon, discount });
  } catch (err) { next(err); }
});

module.exports = couponRouter;
