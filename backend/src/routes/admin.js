// routes/admin.js
const adminRouter = require('express').Router();
const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

adminRouter.use(protect);
adminRouter.use(authorize('super_admin'));

// Get all users
adminRouter.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).populate('store', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, data: users, pagination: { page: Number(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Toggle user active status
adminRouter.patch('/users/:id/toggle-status', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
});

// Get all stores
adminRouter.get('/stores', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, plan, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
    const skip = (page - 1) * limit;
    const [stores, total] = await Promise.all([
      Store.find(query).populate('owner', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Store.countDocuments(query)
    ]);
    res.json({ success: true, data: stores, pagination: { page: Number(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// Update store status
adminRouter.patch('/stores/:id/status', async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) { next(err); }
});

// Update store plan
adminRouter.patch('/stores/:id/plan', async (req, res, next) => {
  try {
    const planLimits = {
      free: { maxProducts: 10, maxOrders: 100, storageGB: 1 },
      basic: { maxProducts: 100, maxOrders: 1000, storageGB: 5 },
      pro: { maxProducts: 1000, maxOrders: 10000, storageGB: 20 },
      enterprise: { maxProducts: -1, maxOrders: -1, storageGB: 100 }
    };
    const { plan } = req.body;
    const limits = planLimits[plan] || planLimits.free;
    const store = await Store.findByIdAndUpdate(req.params.id, { plan, limits }, { new: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) { next(err); }
});

module.exports = adminRouter;
