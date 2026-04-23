const router = require('express').Router();
const Store  = require('../models/Store');
const crypto = require('crypto');
const { protect, authorize, isStoreOwner } = require('../middleware/auth');

// ─── GET payment settings (masks secrets) ─────────────────────────────────────
router.get('/payment-settings', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id }).select('+paymentSettings');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    // Mask secret keys before sending to client
    const s = store.paymentSettings?.toObject?.() || store.paymentSettings || {};
    const masked = {
      enabledGateways: s.enabledGateways || ['cod'],
      stripe: {
        enabled:   s.stripe?.enabled  || false,
        publicKey: s.stripe?.publicKey || '',
        secretKey: s.stripe?.secretKey ? '••••' + s.stripe.secretKey.slice(-4) : '',
        webhookSecret: s.stripe?.webhookSecret ? '••••' + s.stripe.webhookSecret.slice(-4) : '',
      },
      razorpay: {
        enabled:   s.razorpay?.enabled   || false,
        keyId:     s.razorpay?.keyId     || '',
        keySecret: s.razorpay?.keySecret ? '••••' + s.razorpay.keySecret.slice(-4) : '',
      },
      paypal: {
        enabled:      s.paypal?.enabled      || false,
        clientId:     s.paypal?.clientId     || '',
        clientSecret: s.paypal?.clientSecret ? '••••' + s.paypal.clientSecret.slice(-4) : '',
        sandbox:      s.paypal?.sandbox !== false,
      },
      cod: {
        enabled:      s.cod?.enabled !== false,
        label:        s.cod?.label        || 'Cash on Delivery',
        instructions: s.cod?.instructions || '',
      },
      bankTransfer: {
        enabled:       s.bankTransfer?.enabled       || false,
        bankName:      s.bankTransfer?.bankName      || '',
        accountName:   s.bankTransfer?.accountName   || '',
        accountNumber: s.bankTransfer?.accountNumber || '',
        routingNumber: s.bankTransfer?.routingNumber || '',
        instructions:  s.bankTransfer?.instructions  || '',
      },
    };

    res.json({ success: true, data: masked });
  } catch (err) { next(err); }
});

// ─── UPDATE payment settings ───────────────────────────────────────────────────
router.put('/payment-settings', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const { stripe, razorpay, paypal, cod, bankTransfer, enabledGateways } = req.body;

    // Only update non-masked values (don't overwrite real secret if user sends '••••')
    const update = {};
    if (enabledGateways) update['paymentSettings.enabledGateways'] = enabledGateways;

    if (stripe) {
      if (stripe.enabled !== undefined) update['paymentSettings.stripe.enabled']    = stripe.enabled;
      if (stripe.publicKey)             update['paymentSettings.stripe.publicKey']   = stripe.publicKey;
      if (stripe.secretKey && !stripe.secretKey.startsWith('••••'))
                                        update['paymentSettings.stripe.secretKey']   = stripe.secretKey;
      if (stripe.webhookSecret && !stripe.webhookSecret.startsWith('••••'))
                                        update['paymentSettings.stripe.webhookSecret'] = stripe.webhookSecret;
    }
    if (razorpay) {
      if (razorpay.enabled !== undefined) update['paymentSettings.razorpay.enabled']   = razorpay.enabled;
      if (razorpay.keyId)                 update['paymentSettings.razorpay.keyId']      = razorpay.keyId;
      if (razorpay.keySecret && !razorpay.keySecret.startsWith('••••'))
                                          update['paymentSettings.razorpay.keySecret']  = razorpay.keySecret;
    }
    if (paypal) {
      if (paypal.enabled !== undefined)       update['paymentSettings.paypal.enabled']      = paypal.enabled;
      if (paypal.clientId)                    update['paymentSettings.paypal.clientId']      = paypal.clientId;
      if (paypal.clientSecret && !paypal.clientSecret.startsWith('••••'))
                                              update['paymentSettings.paypal.clientSecret']  = paypal.clientSecret;
      if (paypal.sandbox !== undefined)       update['paymentSettings.paypal.sandbox']       = paypal.sandbox;
    }
    if (cod) {
      if (cod.enabled !== undefined)  update['paymentSettings.cod.enabled']      = cod.enabled;
      if (cod.label)                  update['paymentSettings.cod.label']         = cod.label;
      if (cod.instructions !== undefined) update['paymentSettings.cod.instructions'] = cod.instructions;
    }
    if (bankTransfer) {
      Object.entries(bankTransfer).forEach(([k, v]) => {
        if (v !== undefined) update[`paymentSettings.bankTransfer.${k}`] = v;
      });
    }

    await Store.findByIdAndUpdate(store._id, { $set: update });
    res.json({ success: true, message: 'Payment settings updated successfully' });
  } catch (err) { next(err); }
});

// ─── CUSTOM DOMAIN: request verification ──────────────────────────────────────
router.post('/custom-domain', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ success: false, message: 'Domain is required' });

    // Basic domain format validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) return res.status(400).json({ success: false, message: 'Invalid domain format' });

    // Check domain not already taken by another store
    const existing = await Store.findOne({ customDomain: domain, owner: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ success: false, message: 'This domain is already in use by another store' });

    // Generate verification token
    const token = `saasstore-verify=${crypto.randomBytes(16).toString('hex')}`;
    await Store.findOneAndUpdate(
      { owner: req.user._id },
      { customDomain: domain, domainVerified: false, domainVerificationToken: token }
    );

    res.json({
      success: true,
      message: 'Domain saved. Complete DNS verification to activate.',
      data: {
        domain,
        verificationToken: token,
        instructions: {
          method1_cname: { type: 'CNAME', name: 'www', value: `${process.env.PLATFORM_DOMAIN || 'yourplatform.com'}` },
          method2_txt:   { type: 'TXT',   name: '@',   value: token, description: 'Add this TXT record to verify ownership' },
        },
      },
    });
  } catch (err) { next(err); }
});

// ─── VERIFY domain DNS ────────────────────────────────────────────────────────
router.post('/custom-domain/verify', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store?.customDomain) return res.status(400).json({ success: false, message: 'No custom domain configured' });

    // In production: perform real DNS TXT lookup
    // For now: simulate verification success (replace with actual dns.resolveTxt() call)
    const dns = require('dns').promises;
    let verified = false;
    try {
      const records = await dns.resolveTxt(store.customDomain);
      verified = records.flat().some(r => r === store.domainVerificationToken);
    } catch (e) {
      // DNS lookup failed — not verified yet
    }

    if (verified) {
      await Store.findByIdAndUpdate(store._id, { domainVerified: true });
      return res.json({ success: true, verified: true, message: 'Domain verified! Your custom domain is now active.' });
    }

    res.json({
      success: true, verified: false,
      message: 'DNS record not found yet. DNS propagation can take 24–48 hours. Please try again later.',
      hint: `Add TXT record: ${store.domainVerificationToken}`,
    });
  } catch (err) { next(err); }
});

// ─── REMOVE custom domain ─────────────────────────────────────────────────────
router.delete('/custom-domain', protect, authorize('vendor'), async (req, res, next) => {
  try {
    await Store.findOneAndUpdate(
      { owner: req.user._id },
      { $unset: { customDomain: '', domainVerified: '', domainVerificationToken: '' } }
    );
    res.json({ success: true, message: 'Custom domain removed' });
  } catch (err) { next(err); }
});

module.exports = router;
