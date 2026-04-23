const router = require('express').Router();
const ctrl   = require('../controllers/categoryController');
const { protect, authorize, resolveStore } = require('../middleware/auth');

// All routes require store context
router.use(resolveStore);

// Public
router.get('/',              ctrl.getCategories);   // ?tree=true for nested tree
router.get('/:idOrSlug',     ctrl.getCategory);

// Vendor only
router.post('/',             protect, authorize('vendor', 'super_admin'), ctrl.createCategory);
router.put('/:id',           protect, authorize('vendor', 'super_admin'), ctrl.updateCategory);
router.delete('/:id',        protect, authorize('vendor', 'super_admin'), ctrl.deleteCategory);
router.post('/bulk/reorder', protect, authorize('vendor', 'super_admin'), ctrl.reorderCategories);

module.exports = router;
