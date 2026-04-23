const Subscription = require('../models/Subscription');
const Store = require('../models/Store');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// ─── Email helper ─────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  // Try SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({ to, from: process.env.FROM_EMAIL || 'noreply@saasstore.com', subject, html });
      return;
    } catch (e) { console.error('[SendGrid error]', e.message); }
  }
  // Fallback: nodemailer SMTP
  if (!process.env.SMTP_HOST) return console.log('[Email skipped - no email config]', subject);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: `"${process.env.FROM_NAME || 'SaaSStore'}" <${process.env.FROM_EMAIL}>`, to, subject, html });
};

const expiryEmailHtml = (vendorName, plan, daysLeft, renewUrl) => `
<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;border-radius:12px;text-align:center;margin-bottom:24px">
    <h1 style="color:white;margin:0;font-size:28px">⚠️ Plan Expiring Soon</h1>
  </div>
  <p style="color:#374151;font-size:16px">Hi <strong>${vendorName}</strong>,</p>
  <p style="color:#6b7280">Your <strong style="color:#4f46e5">${plan.toUpperCase()}</strong> plan expires in
    <strong style="color:#ef4444">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.
    Renew now to keep your store running without interruption.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${renewUrl}" style="background:#4f46e5;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">
      Renew My Plan
    </a>
  </div>
  <p style="color:#9ca3af;font-size:13px">If you have questions, reply to this email or visit our support portal.</p>
</div>`;

// ─── GET current subscription ─────────────────────────────────────────────────
exports.getSubscription = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    let sub = await Subscription.findOne({ store: store._id });
    if (!sub) {
      // Auto-create free subscription
      sub = await Subscription.create({
        store: store._id, vendor: req.user._id, plan: 'free', status: 'active',
        features: Subscription.getPlanFeatures('free'),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    res.json({ success: true, data: { ...sub.toObject(), isActive: sub.isActive, daysUntilExpiry: sub.daysUntilExpiry } });
  } catch (err) { next(err); }
};

// ─── GET all plans ────────────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  const plans = ['free', 'basic', 'pro', 'enterprise'].map(plan => ({
    id: plan,
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    monthlyPrice: Subscription.getPlanPrice(plan, 'monthly'),
    yearlyPrice:  Subscription.getPlanPrice(plan, 'yearly'),
    features: Subscription.getPlanFeatures(plan),
    popular: plan === 'pro',
  }));
  res.json({ success: true, data: plans });
};

