const mongoose = require('mongoose');

const attributeValueSchema = new mongoose.Schema({
  label:      { type: String, required: true, trim: true },
  value:      { type: String, required: true, trim: true }, // internal key
  // For color swatch
  colorHex:   String,           // e.g. '#FF0000'
  // For image swatch
  imageUrl:   String,
  // Sort order
  sortOrder:  { type: Number, default: 0 },
  isDefault:  { type: Boolean, default: false },
}, { _id: true });

const sizeChartSchema = new mongoose.Schema({
  name:    String,           // e.g. 'Footwear Size Chart'
  headers: [String],         // e.g. ['UK', 'EU', 'US', 'CM']
  rows:    [[String]],       // e.g. [['5','38','6','24'], ['6','39','7','24.5']]
  imageUrl: String,          // optional chart image
}, { _id: false });

const attributeSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Store',
    required: true,
  },
  name: { type: String, required: true, trim: true },    // e.g. 'Color', 'UK Shoe Size'
  slug: { type: String, lowercase: true, trim: true },   // e.g. 'color', 'uk-shoe-size'

  type: {
    type:    String,
    enum:    ['dropdown', 'checkbox', 'color_swatch', 'image_swatch', 'text', 'number'],
    default: 'dropdown',
  },

  // Behavioural flags
  usedForVariants: { type: Boolean, default: false },   // contributes to variant combinations
  filterable:      { type: Boolean, default: true  },   // show in shop filter sidebar
  required:        { type: Boolean, default: false },   // customer must pick a value

  // The selectable values for this attribute
  values: [attributeValueSchema],

  // Size chart (only relevant when type is dropdown/checkbox and usedForVariants=true)
  sizeChart: sizeChartSchema,

  // Preset key — links to a built-in preset (e.g. 'size_uk', 'color', 'material')
  preset: { type: String, default: null },

  // Display order in the attribute list
  sortOrder: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: value count
attributeSchema.virtual('valueCount').get(function () {
  return this.values?.length || 0;
});

// Auto-generate slug from name
// attributeSchema.pre('save', function (next) {
//   if (this.isModified('name') || !this.slug) {
//     this.slug = this.name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9]+/g, '_')
//       .replace(/^_+|_+$/g, '');
//   }
//   next();
// });

attributeSchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    let slug = base;
    let count = 1;

    const Model = mongoose.model('Attribute');

    while (await Model.findOne({
      store: this.store,
      slug,
      _id: { $ne: this._id }
    })) {
      slug = `${base}_${count++}`;
    }

    this.slug = slug;
  }

  next();
});

// attributeSchema.index({ store: 1, slug: 1 });
attributeSchema.index({ store: 1, slug: 1 }, { unique: true });
attributeSchema.index({ store: 1, usedForVariants: 1 });
attributeSchema.index({ store: 1, filterable: 1 });

module.exports = mongoose.model('Attribute', attributeSchema);
