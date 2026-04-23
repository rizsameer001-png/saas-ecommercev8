const Banner = require('../models/Banner');
const Store  = require('../models/Store');

// ── GET banners (public) ─────────────────────────────────────────────────────
exports.getBanners = async (req, res, next) => {
  try {
    const { type, storeId } = req.query;
    const now  = new Date();
    const query = {
      isActive: true,
      $or: [{ startsAt:  { $lte: now } }, { startsAt: null }],
      $and: [{ $or: [{ expiresAt: { $gte: now } }, { expiresAt: null }] }],
    };

    // Store-specific OR platform-wide
    if (storeId) query.$or = [{ store: storeId }, { store: null }];
    else if (req.store) query.$or = [{ store: req.store._id }, { store: null }];

    if (type) query.type = type;

    const banners = await Banner.find(query)
      .populate('product', 'name images price slug')
      .sort({ priority: -1, createdAt: -1 });

    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
};

// ── GET vendor's banners (management) ────────────────────────────────────────
exports.getMyBanners = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const { type } = req.query;
    const query = { store: store?._id || null };
    if (req.user.role === 'super_admin' && !store) delete query.store;
    if (type) query.type = type;

    const banners = await Banner.find(query).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
};

// ── CREATE banner ─────────────────────────────────────────────────────────────
exports.createBanner = async (req, res, next) => {
  try {
    const storeId = req.user.role === 'super_admin' && req.body.platformWide
      ? null
      : (req.store?._id || (await Store.findOne({ owner: req.user._id }))?._id || null);

    const banner = await Banner.create({
      ...req.body,
      store: storeId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: banner, message: 'Banner created' });
  } catch (err) { next(err); }
};

// ── UPDATE banner ─────────────────────────────────────────────────────────────
exports.updateBanner = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') {
      const store = req.store || await Store.findOne({ owner: req.user._id });
      query.store = store?._id;
    }
    const banner = await Banner.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
};

// ── DELETE banner ─────────────────────────────────────────────────────────────
exports.deleteBanner = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') {
      const store = req.store || await Store.findOne({ owner: req.user._id });
      query.store = store?._id;
    }
    const banner = await Banner.findOneAndDelete(query);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { next(err); }
};

// ── Track impression/click ────────────────────────────────────────────────────
exports.trackImpression = async (req, res, next) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.trackClick = async (req, res, next) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
};
