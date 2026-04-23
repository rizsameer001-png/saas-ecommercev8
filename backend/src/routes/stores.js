const router = require('express').Router();
const Store  = require('../models/Store');
const { protect, authorize, isStoreOwner } = require('../middleware/auth');
const slugify = require('slugify');

// Get all stores (public)
router.get('/', async (req, res, next) => {
  try {
    const { page=1, limit=12, search, plan } = req.query;
    const query = { status: 'active' };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (plan)   query.plan = plan;
    const skip = (Number(page)-1) * Number(limit);
    const [stores, total] = await Promise.all([
      Store.find(query).populate('owner','name').sort({'stats.totalRevenue':-1}).skip(skip).limit(Number(limit)).lean(),
      Store.countDocuments(query)
    ]);
    res.json({ success:true, data:stores, pagination:{ page:Number(page), total, pages:Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

// Get store by slug (public)
router.get('/:slug', async (req, res, next) => {
  try {
    const store = await Store.findOne({ slug:req.params.slug, status:'active' }).populate('owner','name avatar');
    if (!store) return res.status(404).json({ success:false, message:'Store not found' });
    res.json({ success:true, data:store });
  } catch (err) { next(err); }
});

// Create store (vendor)
router.post('/', protect, authorize('vendor','super_admin'), async (req, res, next) => {
  try {
    const { name, description, contact, branding } = req.body;
    let slug = req.body.slug || slugify(name, { lower:true, strict:true });
    let counter = 1;
    while (await Store.findOne({ slug })) slug = `${slugify(name,{lower:true,strict:true})}-${counter++}`;
    const store = await Store.create({ name, slug, description, contact, branding, owner:req.user._id });
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { store:store._id });
    res.status(201).json({ success:true, data:store });
  } catch (err) { next(err); }
});

// Update store - includes logo, banner, all fields
router.put('/:id', protect, isStoreOwner, async (req, res, next) => {
  try {
    const { name, description, logo, banner, contact, branding, settings, social, seo, customDomain } = req.body;
    const updateFields = {};
    if (name        !== undefined) updateFields.name        = name;
    if (description !== undefined) updateFields.description = description;
    if (logo        !== undefined) updateFields.logo        = logo;
    if (banner      !== undefined) updateFields.banner      = banner;
    if (contact     !== undefined) updateFields.contact     = contact;
    if (branding    !== undefined) updateFields.branding    = branding;
    if (settings    !== undefined) updateFields.settings    = settings;
    if (social      !== undefined) updateFields.social      = social;
    if (seo         !== undefined) updateFields.seo         = seo;
    if (customDomain!== undefined) updateFields.customDomain= customDomain;

    const store = await Store.findByIdAndUpdate(req.params.id, updateFields, { new:true, runValidators:true });
    if (!store) return res.status(404).json({ success:false, message:'Store not found' });
    res.json({ success:true, data:store, message:'Store updated successfully' });
  } catch (err) { next(err); }
});

// Get my store (vendor)
router.get('/vendor/my-store', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner:req.user._id }).populate('owner','name email');
    if (!store) return res.status(404).json({ success:false, message:'No store found' });
    res.json({ success:true, data:store });
  } catch (err) { next(err); }
});

module.exports = router;
