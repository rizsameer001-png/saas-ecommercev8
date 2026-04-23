const mongoose = require('mongoose');

// ── Newsletter subscriber ─────────────────────────────────────────────────────
const subscriberSchema = new mongoose.Schema({
  email:      { type: String, required: true, lowercase: true, trim: true },
  name:       String,
  store:      { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null }, // null = platform-wide
  status:     { type: String, enum: ['active','unsubscribed'], default: 'active' },
  source:     { type: String, enum: ['footer_form','checkout','manual','import'], default: 'footer_form' },
  tags:       [String],
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: Date,
}, { timestamps: true });

subscriberSchema.index({ email: 1, store: 1 }, { unique: true });

// ── Contact message ───────────────────────────────────────────────────────────
const contactSchema = new mongoose.Schema({
  store:    { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  name:     { type: String, required: true },
  email:    { type: String, required: true, lowercase: true },
  phone:    String,
  subject:  String,
  message:  { type: String, required: true },
  status:   { type: String, enum: ['new','read','replied','archived'], default: 'new' },
  repliedAt: Date,
  replyNote: String,
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

contactSchema.index({ store: 1, status: 1, createdAt: -1 });

// ── Campaign (catalog / newsletter send) ─────────────────────────────────────
const campaignSchema = new mongoose.Schema({
  store:    { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  name:     { type: String, required: true },
  subject:  { type: String, required: true },
  body:     { type: String, required: true },   // HTML email body
  type:     { type: String, enum: ['newsletter','catalog','promotion','announcement'], default: 'newsletter' },
  status:   { type: String, enum: ['draft','sent','failed'], default: 'draft' },
  audience: { type: String, enum: ['all','subscribers','customers','tagged'], default: 'subscribers' },
  tags:     [String],   // filter subscribers by tag
  // Products to include (for catalog campaigns)
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  stats: {
    sent:     { type: Number, default: 0 },
    failed:   { type: Number, default: 0 },
    opened:   { type: Number, default: 0 },
  },
  scheduledAt: Date,
  sentAt:      Date,
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Contact    = mongoose.model('Contact',    contactSchema);
const Campaign   = mongoose.model('Campaign',   campaignSchema);

module.exports = { Subscriber, Contact, Campaign };
