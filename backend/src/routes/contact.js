const router  = require('express').Router();
const ctrl    = require('../controllers/contactController');
const multer  = require('multer');
const { protect, authorize, resolveStore } = require('../middleware/auth');

const csvUpload   = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const authVendor  = [protect, authorize('vendor','super_admin')];

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/subscribe',            resolveStore, ctrl.subscribe);
router.post('/unsubscribe',          ctrl.unsubscribe);
router.post('/contact',              resolveStore, ctrl.submitContact);

// ── Subscribers (vendor/admin) ────────────────────────────────────────────────
router.get('/subscribers',           ...authVendor, ctrl.getSubscribers);
router.delete('/subscribers/:id',    ...authVendor, ctrl.deleteSubscriber);
router.post('/subscribers/import',   ...authVendor, csvUpload.single('file'), ctrl.importSubscribers);

// ── Contacts / Messages ────────────────────────────────────────────────────────
router.get('/contacts',              ...authVendor, ctrl.getContacts);
router.patch('/contacts/:id/status', ...authVendor, ctrl.updateContactStatus);
router.post('/contacts/:id/reply',   ...authVendor, ctrl.replyContact);

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns',             ...authVendor, ctrl.getCampaigns);
router.post('/campaigns',            ...authVendor, ctrl.createCampaign);
router.post('/campaigns/:id/send',   ...authVendor, ctrl.sendCampaign);
router.delete('/campaigns/:id',      ...authVendor, ctrl.deleteCampaign);

module.exports = router;
