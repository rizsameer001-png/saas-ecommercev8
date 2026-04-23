const router = require('express').Router();
const ctrl   = require('../controllers/adminExtController');
const { protect, authorize } = require('../middleware/auth');
const adminOnly = [protect, authorize('super_admin')];
const vendorOrAdmin = [protect, authorize('vendor', 'super_admin')];

// ── Plans CRUD ────────────────────────────────────────────────────────────────
router.get('/plans',         ctrl.getPlans);                           // public
router.post('/plans',        ...adminOnly, ctrl.createPlan);
router.put('/plans/:id',     ...adminOnly, ctrl.updatePlan);
router.delete('/plans/:id',  ...adminOnly, ctrl.deletePlan);

// ── Manual payment override ───────────────────────────────────────────────────
router.post('/payments/manual', ...adminOnly, ctrl.logManualPayment);

// ── All subscriptions (admin view) ────────────────────────────────────────────
router.get('/subscriptions',    ...adminOnly, ctrl.getAllSubscriptions);

// ── Store branding override (admin) ───────────────────────────────────────────
router.put('/stores/:storeId/branding', ...adminOnly, ctrl.adminUpdateStoreBranding);

// ── Cloudinary signed upload ──────────────────────────────────────────────────
router.post('/cloudinary/sign',   ...vendorOrAdmin, ctrl.getCloudinarySignature);
router.post('/cloudinary/delete', ...vendorOrAdmin, ctrl.deleteCloudinaryAsset);

// ── CMS Pages ─────────────────────────────────────────────────────────────────
router.get('/cms',              ctrl.getCmsPages);                     // public (with filter)
router.get('/cms/:slug',        ctrl.getCmsPage);                      // public (published only)
router.post('/cms',             ...adminOnly, ctrl.createCmsPage);
router.put('/cms/:slug',        ...adminOnly, ctrl.updateCmsPage);
router.delete('/cms/:slug',     ...adminOnly, ctrl.deleteCmsPage);

module.exports = router;
