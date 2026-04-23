const router  = require('express').Router();
const ctrl    = require('../controllers/bannerController');
const { protect, authorize, optionalAuth, resolveStore } = require('../middleware/auth');

// Public
router.get('/',           optionalAuth, ctrl.getBanners);
router.post('/:id/view',  ctrl.trackImpression);
router.post('/:id/click', ctrl.trackClick);

// Vendor + Admin management
router.get('/manage/all', protect, authorize('vendor','super_admin'), ctrl.getMyBanners);
router.post('/',          protect, authorize('vendor','super_admin'), ctrl.createBanner);
router.put('/:id',        protect, authorize('vendor','super_admin'), ctrl.updateBanner);
router.delete('/:id',     protect, authorize('vendor','super_admin'), ctrl.deleteBanner);

module.exports = router;
