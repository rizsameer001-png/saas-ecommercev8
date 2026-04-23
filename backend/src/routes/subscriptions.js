const router = require('express').Router();
const ctrl = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

// Public: plan listing
router.get('/plans', ctrl.getPlans);

// Vendor: view & manage subscription
router.get('/', protect, authorize('vendor'), ctrl.getSubscription);
router.post('/upgrade', protect, authorize('vendor'), ctrl.upgradePlan);
router.post('/cancel',  protect, authorize('vendor'), ctrl.cancelSubscription);

// Stripe checkout flow
router.post('/stripe/checkout',  protect, authorize('vendor'), ctrl.stripeCreateCheckout);

// Razorpay subscription
router.post('/razorpay/create',  protect, authorize('vendor'), ctrl.razorpayCreateSubscription);

// PayPal subscription
router.post('/paypal/create',    protect, authorize('vendor'), ctrl.paypalCreateSubscription);
router.post('/paypal/activate',  protect, authorize('vendor'), ctrl.paypalActivate);

// Stripe subscription webhook (raw body required — registered before json parser)
router.post('/webhook/stripe', ctrl.stripeSubscriptionWebhook);

// Admin: set any store plan
router.post('/admin/set-plan', protect, authorize('super_admin'), ctrl.adminSetPlan);

module.exports = router;
