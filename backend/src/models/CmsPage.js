const mongoose = require('mongoose');

const cmsPageSchema = new mongoose.Schema({
  slug:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  title:      { type: String, required: true, trim: true },
  metaTitle:  String,
  metaDesc:   String,
  content:    { type: String, default: '' },   // Rich HTML/Markdown content
  sections: [{
    type:    { type: String, enum: ['hero','text','image_text','feature_grid','faq','cta','custom'], default: 'text' },
    heading: String,
    body:    String,
    imageUrl: String,
    imageAlt: String,
    imagePosition: { type: String, enum: ['left','right'], default: 'right' },
    items:   [{ icon: String, heading: String, body: String }],  // for feature_grid / faq
    ctaLabel: String,
    ctaUrl:   String,
    bgColor:  String,
    order:    { type: Number, default: 0 },
  }],
  isPublished: { type: Boolean, default: false },
  showInFooter: { type: Boolean, default: false },
  footerLabel:  String,   // label shown in footer link
  footerGroup:  { type: String, enum: ['company','legal','support',''], default: 'legal' },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

cmsPageSchema.index({ slug: 1 }, { unique: true });
cmsPageSchema.index({ isPublished: 1, showInFooter: 1 });

module.exports = mongoose.model('CmsPage', cmsPageSchema);
