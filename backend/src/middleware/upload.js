const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── Storage: local disk ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ─── File filter ─────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed. Use: ${allowed.join(', ')}`), false);
};

const videoFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`Video type ${ext} not allowed`), false);
};

const anyFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

// ─── Multer instances ─────────────────────────────────────────────────────────
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
});

const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const uploadAny = multer({
  storage,
  fileFilter: anyFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Upload route handlers ───────────────────────────────────────────────────
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Upload single image → returns { url, filename }
exports.uploadSingleImage = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const url = `${BASE_URL}/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });
};

// Upload multiple images (up to 10) → returns { urls: [] }
exports.uploadMultipleImages = (req, res, next) => {
  uploadImage.array('images', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const files = req.files.map((file, i) => ({
      url: `${BASE_URL}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      isPrimary: i === 0,
    }));

    res.json({ success: true, files, count: files.length });
  });
};

// Upload single video
exports.uploadVideo = (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No video uploaded' });

    const url = `${BASE_URL}/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename, size: req.file.size });
  });
};

// Delete uploaded file
exports.deleteFile = (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes('..')) return res.status(400).json({ success: false, message: 'Invalid filename' });

  const filePath = path.join(__dirname, '../../uploads', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted' });
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
};
