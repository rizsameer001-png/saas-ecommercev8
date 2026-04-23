const { Cart, Coupon } = require('../models/index');
const Product = require('../models/Product');

// ─── Get or create cart ───────────────────────────────────────────────────────
const getOrCreateCart = async (store, user, sessionId) => {
  const query = { store: store._id };
  if (user) {
    query.user = user._id;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    return null;
  }

  let cart = await Cart.findOne(query).populate('items.product', 'name images price inventory trackInventory status');

  if (!cart) {
    cart = await Cart.create({ store: store._id, user: user?._id, sessionId });
  }

  return cart;
};

// ─── Get cart ─────────────────────────────────────────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.store, req.user, sessionId);

    if (!cart) {
      return res.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } });
    }

    // Filter out invalid items
    cart.items = cart.items.filter(item => item.product && item.product.status === 'active');
    
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

// ─── Add to cart ──────────────────────────────────────────────────────────────
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    const sessionId = req.headers['x-session-id'];

    const product = await Product.findOne({ _id: productId, store: req.store._id, status: 'active' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let price = product.price;
    let variantInfo = '';
    let variantObjectId = null;

    if (variantId && product.hasVariants) {
      const variant = product.variants.id(variantId);
      if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
      price = variant.price;
      variantInfo = variant.name;
      variantObjectId = variant._id;

      if (product.trackInventory && variant.inventory < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock' });
      }
    } else if (product.trackInventory && !product.allowBackorder && product.inventory < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock' });
    }

    const cart = await getOrCreateCart(req.store, req.user, sessionId);

    // Check if item already in cart
    const existingIdx = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      (variantObjectId ? item.variant?.toString() === variantObjectId.toString() : !item.variant)
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
      cart.items[existingIdx].price = price;
    } else {
      cart.items.push({
        product: productId,
        variant: variantObjectId,
        quantity,
        price,
        name: product.name,
        image: product.primaryImage,
        variantInfo
      });
    }

    cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await cart.save();

    await cart.populate('items.product', 'name images price');

    res.json({ success: true, data: cart, message: 'Added to cart' });
  } catch (err) {
    next(err);
  }
};

// ─── Update cart item ─────────────────────────────────────────────────────────
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const sessionId = req.headers['x-session-id'];

    const cart = await getOrCreateCart(req.store, req.user, sessionId);
    const item = cart.items.id(itemId);

    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      // Check stock
      const product = await Product.findById(item.product);
      if (product?.trackInventory && !product.allowBackorder) {
        const maxQty = item.variant
          ? product.variants.id(item.variant)?.inventory || 0
          : product.inventory;
        if (quantity > maxQty) {
          return res.status(400).json({ success: false, message: `Only ${maxQty} items available` });
        }
      }
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

// ─── Remove cart item ─────────────────────────────────────────────────────────
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.store, req.user, sessionId);

    cart.items.pull(itemId);
    await cart.save();
    res.json({ success: true, data: cart, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

// ─── Clear cart ───────────────────────────────────────────────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.store, req.user, sessionId);
    cart.items = [];
    cart.coupon = null;
    await cart.save();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

// ─── Apply coupon ─────────────────────────────────────────────────────────────
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.store, req.user, sessionId);

    const subtotal = cart.subtotal;

    const coupon = await Coupon.findOne({
      store: req.store._id,
      code: code.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      startsAt: { $lte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${coupon.minOrderAmount} to use this coupon`
      });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    if (req.user && coupon.usageLimitPerUser) {
      const userUsage = coupon.usedBy.filter(u => u.user?.toString() === req.user._id.toString()).length;
      if (userUsage >= coupon.usageLimitPerUser) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // Applied at checkout
    }

    cart.coupon = { code: coupon.code, discount, type: coupon.type };
    await cart.save();

    res.json({
      success: true,
      data: cart,
      message: `Coupon applied! You saved ${discount.toFixed(2)}`
    });
  } catch (err) {
    next(err);
  }
};

// ─── Remove coupon ────────────────────────────────────────────────────────────
exports.removeCoupon = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const cart = await getOrCreateCart(req.store, req.user, sessionId);
    cart.coupon = null;
    await cart.save();
    res.json({ success: true, data: cart, message: 'Coupon removed' });
  } catch (err) {
    next(err);
  }
};
