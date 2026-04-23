const router = require('express').Router();
const orderCtrl = require('../controllers/orderController');
const { protect, authorize, optionalAuth, resolveStore } = require('../middleware/auth');

// Create order (customer or guest)
router.post('/', resolveStore, optionalAuth, orderCtrl.createOrder);

// Customer: get my orders
router.get('/my-orders', protect, orderCtrl.getMyOrders);

// Vendor: get store orders
router.get('/vendor', protect, authorize('vendor', 'super_admin'), orderCtrl.getVendorOrders);

// Get single order
router.get('/:id', protect, orderCtrl.getOrder);

// Vendor: update order status
router.patch('/:id/status', protect, authorize('vendor', 'super_admin'), orderCtrl.updateOrderStatus);

// Customer: cancel order
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.isCancellable) return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: 'cancelled', message: 'Cancelled by customer', updatedBy: req.user._id });
    await order.save();

    res.json({ success: true, data: order, message: 'Order cancelled successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
