const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');

// ─── Verify JWT Token ─────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// ─── Optional Auth (doesn't fail if no token) ─────────────────────────────────
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (user?.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Silently fail - user remains unauthenticated
  }
  next();
};

// ─── Role-based Access ────────────────────────────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// ─── Store Context (resolves store from slug header or param) ─────────────────
exports.resolveStore = async (req, res, next) => {
  try {
    const storeSlug = req.headers['x-store-slug'] || req.params.storeSlug || req.query.store;
    
    if (!storeSlug) {
      return res.status(400).json({ success: false, message: 'Store slug required' });
    }

    const store = await Store.findOne({ slug: storeSlug, status: 'active' });
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found or inactive' });
    }

    req.store = store;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Verify Store Ownership ────────────────────────────────────────────────────
exports.isStoreOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    const storeId = req.params.storeId || req.store?._id || req.user.store;
    
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store context required' });
    }

    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this store' });
    }

    req.store = store;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Rate Limit per IP per Store ──────────────────────────────────────────────
exports.checkPlanLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const store = req.store;
      if (!store) return next();

      if (resource === 'products') {
        const Product = require('../models/Product');
        const count = await Product.countDocuments({ store: store._id, status: { $ne: 'archived' } });
        if (count >= store.limits.maxProducts) {
          return res.status(403).json({
            success: false,
            message: `Product limit reached (${store.limits.maxProducts}). Upgrade your plan.`,
            code: 'PLAN_LIMIT_REACHED'
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
