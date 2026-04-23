// ─────────────────────────────────────────────────────────────────────────────
//  Plans CRUD (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const Plan       = require('../models/Plan');
const CmsPage    = require('../models/CmsPage');
const Subscription = require('../models/Subscription');
const Store      = require('../models/Store');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

// ── PLANS ─────────────────────────────────────────────────────────────────────
exports.getPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    const plans = await Plan.find(query).sort({ sortOrder: 1, 'pricing.monthly': 1 });
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, data: plan, message: 'Plan created' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Plan key already exists' });
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan, message: 'Plan updated' });
  } catch (err) { next(err); }
};

exports.deletePlan = async (req, res, next) => {
  try {
    // Block deletion if any active subscription uses this plan
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    const activeCount = await Subscription.countDocuments({ plan: plan.key, status: { $in: ['active','trialing'] } });
    if (activeCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${activeCount} active subscription(s) use this plan` });
    }
    await plan.deleteOne();
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) { next(err); }
};

// ── MANUAL PAYMENT OVERRIDE ───────────────────────────────────────────────────
exports.logManualPayment = async (req, res, next) => {
  try {
    const { storeId, planKey, amount, currency = 'USD', durationDays, paymentMethod, notes, paidAt } = req.body;
    if (!storeId || !planKey || !durationDays) {
      return res.status(400).json({ success: false, message: 'storeId, planKey, and durationDays are required' });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    // Look up plan features — from DB first, then fallback static
    let features;
    const planDoc = await Plan.findOne({ key: planKey });
    if (planDoc) {
      features = planDoc.features;
    } else {
      features = Subscription.getPlanFeatures ? Subscription.getPlanFeatures(planKey) : { maxProducts: 10, maxOrders: 100, storageGB: 1 };
    }

    const now     = new Date();
    const paid    = paidAt ? new Date(paidAt) : now;
    const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const invoice = {
      invoiceId:   `MAN-${Date.now()}`,
      amount:      parseFloat(amount) || 0,
      currency,
      status:      'paid',
      gateway:     'manual',
      paidAt:      paid,
      periodStart: now,
      periodEnd:   expires,
    };

    const sub = await Subscription.findOneAndUpdate(
      { store: storeId },
      {
        plan:   planKey,
        status: 'active',
        gateway: 'manual',
        amount:  parseFloat(amount) || 0,
        currency,
        features,
        currentPeriodStart: now,
        currentPeriodEnd:   expires,
        notifications: { expiryWarning7Sent: false, expiryWarning3Sent: false, expiryWarning1Sent: false, expiredSent: false },
        $push: { invoices: invoice },
        $set:  { 'metadata.manualPaymentNotes': notes || '', 'metadata.paymentMethod': paymentMethod || 'manual' },
      },
      { upsert: true, new: true }
    );

    // Sync store plan + limits
    await Store.findByIdAndUpdate(storeId, {
      plan: planKey,
      'limits.maxProducts': features.maxProducts,
      'limits.maxOrders':   features.maxOrders,
      'limits.storageGB':   features.storageGB,
    });

    res.json({
      success: true,
      data: sub,
      message: `Manual payment logged. ${planKey} plan active until ${expires.toDateString()}.`,
    });
  } catch (err) { next(err); }
};

// ── GET all subscriptions (admin view) ────────────────────────────────────────
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, plan, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (plan)   query.plan   = plan;

    const [subs, total] = await Promise.all([
      Subscription.find(query)
        .populate('store',  'name slug logo')
        .populate('vendor', 'name email')
        .sort({ currentPeriodEnd: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Subscription.countDocuments(query),
    ]);

    res.json({ success: true, data: subs, pagination: { page: Number(page), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

// ── STORE logo + banner override (admin) ──────────────────────────────────────
exports.adminUpdateStoreBranding = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { logo, banner, branding } = req.body;
    const update = {};
    if (logo    !== undefined) update.logo    = logo;
    if (banner  !== undefined) update.banner  = banner;
    if (branding)              update.branding = branding;

    const store = await Store.findByIdAndUpdate(storeId, update, { new: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store, message: 'Store branding updated' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CLOUDINARY — Signed upload preset
// ─────────────────────────────────────────────────────────────────────────────
exports.getCloudinarySignature = async (req, res, next) => {
  try {
    const { folder = 'saasstore/products', transformation } = req.body;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder,
      ...(transformation ? { transformation } : {}),
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    res.json({
      success:   true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (err) { next(err); }
};

// ── DELETE Cloudinary image by public_id ──────────────────────────────────────
exports.deleteCloudinaryAsset = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId required' });
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CMS PAGES
// ─────────────────────────────────────────────────────────────────────────────
exports.getCmsPages = async (req, res, next) => {
  try {
    const { published, footer } = req.query;
    const q = {};
    if (published === 'true') q.isPublished = true;
    if (footer    === 'true') q.showInFooter = true;
    const pages = await CmsPage.find(q).select('-content -sections').sort({ footerGroup: 1, footerLabel: 1 });
    res.json({ success: true, data: pages });
  } catch (err) { next(err); }
};

exports.getCmsPage = async (req, res, next) => {
  try {
    const page = await CmsPage.findOne({ slug: req.params.slug });
    if (!page || (!page.isPublished && req.user?.role !== 'super_admin')) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
};

exports.createCmsPage = async (req, res, next) => {
  try {
    const page = await CmsPage.create({ ...req.body, lastEditedBy: req.user._id });
    res.status(201).json({ success: true, data: page });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists' });
    next(err);
  }
};

exports.updateCmsPage = async (req, res, next) => {
  try {
    const page = await CmsPage.findOneAndUpdate(
      { slug: req.params.slug },
      { ...req.body, lastEditedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
};

exports.deleteCmsPage = async (req, res, next) => {
  try {
    await CmsPage.findOneAndDelete({ slug: req.params.slug });
    res.json({ success: true, message: 'Page deleted' });
  } catch (err) { next(err); }
};
