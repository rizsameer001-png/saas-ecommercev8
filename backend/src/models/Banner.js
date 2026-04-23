const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  // null store = platform-wide banner (super admin)
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title:       { type: String, required: true, trim: true },
  description: String,
  type: {
    type:    String,
    enum:    ['hero', 'side', 'popup', 'festival', 'product_ad'],
    default: 'hero',
  },

  // Media
  imageUrl:    { type: String, required: true },
  mobileImageUrl: String,  // optional separate mobile image
  videoUrl:    String,
  linkUrl:     String,     // where clicking takes user
  linkLabel:   String,     // button label e.g. "Shop Now"

  // Overlay text (optional for hero banners)
  headline:    String,
  subtext:     String,
  ctaText:     String,

  // Styling
  overlayColor:   { type: String, default: '#00000040' },  // RGBA
  textColor:      { type: String, default: '#FFFFFF' },
  position:       { type: String, enum: ['left','center','right'], default: 'left' },
  size:           { type: String, enum: ['sm','md','lg','full'], default: 'full' },

  // Popup settings
  popup: {
    delay:        { type: Number, default: 3  },   // seconds before showing
    frequency:    { type: String, enum: ['once','session','always'], default: 'session' },
    closeable:    { type: Boolean, default: true },
  },

  // Product link (for product ads)
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

  // Scheduling
  startsAt:  { type: Date, default: Date.now },
  expiresAt: Date,
  priority:  { type: Number, default: 0 },    // higher = shown first
  isActive:  { type: Boolean, default: true },

  // Analytics
  views:     { type: Number, default: 0 },
  clicks:    { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true } });

bannerSchema.virtual('isLive').get(function () {
  const now = new Date();
  const started  = !this.startsAt  || this.startsAt  <= now;
  const notExpired = !this.expiresAt || this.expiresAt >= now;
  return this.isActive && started && notExpired;
});

bannerSchema.index({ store: 1, type: 1, isActive: 1 });
bannerSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });
bannerSchema.index({ type: 1, priority: -1 });

module.exports = mongoose.model('Banner', bannerSchema);
