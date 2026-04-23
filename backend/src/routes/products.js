const router = require('express').Router();
const productCtrl = require('../controllers/productController');
const { protect, authorize, resolveStore, checkPlanLimit } = require('../middleware/auth');

// Global labeled products (no store slug required) - MUST be before /:idOrSlug
router.get('/labeled', productCtrl.getLabeledProducts);
router.post('/bulk/status', protect, authorize('vendor','super_admin'), resolveStore, productCtrl.bulkUpdateStatus);

// Store-scoped public routes
router.get('/',           resolveStore, productCtrl.getProducts);
router.get('/:idOrSlug',  resolveStore, productCtrl.getProduct);

// Vendor routes
router.post('/',          protect, authorize('vendor','super_admin'), resolveStore, checkPlanLimit('products'), productCtrl.createProduct);
router.put('/:id',        protect, authorize('vendor','super_admin'), resolveStore, productCtrl.updateProduct);
router.delete('/:id',     protect, authorize('vendor','super_admin'), resolveStore, productCtrl.deleteProduct);
router.patch('/:id/inventory', protect, authorize('vendor','super_admin'), resolveStore, productCtrl.updateInventory);

module.exports = router;
