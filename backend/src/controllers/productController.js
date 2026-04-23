const Product  = require('../models/Product');
const Store    = require('../models/Store');
const Category = require('../models/Category');

// ─── Shared populate config ───────────────────────────────────────────────────
const CAT_POPULATE = { path: 'category', select: 'name slug depth path parent', populate: { path: 'parent', select: 'name slug' } };

// ─── List products (storefront + vendor) ─────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const store = req.store;
    const { page=1, limit=12, sort='-createdAt', category, search,
            minPrice, maxPrice, inStock, featured, newArrival, onSale, status } = req.query;

    const query = { store: store._id };
    const isVendor = ['vendor','super_admin'].includes(req.user?.role);
    query.status = isVendor && status ? status : 'active';

    if (category) {
      // Include products from this category AND all its descendants
      const descendants = await getAllDescendantIds(category, store._id);
      query.category = { $in: [category, ...descendants] };
    }
    if (featured === 'true')   query['labels.isFeatured']   = true;
    if (newArrival === 'true') query['labels.isNewArrival'] = true;
    if (onSale === 'true')     query['labels.isOnSale']     = true;
    if (inStock === 'true')    query.inventory = { $gt: 0 };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);

    const sortMap = {
      price_asc: { price: 1 }, price_desc: { price: -1 },
      popular: { 'stats.sales': -1 }, rating: { 'stats.rating': -1 },
      newest: { createdAt: -1 },
    };
    const sortOptions = sortMap[sort] || { createdAt: -1 };

    const products = await Product.find(query)
      .populate(CAT_POPULATE)
      .sort(sortOptions).skip(skip).limit(Number(limit)).lean();

    res.json({
      success: true, data: products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

// ─── Get single product ───────────────────────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const store = req.store;
    const { idOrSlug } = req.params;
    const query = { store: store._id };
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) query._id = idOrSlug;
    else query.slug = idOrSlug;

    const product = await Product.findOne(query)
      .populate(CAT_POPULATE)
      .populate('store', 'name slug branding settings');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await Product.findByIdAndUpdate(product._id, { $inc: { 'stats.views': 1 } });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ─── Create product ───────────────────────────────────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const data = { ...req.body, store: store._id };

    // Validate category belongs to this store
    if (data.category) {
      const cat = await Category.findOne({ _id: data.category, store: store._id });
      if (!cat) {
        return res.status(400).json({ success: false, message: 'Category not found in this store' });
      }
    }

    // Auto-extract YouTube IDs
    if (data.videos?.length) {
      data.videos = data.videos.map(v => {
        if (v.url?.includes('youtube') || v.url?.includes('youtu.be') || v.type === 'youtube') {
          const id = extractYoutubeId(v.url);
          return { ...v, type: 'youtube', youtubeId: id, thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : v.thumbnail };
        }
        return v;
      });
    }

    // Auto-set isOnSale
    if (data.comparePrice && Number(data.comparePrice) > Number(data.price)) {
      if (!data.labels) data.labels = {};
      data.labels.isOnSale = true;
    }

    // Auto-set newArrivalUntil
    if (data.labels?.isNewArrival && !data.newArrivalUntil) {
      data.newArrivalUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    if (data.images?.length && !data.images.some(i => i.isPrimary)) data.images[0].isPrimary = true;

    const product = await Product.create(data);
    await product.populate(CAT_POPULATE);
    await Store.findByIdAndUpdate(store._id, { $inc: { 'stats.totalProducts': 1 } });
    // Update category product count
    if (product.category) await Category.findByIdAndUpdate(product.category, { $inc: { productCount: 1 } });

    res.status(201).json({ success: true, data: product, message: 'Product created' });
  } catch (err) { next(err); }
};

// ─── Update product ───────────────────────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const product = await Product.findOne({ _id: req.params.id, store: store._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Validate category
    if (req.body.category && req.body.category !== product.category?.toString()) {
      const cat = await Category.findOne({ _id: req.body.category, store: store._id });
      if (!cat) return res.status(400).json({ success: false, message: 'Category not found in this store' });
    }

    // Process YouTube videos
    if (req.body.videos?.length) {
      req.body.videos = req.body.videos.map(v => {
        if (v.url?.includes('youtube') || v.url?.includes('youtu.be') || v.type === 'youtube') {
          const id = v.youtubeId || extractYoutubeId(v.url);
          return { ...v, type: 'youtube', youtubeId: id, thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : v.thumbnail };
        }
        return v;
      });
    }

    // Track category change for count update
    const oldCategory = product.category?.toString();
    Object.assign(product, req.body);
    await product.save();

    // Update category product counts if changed
    const newCategory = product.category?.toString();
    if (oldCategory !== newCategory) {
      if (oldCategory) await Category.findByIdAndUpdate(oldCategory, { $inc: { productCount: -1 } });
      if (newCategory) await Category.findByIdAndUpdate(newCategory, { $inc: { productCount:  1 } });
    }

    await product.populate(CAT_POPULATE);
    res.json({ success: true, data: product, message: 'Product updated' });
  } catch (err) { next(err); }
};

// ─── Delete (soft-archive) product ───────────────────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store: store._id },
      { status: 'archived' },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await Store.findByIdAndUpdate(store._id, { $inc: { 'stats.totalProducts': -1 } });
    if (product.category) await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    res.json({ success: true, message: 'Product archived successfully' });
  } catch (err) { next(err); }
};

// ─── Hard delete product ──────────────────────────────────────────────────────
exports.hardDeleteProduct = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const product = await Product.findOneAndDelete({ _id: req.params.id, store: store._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product permanently deleted' });
  } catch (err) { next(err); }
};

// ─── Update inventory ─────────────────────────────────────────────────────────
exports.updateInventory = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const { inventory, variantId } = req.body;
    const product = await Product.findOne({ _id: req.params.id, store: store._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (variantId) { const v = product.variants.id(variantId); if (v) v.inventory = inventory; }
    else product.inventory = inventory;
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// ─── Bulk status update ───────────────────────────────────────────────────────
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    const { ids, status } = req.body;
    await Product.updateMany({ _id: { $in: ids }, store: store._id }, { status });
    res.json({ success: true, message: `${ids.length} products updated to ${status}` });
  } catch (err) { next(err); }
};

// ─── Labeled products (marketplace) ──────────────────────────────────────────
exports.getLabeledProducts = async (req, res, next) => {
  try {
    const { label, limit = 8, storeSlug } = req.query;
    const labelMap = { featured: 'labels.isFeatured', newArrival: 'labels.isNewArrival', onSale: 'labels.isOnSale' };
    const field = labelMap[label];
    if (!field) return res.status(400).json({ success: false, message: 'Invalid label. Use: featured, newArrival, onSale' });

    const query = { status: 'active', [field]: true };
    const slug = storeSlug || req.headers['x-store-slug'];
    if (slug) {
      const s = await Store.findOne({ slug, status: 'active' });
      if (s) query.store = s._id;
    }

    const products = await Product.find(query)
      .populate('store', 'name slug branding settings')
      .populate(CAT_POPULATE)
      .sort({ createdAt: -1 }).limit(Number(limit)).lean();

    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractYoutubeId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m?.[1] || null;
}

async function getAllDescendantIds(categoryId, storeId) {
  const children = await Category.find({ parent: categoryId, store: storeId }).select('_id');
  const ids = children.map(c => c._id.toString());
  for (const child of children) {
    const nested = await getAllDescendantIds(child._id, storeId);
    ids.push(...nested);
  }
  return ids;
}
