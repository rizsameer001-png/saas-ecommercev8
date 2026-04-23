const router  = require('express').Router();
const multer  = require('multer');
const ctrl    = require('../controllers/csvController');
const { protect, authorize, resolveStore } = require('../middleware/auth');

// Memory storage for CSV (no disk write needed)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB CSV limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files are allowed'), false);
  },
});

router.use(resolveStore);

// Download template CSV (no auth required — helpful for onboarding)
router.get('/template',                  ctrl.getTemplate);

// Export current products as CSV
router.get('/export',  protect, authorize('vendor', 'super_admin'), ctrl.exportProducts);

// Import products from CSV
router.post('/import', protect, authorize('vendor', 'super_admin'), csvUpload.single('file'), ctrl.importProducts);

module.exports = router;
