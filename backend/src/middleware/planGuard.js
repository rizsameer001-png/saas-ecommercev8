const Subscription = require('../models/Subscription');
const Store = require('../models/Store');

// Guard: check if vendor's subscription is active
exports.requireActiveSubscription = async (req, res, next) => {
  try {
    if (req.user?.role === 'super_admin') return next();

    const store = req.store || await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const sub = await Subscription.findOne({ store: store._id });

    // Free plan always gets through (just with limits)
    if (!sub || sub.plan === 'free') return next();

    if (!sub.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
        renewUrl: '/dashboard/billing',
      });
    }

    if (sub.status === 'past_due') {
      return res.status(403).json({
        success: false,
        message: 'Payment failed. Please update your payment method.',
        code: 'PAYMENT_FAILED',
      });
    }

    req.subscription = sub;
    next();
  } catch (err) { next(err); }
};

// Guard: check specific feature access
exports.requireFeature = (feature) => async (req, res, next) => {
  try {
    if (req.user?.role === 'super_admin') return next();

    const store = req.store || await Store.findOne({ owner: req.user._id });
    const sub = await Subscription.findOne({ store: store?._id });

    if (!sub || !sub.features?.[feature]) {
      return res.status(403).json({
        success: false,
        message: `The "${feature}" feature requires a higher plan. Upgrade to access it.`,
        code: 'FEATURE_LOCKED',
        feature,
      });
    }

    next();
  } catch (err) { next(err); }
};

// Guard: check product count against plan limit
exports.checkProductLimit = async (req, res, next) => {
  try {
    if (req.user?.role === 'super_admin') return next();

    const store = req.store || await Store.findOne({ owner: req.user._id });
    const sub = await Subscription.findOne({ store: store?._id });
    const limit = sub?.features?.maxProducts ?? store?.limits?.maxProducts ?? 10;

    if (limit === -1) return next(); // unlimited

    const Product = require('../models/Product');
    const count = await Product.countDocuments({ store: store._id, status: { $ne: 'archived' } });

    if (count >= limit) {
      return res.status(403).json({
        success: false,
        message: `Product limit reached (${limit}/${limit}). Upgrade your plan to add more.`,
        code: 'PRODUCT_LIMIT_REACHED',
        current: count, limit,
      });
    }

    next();
  } catch (err) { next(err); }
};
