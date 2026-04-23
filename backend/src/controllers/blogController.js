const { BlogCategory, BlogPost } = require('../models/Blog');
const slugify = require('slugify');

// ─── CATEGORY CRUD ────────────────────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const cats = await BlogCategory.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Attach computed postCount
    const counts = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count; });
    cats.forEach(c => { c.postCount = countMap[c._id.toString()] || 0; });

    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, parent, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const slug = slugify(name, { lower: true, strict: true });
    const cat  = await BlogCategory.create({ name, slug, description, image, parent: parent || null, sortOrder: sortOrder || 0 });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Category slug already exists' });
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, parent, sortOrder } = req.body;
    const update = { description, image, parent: parent || null, sortOrder };
    if (name) { update.name = name; update.slug = slugify(name, { lower: true, strict: true }); }
    const cat = await BlogCategory.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const inUse = await BlogPost.countDocuments({ category: req.params.id });
    if (inUse > 0) return res.status(400).json({ success: false, message: `Cannot delete — ${inUse} post(s) use this category` });
    await BlogCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ─── POST CRUD ────────────────────────────────────────────────────────────────
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, status, category, tag,
      search, featured, sort = '-publishedAt',
    } = req.query;

    const query = {};
    if (status)   query.status   = status;
    if (category) query.category = category;
    if (tag)      query.tags     = tag;
    if (featured  === 'true') query.featured = true;
    if (search)   query.$text    = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('category', 'name slug')
        .populate('author.userId', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true, data: posts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug })
      .populate('category', 'name slug')
      .populate('relatedPosts', 'title slug coverImage excerpt publishedAt')
      .lean();

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Increment views (non-blocking)
    BlogPost.findByIdAndUpdate(post._id, { $inc: { 'stats.views': 1 } }).exec();

    // Fetch similar posts (same category, excluding this)
    let similar = [];
    if (post.category) {
      similar = await BlogPost.find({
        category: post.category._id,
        status: 'published',
        _id: { $ne: post._id },
      }).populate('category','name slug').sort('-publishedAt').limit(3).lean();
    }

    res.json({ success: true, data: post, similar });
  } catch (err) { next(err); }
};

exports.createPost = async (req, res, next) => {
  try {
    const {
      title, excerpt, content, coverImage, coverImageAlt, media,
      category, tags, status, publishedAt, scheduledAt, seo, featured,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    let slug = slugify(title, { lower: true, strict: true });
    // Ensure unique slug
    let existing = await BlogPost.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const post = await BlogPost.create({
      title, slug, excerpt, content: content || '', coverImage, coverImageAlt,
      media: media || [],
      category: category || null,
      tags: tags || [],
      author: { userId: req.user._id, name: req.user.name, avatar: req.user.avatar },
      status: status || 'draft',
      publishedAt: status === 'published' ? (publishedAt || new Date()) : undefined,
      scheduledAt,
      seo: seo || {},
      featured: featured || false,
    });

    await post.populate('category', 'name slug');
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const {
      title, excerpt, content, coverImage, coverImageAlt, media,
      category, tags, status, publishedAt, scheduledAt, seo, featured, relatedPosts,
    } = req.body;

    // Regen slug only if title changed and slug not manually set
    if (title && title !== post.title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      const clash   = await BlogPost.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (!clash) post.slug = newSlug;
      post.title = title;
    }

    if (excerpt      !== undefined) post.excerpt      = excerpt;
    if (content      !== undefined) post.content      = content;
    if (coverImage   !== undefined) post.coverImage   = coverImage;
    if (coverImageAlt!== undefined) post.coverImageAlt = coverImageAlt;
    if (media        !== undefined) post.media        = media;
    if (category     !== undefined) post.category     = category || null;
    if (tags         !== undefined) post.tags         = tags;
    if (seo          !== undefined) post.seo          = seo;
    if (featured     !== undefined) post.featured     = featured;
    if (relatedPosts !== undefined) post.relatedPosts = relatedPosts;
    if (scheduledAt  !== undefined) post.scheduledAt  = scheduledAt;

    // Handle status change
    if (status && status !== post.status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = publishedAt || new Date();
      }
    }

    await post.save();
    await post.populate('category', 'name slug');
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
};

// ─── QUICK PUBLISH/UNPUBLISH ──────────────────────────────────────────────────
exports.togglePublish = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.status = post.status === 'published' ? 'draft' : 'published';
    if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    await post.save();
    res.json({ success: true, data: { status: post.status }, message: `Post ${post.status}` });
  } catch (err) { next(err); }
};
