const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/addresses', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

router.delete('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.addressId);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

router.put('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

module.exports = router;
