const Order = require('../models/Order');
const { Cart, Coupon } = require('../models/index');
const Product = require('../models/Product');
const Store = require('../models/Store');

// ─── Create order from cart ───────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const store = req.store;
    const {
      items, shippingAddress, billingAddress,
      paymentMethod, couponCode, notes, guestInfo
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Validate and price items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, store: store._id, status: 'active' });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }

      let price = product.price;
      let variantInfo = '';
      let variantId = null;

      if (item.variantId && product.hasVariants) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(400).json({ success: false, message: `Variant not found` });
        }
        price = variant.price;
        variantId = variant._id;
        variantInfo = variant.name;

        // Check variant inventory
        if (product.trackInventory && variant.inventory < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name} - ${variant.name}`
          });
        }
        variant.inventory -= item.quantity;
      } else if (product.trackInventory && !product.allowBackorder) {
        if (product.inventory < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`
          });
        }
      }

      // Deduct inventory
      if (!item.variantId) {
        product.inventory = Math.max(0, product.inventory - item.quantity);
      }
      await product.save();

      subtotal += price * item.quantity;
      orderItems.push({
        product: product._id,
        variant: variantId,
        name: product.name,
        image: product.primaryImage,
        price,
        quantity: item.quantity,
        sku: product.sku,
        variantInfo
      });
    }

    // Apply coupon
    let couponDiscount = 0;
    let couponCode_ = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        store: store._id,
        code: couponCode.toUpperCase(),
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      });

      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
          if (coupon.type === 'percentage') {
            couponDiscount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          } else if (coupon.type === 'fixed') {
            couponDiscount = Math.min(coupon.value, subtotal);
          }
          couponCode_ = couponCode.toUpperCase();
          coupon.usageCount++;
          if (req.user) {
            coupon.usedBy.push({ user: req.user._id });
          }
          await coupon.save();
        }
      }
    }

    // Calculate totals
    const taxRate = store.settings?.taxRate || 0;
    const tax = ((subtotal - couponDiscount) * taxRate) / 100;
    const shippingCost = store.settings?.freeShippingThreshold > 0 && subtotal >= store.settings.freeShippingThreshold
      ? 0
      : (store.settings?.shippingCost || 0);

    const total = subtotal - couponDiscount + tax + shippingCost;

    const order = await Order.create({
      store: store._id,
      customer: req.user?._id || null,
      guestInfo: !req.user ? guestInfo : undefined,
      items: orderItems,
      pricing: {
        subtotal,
        couponCode: couponCode_,
        couponDiscount,
        taxRate,
        tax,
        shipping: shippingCost,
        total
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      notes: { customer: notes },
      source: req.headers['x-source'] || 'web'
    });

    // Update store stats
    await Store.findByIdAndUpdate(store._id, { $inc: { 'stats.totalOrders': 1 } });

    // Clear cart
    if (req.user) {
      await Cart.findOneAndUpdate(
        { user: req.user._id, store: store._id },
        { items: [], coupon: null }
      );
    }

    await order.populate('items.product', 'name images');

    res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Get orders (vendor) ──────────────────────────────────────────────────────
exports.getVendorOrders = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const { page = 1, limit = 20, status, search, startDate, endDate, paymentStatus } = req.query;

    const query = { store: store._id };
    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'guestInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get customer orders ──────────────────────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('store', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, data: orders, pagination: { page: Number(page), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

// ─── Get single order ─────────────────────────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email avatar')
      .populate('items.product', 'name images slug')
      .populate('store', 'name slug logo branding');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auth check
    const isOwner = order.customer?.toString() === req.user?._id?.toString();
    const isVendor = req.user?.store?.toString() === order.store._id.toString();
    const isAdmin = req.user?.role === 'super_admin';

    if (!isOwner && !isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── Update order status ──────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message, trackingNumber, carrier, trackingUrl } = req.body;
    const store = req.store || await Store.findOne({ owner: req.user._id });

    const order = await Order.findOne({ _id: req.params.id, store: store._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['packed', 'cancelled'],
      packed: ['shipped'],
      shipped: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: ['returned'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`
      });
    }

    order.status = status;
    order.statusHistory.push({ status, message: message || `Order ${status}`, updatedBy: req.user._id });

    if (status === 'shipped') {
      order.tracking.trackingNumber = trackingNumber;
      order.tracking.carrier = carrier;
      order.tracking.trackingUrl = trackingUrl;
      order.tracking.shippedAt = new Date();
    }

    if (status === 'delivered') {
      order.tracking.deliveredAt = new Date();
      order.payment.status = 'paid';
      // Update revenue stats
      await Store.findByIdAndUpdate(store._id, { $inc: { 'stats.totalRevenue': order.pricing.total } });
      // Update product sales stats
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { 'stats.sales': item.quantity, 'stats.revenue': item.price * item.quantity }
        });
      }
    }

    if (status === 'cancelled') {
      order.cancelReason = req.body.cancelReason;
      order.cancelledAt = new Date();
      // Restore inventory
      for (const item of order.items) {
        if (item.variant) {
          await Product.findOneAndUpdate(
            { _id: item.product, 'variants._id': item.variant },
            { $inc: { 'variants.$.inventory': item.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(item.product, { $inc: { inventory: item.quantity } });
        }
      }
    }

    await order.save();
    res.json({ success: true, data: order, message: `Order status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};
