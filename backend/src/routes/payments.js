const router = require('express').Router();
const { protect, optionalAuth, resolveStore } = require('../middleware/auth');
const Order = require('../models/Order');
const Store = require('../models/Store');

// Initialize Stripe (lazy - only if key exists)
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

// ─── Create Stripe Payment Intent ────────────────────────────────────────────
router.post('/stripe/create-intent', resolveStore, optionalAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { orderId, amount, currency = 'usd' } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((amount || order.pricing.total) * 100), // Convert to cents
      currency,
      metadata: {
        orderId: orderId,
        storeId: req.store._id.toString(),
        orderNumber: order.orderNumber
      }
    });

    // Save payment intent ID to order
    await Order.findByIdAndUpdate(orderId, {
      'payment.stripePaymentIntentId': paymentIntent.id
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    if (err.message === 'Stripe not configured') {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }
    next(err);
  }
});

// ─── Confirm Stripe Payment ────────────────────────────────────────────────────
router.post('/stripe/confirm', resolveStore, optionalAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'paid',
        'payment.transactionId': paymentIntentId,
        'payment.paidAt': new Date(),
        status: 'confirmed'
      }, { new: true });

      // Update store revenue
      await Store.findByIdAndUpdate(order.store, {
        $inc: { 'stats.totalRevenue': order.pricing.total }
      });

      res.json({ success: true, data: order, message: 'Payment confirmed' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (err) { next(err); }
});

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
router.post('/webhook', async (req, res, next) => {
  try {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata.orderId;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            'payment.status': 'paid',
            'payment.transactionId': pi.id,
            'payment.paidAt': new Date(),
            status: 'confirmed'
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        if (pi.metadata.orderId) {
          await Order.findByIdAndUpdate(pi.metadata.orderId, {
            'payment.status': 'failed'
          });
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        if (charge.metadata?.orderId) {
          await Order.findByIdAndUpdate(charge.metadata.orderId, {
            'payment.status': 'refunded',
            'payment.refundedAt': new Date(),
            status: 'refunded'
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
});

// ─── Create Razorpay Order ────────────────────────────────────────────────────
router.post('/razorpay/create-order', resolveStore, optionalAuth, async (req, res, next) => {
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { orderId, amount, currency = 'INR' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const rzpOrder = await rzp.orders.create({
      amount: Math.round((amount || order.pricing.total) * 100),
      currency,
      receipt: order.orderNumber,
      notes: { orderId: orderId, storeId: req.store._id.toString() }
    });

    await Order.findByIdAndUpdate(orderId, { 'payment.razorpayOrderId': rzpOrder.id });

    res.json({ success: true, data: rzpOrder, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return res.status(503).json({ success: false, message: 'Razorpay not configured' });
    }
    next(err);
  }
});

// ─── Verify Razorpay Payment ──────────────────────────────────────────────────
router.post('/razorpay/verify', resolveStore, optionalAuth, async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const order = await Order.findByIdAndUpdate(orderId, {
      'payment.status': 'paid',
      'payment.transactionId': razorpay_payment_id,
      'payment.paidAt': new Date(),
      status: 'confirmed'
    }, { new: true });

    res.json({ success: true, data: order, message: 'Payment verified successfully' });
  } catch (err) { next(err); }
});

// ─── Refund Order ─────────────────────────────────────────────────────────────
router.post('/refund', protect, async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.payment.method === 'stripe' && order.payment.stripePaymentIntentId) {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: 'requested_by_customer'
      });

      await Order.findByIdAndUpdate(orderId, {
        'payment.status': amount < order.pricing.total ? 'partially_refunded' : 'refunded',
        'payment.refundedAmount': amount || order.pricing.total,
        'payment.refundedAt': new Date(),
        status: 'refunded'
      });

      res.json({ success: true, message: 'Refund initiated', refundId: refund.id });
    } else {
      // Manual refund for COD/other methods
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'refunded',
        'payment.refundedAmount': amount || order.pricing.total,
        'payment.refundedAt': new Date(),
        status: 'refunded',
        'notes.vendor': reason
      });
      res.json({ success: true, message: 'Refund marked as processed' });
    }
  } catch (err) { next(err); }
});

module.exports = router;
