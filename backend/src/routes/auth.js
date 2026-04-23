// ─── routes/auth.js ───────────────────────────────────────────────────────────
const authRouter = require('express').Router();
const authCtrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

authRouter.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], authCtrl.register);
authRouter.post('/login', authCtrl.login);
authRouter.post('/refresh-token', authCtrl.refreshToken);
authRouter.post('/forgot-password', authCtrl.forgotPassword);
authRouter.put('/reset-password/:token', authCtrl.resetPassword);
authRouter.get('/me', protect, authCtrl.getMe);
authRouter.put('/profile', protect, authCtrl.updateProfile);
authRouter.put('/change-password', protect, authCtrl.changePassword);
authRouter.post('/address', protect, authCtrl.addAddress);

module.exports = authRouter;