// ─── UPGRADE plan (manual/admin direct assignment) ────────────────────────────
exports.upgradePlan = async (req, res, next) => {
  try {
    const { plan, billingCycle = 'monthly', durationDays } = req.body;
    const validPlans = ['free', 'basic', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const features = Subscription.getPlanFeatures(plan);
    const amount   = Subscription.getPlanPrice(plan, billingCycle);
    const now      = new Date();
    const days     = durationDays || (billingCycle === 'yearly' ? 365 : 30);
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const sub = await Subscription.findOneAndUpdate(
      { store: store._id },
      { plan, status: 'active', billingCycle, amount, gateway: 'manual', features,
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        notifications: { expiryWarning7Sent: false, expiryWarning3Sent: false, expiryWarning1Sent: false, expiredSent: false } },
      { upsert: true, new: true }
    );

    // Sync store plan + limits
    await Store.findByIdAndUpdate(store._id, {
      plan,
      'limits.maxProducts': features.maxProducts,
      'limits.maxOrders':   features.maxOrders,
      'limits.storageGB':   features.storageGB,
    });

    res.json({ success: true, data: sub, message: `Plan upgraded to ${plan}` });
  } catch (err) { next(err); }
};

// ─── Stripe: create checkout session ─────────────────────────────────────────
exports.stripeCreateCheckout = async (req, res, next) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { plan, billingCycle = 'monthly' } = req.body;

    const PRICE_IDS = {
      basic:      { monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,  yearly: process.env.STRIPE_PRICE_BASIC_YEARLY  },
      pro:        { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,    yearly: process.env.STRIPE_PRICE_PRO_YEARLY    },
      enterprise: { monthly: process.env.STRIPE_PRICE_ENT_MONTHLY,    yearly: process.env.STRIPE_PRICE_ENT_YEARLY    },
    };

    const priceId = PRICE_IDS[plan]?.[billingCycle];
    if (!priceId) return res.status(400).json({ success: false, message: `No Stripe price configured for ${plan}/${billingCycle}` });

    const store = await Store.findOne({ owner: req.user._id });
    let sub = await Subscription.findOne({ store: store._id });

    let customerId = sub?.stripe?.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email, name: req.user.name,
        metadata: { storeId: store._id.toString(), vendorId: req.user._id.toString() },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/billing?cancelled=true`,
      metadata: { plan, billingCycle, storeId: store._id.toString(), vendorId: req.user._id.toString() },
      subscription_data: { metadata: { plan, billingCycle, storeId: store._id.toString() } },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) { next(err); }
};

// ─── Stripe: handle webhook ───────────────────────────────────────────────────
exports.stripeSubscriptionWebhook = async (req, res, next) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig    = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      return res.status(400).json({ error: `Webhook Error: ${e.message}` });
    }

    const handleActivate = async (subscription, metadata) => {
      const { plan = 'basic', billingCycle = 'monthly', storeId } = metadata || {};
      if (!storeId) return;
      const features = Subscription.getPlanFeatures(plan);
      const amount   = Subscription.getPlanPrice(plan, billingCycle);
      await Subscription.findOneAndUpdate({ store: storeId }, {
        plan, status: 'active', billingCycle, amount, gateway: 'stripe',
        features, currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        'stripe.subscriptionId': subscription.id, 'stripe.customerId': subscription.customer,
        notifications: { expiryWarning7Sent: false, expiryWarning3Sent: false, expiryWarning1Sent: false, expiredSent: false },
      }, { upsert: true });
      await Store.findByIdAndUpdate(storeId, { plan, 'limits.maxProducts': features.maxProducts, 'limits.maxOrders': features.maxOrders });
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          await handleActivate(stripeSub, { ...session.metadata, ...stripeSub.metadata });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const s = event.data.object;
        await handleActivate(s, s.metadata);
        break;
      }
      case 'customer.subscription.deleted': {
        const s = event.data.object;
        const storeId = s.metadata?.storeId;
        if (storeId) {
          await Subscription.findOneAndUpdate({ store: storeId }, { status: 'cancelled', plan: 'free', 'stripe.subscriptionId': null });
          await Store.findByIdAndUpdate(storeId, { plan: 'free', 'limits.maxProducts': 10, 'limits.maxOrders': 100 });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        if (inv.subscription) {
          const storeQuery = await Subscription.findOne({ 'stripe.subscriptionId': inv.subscription });
          if (storeQuery) await Subscription.findByIdAndUpdate(storeQuery._id, { status: 'past_due' });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

// ─── Razorpay: create subscription ───────────────────────────────────────────
exports.razorpayCreateSubscription = async (req, res, next) => {
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const { plan, billingCycle = 'monthly' } = req.body;

    const PLAN_IDS = {
      basic:      { monthly: process.env.RZP_PLAN_BASIC_MONTHLY,  yearly: process.env.RZP_PLAN_BASIC_YEARLY  },
      pro:        { monthly: process.env.RZP_PLAN_PRO_MONTHLY,    yearly: process.env.RZP_PLAN_PRO_YEARLY    },
      enterprise: { monthly: process.env.RZP_PLAN_ENT_MONTHLY,    yearly: process.env.RZP_PLAN_ENT_YEARLY    },
    };

    const planId = PLAN_IDS[plan]?.[billingCycle];
    if (!planId) return res.status(400).json({ success: false, message: `No Razorpay plan configured for ${plan}/${billingCycle}` });

    const store = await Store.findOne({ owner: req.user._id });
    const subscription = await rzp.subscriptions.create({
      plan_id: planId, customer_notify: 1, quantity: 1, total_count: billingCycle === 'yearly' ? 1 : 12,
      notes: { storeId: store._id.toString(), vendorId: req.user._id.toString(), plan, billingCycle },
    });

    const features = Subscription.getPlanFeatures(plan);
    const now = new Date();
    await Subscription.findOneAndUpdate({ store: store._id }, {
      plan, status: 'active', billingCycle, gateway: 'razorpay',
      features, 'razorpay.subscriptionId': subscription.id, 'razorpay.planId': planId,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
    }, { upsert: true });

    await Store.findByIdAndUpdate(store._id, { plan, 'limits.maxProducts': features.maxProducts });

    res.json({ success: true, data: subscription, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) { next(err); }
};

// ─── PayPal: create subscription ──────────────────────────────────────────────
exports.paypalCreateSubscription = async (req, res, next) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;

    const PLAN_IDS = {
      basic:      { monthly: process.env.PAYPAL_PLAN_BASIC_MONTHLY,  yearly: process.env.PAYPAL_PLAN_BASIC_YEARLY  },
      pro:        { monthly: process.env.PAYPAL_PLAN_PRO_MONTHLY,    yearly: process.env.PAYPAL_PLAN_PRO_YEARLY    },
      enterprise: { monthly: process.env.PAYPAL_PLAN_ENT_MONTHLY,    yearly: process.env.PAYPAL_PLAN_ENT_YEARLY    },
    };

    const planId = PLAN_IDS[plan]?.[billingCycle];
    if (!planId) return res.status(400).json({ success: false, message: `No PayPal plan configured for ${plan}/${billingCycle}` });

    // Get PayPal access token
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}` },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();

    const store = await Store.findOne({ owner: req.user._id });

    const subRes = await fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'SaaSStore',
          return_url: `${process.env.FRONTEND_URL}/dashboard/billing?paypal=success`,
          cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?paypal=cancelled`,
        },
        custom_id: JSON.stringify({ storeId: store._id.toString(), plan, billingCycle }),
      }),
    });
    const ppSub = await subRes.json();

    res.json({ success: true, subscriptionId: ppSub.id, approvalUrl: ppSub.links?.find(l => l.rel === 'approve')?.href });
  } catch (err) { next(err); }
};

// ─── PayPal: activate after approval ─────────────────────────────────────────
exports.paypalActivate = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    const store = await Store.findOne({ owner: req.user._id });
    const sub   = await Subscription.findOne({ store: store._id });

    if (sub) {
      const meta = JSON.parse(sub.metadata?.get('ppCustomId') || '{}');
      const plan = meta.plan || 'basic';
      const features = Subscription.getPlanFeatures(plan);
      await Subscription.findByIdAndUpdate(sub._id, {
        plan, status: 'active', gateway: 'paypal', features,
        'paypal.subscriptionId': subscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await Store.findByIdAndUpdate(store._id, { plan, 'limits.maxProducts': features.maxProducts });
    }

    res.json({ success: true, message: 'PayPal subscription activated' });
  } catch (err) { next(err); }
};

// ─── Cancel subscription ──────────────────────────────────────────────────────
exports.cancelSubscription = async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    const sub   = await Subscription.findOne({ store: store._id });
    if (!sub) return res.status(404).json({ success: false, message: 'No active subscription' });

    if (sub.gateway === 'stripe' && sub.stripe?.subscriptionId) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.update(sub.stripe.subscriptionId, { cancel_at_period_end: true });
    }

    await Subscription.findByIdAndUpdate(sub._id, {
      status: 'cancelled', cancelledAt: new Date(), cancelReason: req.body.reason || 'Cancelled by vendor',
    });

    res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' });
  } catch (err) { next(err); }
};

// ─── Admin: force update any store plan ──────────────────────────────────────
exports.adminSetPlan = async (req, res, next) => {
  try {
    const { storeId, plan, durationDays = 30 } = req.body;
    const features = Subscription.getPlanFeatures(plan);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await Subscription.findOneAndUpdate({ store: storeId }, {
      plan, status: 'active', gateway: 'manual', features,
      currentPeriodStart: now, currentPeriodEnd: periodEnd,
      notifications: { expiryWarning7Sent: false, expiryWarning3Sent: false, expiryWarning1Sent: false, expiredSent: false },
    }, { upsert: true });

    await Store.findByIdAndUpdate(storeId, { plan, 'limits.maxProducts': features.maxProducts, 'limits.maxOrders': features.maxOrders });

    res.json({ success: true, message: `Plan set to ${plan} for ${durationDays} days` });
  } catch (err) { next(err); }
};

// ─── CRON JOB: check expiring subscriptions and send alerts ───────────────────
exports.checkExpiringSubscriptions = async () => {
  const now = new Date();
  const subs = await Subscription.find({
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $lte: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000) },
  }).populate({ path: 'store', select: 'name' }).populate({ path: 'vendor', select: 'name email' });

  for (const sub of subs) {
    const days = sub.daysUntilExpiry;
    const vendor = sub.vendor;
    const renewUrl = `${process.env.FRONTEND_URL}/dashboard/billing`;

    if (days <= 0 && !sub.notifications.expiredSent) {
      // Set grace period (3 days) before downgrading storefront
      const graceDays = sub.gracePeriodDays || 3;
      const graceEnds = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);
      await sub.updateOne({ status: 'expired', gracePeriodEnds: graceEnds, 'notifications.expiredSent': true });
      // Only fully downgrade AFTER grace period (handled in separate check below)
      await sendEmail({ to: vendor.email, subject: `Your ${sub.plan} plan has expired`, html: expiryEmailHtml(vendor.name, sub.plan, 0, renewUrl) });
    } else if (days <= 1 && !sub.notifications.expiryWarning1Sent) {
      await sub.updateOne({ 'notifications.expiryWarning1Sent': true });
      await sendEmail({ to: vendor.email, subject: `⚠️ 1 day left on your ${sub.plan} plan`, html: expiryEmailHtml(vendor.name, sub.plan, 1, renewUrl) });
    } else if (days <= 3 && !sub.notifications.expiryWarning3Sent) {
      await sub.updateOne({ 'notifications.expiryWarning3Sent': true });
      await sendEmail({ to: vendor.email, subject: `⚠️ 3 days left on your ${sub.plan} plan`, html: expiryEmailHtml(vendor.name, sub.plan, 3, renewUrl) });
    } else if (days <= 7 && !sub.notifications.expiryWarning7Sent) {
      await sub.updateOne({ 'notifications.expiryWarning7Sent': true });
      await sendEmail({ to: vendor.email, subject: `Your ${sub.plan} plan expires in 7 days`, html: expiryEmailHtml(vendor.name, sub.plan, 7, renewUrl) });
    }
  }
  // Downgrade stores whose grace period has also ended
  const expired = await Subscription.find({ status: 'expired', gracePeriodEnds: { $lte: new Date() } });
  for (const sub of expired) {
    const features = Subscription.getPlanFeatures ? Subscription.getPlanFeatures('free') : { maxProducts: 10, maxOrders: 100, storageGB: 1 };
    await Subscription.findByIdAndUpdate(sub._id, { plan: 'free', features, $unset: { gracePeriodEnds: '' } });
    await Store.findByIdAndUpdate(sub.store, { plan: 'free', 'limits.maxProducts': 10, 'limits.maxOrders': 100 });
  }
  console.log(`[Subscription check] Processed ${subs.length} expiry checks, ${expired.length} grace-expired downgrades`);
};
