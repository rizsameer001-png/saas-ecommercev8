const router = require('express').Router();
const ctrl   = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

const adminOnly    = [protect, authorize('super_admin')];
const authOptional = (req, res, next) => { next(); }; // public

// ── Categories (public read, admin write) ─────────────────────────────────────
router.get('/categories',         ctrl.getCategories);
router.post('/categories',        ...adminOnly, ctrl.createCategory);
router.put('/categories/:id',     ...adminOnly, ctrl.updateCategory);
router.delete('/categories/:id',  ...adminOnly, ctrl.deleteCategory);

// ── Posts (public read, admin write) ─────────────────────────────────────────
router.get('/',                   ctrl.getPosts);
router.get('/:slug',              ctrl.getPost);
router.post('/',                  ...adminOnly, ctrl.createPost);
router.put('/:slug',              ...adminOnly, ctrl.updatePost);
router.patch('/:slug/toggle',     ...adminOnly, ctrl.togglePublish);
router.delete('/:slug',           ...adminOnly, ctrl.deletePost);

module.exports = router;
