const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  options: [{
    attribute: String,  // attribute name e.g. 'Color'
    value: String,      // display label e.g. 'Red'
    attrId:   { type: mongoose.Schema.Types.ObjectId },
    valueId:  { type: mongoose.Schema.Types.ObjectId },
    colorHex: String,   // e.g. '#EF4444'
    imageUrl: String,   // swatch image
  }],
  sku: String,
  price: { type: Number, required: true },
  comparePrice: Number,
  inventory: { type: Number, default: 0 },
  image: String,
  isActive: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, lowercase: true },
  description: { type: String, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 500 },
  price:        { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 },
  costPrice:    { type: Number, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String, trim: true }],
  // Labels
  labels: {
    isFeatured:   { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isOnSale:     { type: Boolean, default: false },
  },
  // Media
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
    publicId: String,
    width: Number, height: Number,
  }],
  videos: [{
    type: { type: String, enum: ['youtube', 'cloudinary', 'url'], default: 'youtube' },
    url: String,
    youtubeId: String,
    thumbnail: String,
    title: String,
  }],
  // Inventory
  sku: String, barcode: String,
  inventory: { type: Number, default: 0, min: 0 },
  lowStockAlert: { type: Number, default: 10 },
  trackInventory: { type: Boolean, default: true },
  allowBackorder: { type: Boolean, default: false },
  // Custom Attributes
  attributes: {
    size: [String], color: [String], material: [String],
    storage: [String], ram: [String], weight: String,
    bookFormat: { type: String, enum: ['paperback','hardcover','ebook','audiobook',''], default: '' },
    packageContents: String,
    custom: [{ key: String, value: String }],
  },
  // Reusable attribute links (from store Attribute model)
  productAttributes: [{
    attributeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
    attributeName:  String,
    attributeType:  String,
    usedForVariants: Boolean,
    filterable:     Boolean,
    required:       Boolean,
    selectedValues: [{
      valueId:  { type: mongoose.Schema.Types.ObjectId },
      label:    String,
      value:    String,
      colorHex: String,
      imageUrl: String,
    }],
  }],

  // Variants
  hasVariants: { type: Boolean, default: false },
  variantAttributes: [{ name: String, values: [String] }],
  variants: [variantSchema],
  // Shipping
  weight: Number,
  dimensions: { length: Number, width: Number, height: Number, unit: { type: String, default: 'cm' } },
  requiresShipping: { type: Boolean, default: true },
  freeShipping: { type: Boolean, default: false },
  // SEO
  seo: { metaTitle: String, metaDescription: String, keywords: [String] },
  // Status
  status: { type: String, enum: ['draft','active','inactive','archived'], default: 'active' },
  isDigital: { type: Boolean, default: false },
  // Stats
  stats: {
    views: { type: Number, default: 0 }, sales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }, rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  newArrivalUntil: Date,
  publishedAt: Date,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    let base = slugify(this.name, { lower: true, strict: true });
    let slug = base, n = 1;
    while (await mongoose.model('Product').findOne({ slug, store: this.store, _id: { $ne: this._id } })) {
      slug = `${base}-${n++}`;
    }
    this.slug = slug;
  }
  if (this.comparePrice && this.comparePrice > this.price) this.labels.isOnSale = true;
  if (this.newArrivalUntil && new Date() > this.newArrivalUntil) this.labels.isNewArrival = false;
  next();
});

productSchema.virtual('primaryImage').get(function() {
  return this.images?.find(i => i.isPrimary)?.url || this.images?.[0]?.url || null;
});
productSchema.virtual('discountPercent').get(function() {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});
productSchema.virtual('inStock').get(function() {
  if (!this.trackInventory) return true;
  if (this.hasVariants) return this.variants.some(v => v.inventory > 0);
  return this.inventory > 0;
});

productSchema.statics.extractYoutubeId = (url) => {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m?.[1] || null;
};

productSchema.index({ store: 1, slug: 1 }, { unique: true });
productSchema.index({ store: 1, status: 1 });
productSchema.index({ store: 1, 'labels.isFeatured': 1 });
productSchema.index({ store: 1, 'labels.isNewArrival': 1 });
productSchema.index({ store: 1, 'labels.isOnSale': 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ 'stats.sales': -1 });

module.exports = mongoose.model('Product', productSchema);
