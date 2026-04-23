const router = require('express').Router();
const { uploadSingleImage, uploadMultipleImages, uploadVideo, deleteFile } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Upload single image
router.post('/image', protect, authorize('vendor', 'super_admin'), uploadSingleImage);

// Upload multiple images at once (up to 10)
router.post('/images', protect, authorize('vendor', 'super_admin'), uploadMultipleImages);

// Upload video
router.post('/video', protect, authorize('vendor', 'super_admin'), uploadVideo);

// Delete a file by filename
router.delete('/:filename', protect, authorize('vendor', 'super_admin'), deleteFile);

module.exports = router;
