const router = require('express').Router();
const cartCtrl = require('../controllers/cartController');
const { optionalAuth, resolveStore } = require('../middleware/auth');

router.use(resolveStore);
router.use(optionalAuth);

router.get('/', cartCtrl.getCart);
router.post('/add', cartCtrl.addToCart);
router.put('/item/:itemId', cartCtrl.updateCartItem);
router.delete('/item/:itemId', cartCtrl.removeCartItem);
router.delete('/clear', cartCtrl.clearCart);
router.post('/coupon', cartCtrl.applyCoupon);
router.delete('/coupon', cartCtrl.removeCoupon);

module.exports = router;
