const router = require('express').Router();
const ctrl   = require('../controllers/attributeController');
const { protect, authorize, resolveStore } = require('../middleware/auth');

router.use(resolveStore);

// Public (storefront filters)
router.get('/',           ctrl.getAttributes);
router.get('/presets',    protect, authorize('vendor', 'super_admin'), ctrl.getPresets);
router.get('/:id',        ctrl.getAttribute);

// Vendor management
router.post('/',          protect, authorize('vendor', 'super_admin'), ctrl.createAttribute);
router.post('/preset',    protect, authorize('vendor', 'super_admin'), ctrl.applyPreset);
router.post('/generate-variants', protect, authorize('vendor', 'super_admin'), ctrl.generateVariants);

router.put('/:id',        protect, authorize('vendor', 'super_admin'), ctrl.updateAttribute);
router.delete('/:id',     protect, authorize('vendor', 'super_admin'), ctrl.deleteAttribute);

// Value CRUD
router.post('/:id/values',              protect, authorize('vendor', 'super_admin'), ctrl.addValue);
router.put('/:id/values/:valueId',      protect, authorize('vendor', 'super_admin'), ctrl.updateValue);
router.delete('/:id/values/:valueId',   protect, authorize('vendor', 'super_admin'), ctrl.deleteValue);
router.post('/:id/values/reorder',      protect, authorize('vendor', 'super_admin'), ctrl.reorderValues);

module.exports = router;
