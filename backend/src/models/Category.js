const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  store:       { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  name:        { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 100 },
  slug:        { type: String, lowercase: true, trim: true },
  description: { type: String, maxlength: 500 },
  image:       String,

  // Multilevel: null = root category, ObjectId = sub-category
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

  // Computed path for breadcrumbs: ['Electronics', 'Phones', 'Smartphones']
  path:        [String],

  // Depth level: 0 = root, 1 = sub, 2 = sub-sub, etc.
  depth:       { type: Number, default: 0 },

  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },

  // Cached product count
  productCount: { type: Number, default: 0 },

  seo: {
    metaTitle:       String,
    metaDescription: String,
  },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Virtual: children ────────────────────────────────────────────────────────
categorySchema.virtual('children', {
  ref:          'Category',
  localField:   '_id',
  foreignField: 'parent',
  options:      { sort: { sortOrder: 1, name: 1 } },
});

// ─── Pre-save: auto-slug + compute path/depth ─────────────────────────────────
categorySchema.pre('save', async function(next) {
  // Slug generation (unique within store)
  if (this.isModified('name') || !this.slug) {
    let base = slugify(this.name, { lower: true, strict: true });
    let slug = base, n = 1;
    const Model = mongoose.model('Category');
    while (await Model.findOne({ slug, store: this.store, _id: { $ne: this._id } })) {
      slug = `${base}-${n++}`;
    }
    this.slug = slug;
  }

  // Compute depth + path from parent chain
  if (this.isModified('parent')) {
    if (!this.parent) {
      this.depth = 0;
      this.path  = [this.name];
    } else {
      const parent = await mongoose.model('Category').findById(this.parent);
      if (parent) {
        this.depth = (parent.depth || 0) + 1;
        this.path  = [...(parent.path || [parent.name]), this.name];
      }
    }
  } else if (this.isNew && !this.parent) {
    this.depth = 0;
    this.path  = [this.name];
  }

  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
categorySchema.index({ store: 1, parent: 1, sortOrder: 1 });
categorySchema.index({ store: 1, slug: 1 });
categorySchema.index({ store: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
