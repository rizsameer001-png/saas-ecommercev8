const mongoose = require('mongoose');
const slugify  = require('slugify');

// ── Blog Category ──────────────────────────────────────────────────────────────
const blogCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  image:       String,
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory', default: null },
  sortOrder:   { type: Number, default: 0 },
  postCount:   { type: Number, default: 0 },
}, { timestamps: true });

// blogCategorySchema.pre('validate', function(next) {
//   if (!this.slug && this.name) {
//     this.slug = slugify(this.name, { lower: true, strict: true });
//   }
//   next();
// });

blogCategorySchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });

    let slug = base;
    let count = 1;

    const Model = mongoose.model('BlogCategory');

    while (await Model.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }

    this.slug = slug;
  }

  next();
});


// blogCategorySchema.index({ slug: 1 }, { unique: true });

// ── Blog Post ──────────────────────────────────────────────────────────────────
const blogPostSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt:      { type: String, maxlength: 500 },
  content:      { type: String, default: '' },    // Rich HTML content from editor

  // Cover image
  coverImage:   String,
  coverImageAlt: String,

  // Extra media (multiple images, videos)
  media: [{
    type:     { type: String, enum: ['image', 'youtube', 'video'], default: 'image' },
    url:      String,
    publicId: String,       // Cloudinary public_id
    youtubeId: String,
    thumbnail: String,
    caption:  String,
    alt:      String,
  }],

  // Taxonomy
  category:  { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory' },
  tags:      [{ type: String, trim: true }],

  // Author
  author: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:   String,
    avatar: String,
    bio:    String,
  },

  // Status
  status:      { type: String, enum: ['draft', 'published', 'scheduled', 'archived'], default: 'draft' },
  publishedAt: Date,
  scheduledAt: Date,

  // SEO
  seo: {
    metaTitle:       String,
    metaDescription: String,
    keywords:        [String],
    ogImage:         String,
  },

  // Stats
  stats: {
    views:    { type: Number, default: 0 },
    likes:    { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    readTime: { type: Number, default: 1 }, // minutes
  },

  // Related
  relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' }],

  featured:    { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true } });

// Auto-slug
// blogPostSchema.pre('validate', function(next) {
//   if (!this.slug && this.title) {
//     this.slug = slugify(this.title, { lower: true, strict: true });
//   }
//   next();
// });

blogPostSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true });

    let slug = base;
    let count = 1;

    const Model = mongoose.model('BlogPost');

    while (await Model.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }

    this.slug = slug;
  }

  // keep your readTime logic
  if (this.content) {
    const text = this.content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(Boolean).length;
    this.stats.readTime = Math.max(1, Math.ceil(words / 200));
  }

  next();
});

// Auto-calculate read time from content
// blogPostSchema.pre('save', function(next) {
//   if (this.content) {
//     const text   = this.content.replace(/<[^>]*>/g, '');
//     const words  = text.split(/\s+/).filter(Boolean).length;
//     this.stats.readTime = Math.max(1, Math.ceil(words / 200));
//   }
//   next();
// });

// blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);
const BlogPost     = mongoose.model('BlogPost', blogPostSchema);

module.exports = { BlogCategory, BlogPost };
