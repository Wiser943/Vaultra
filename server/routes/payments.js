const express  = require('express');
const fetch    = require('node-fetch');
const crypto   = require('crypto');
const { nanoid } = require('nanoid');
const { protect } = require('../middleware/auth');
const Payment  = require('../models/Payment');
const User     = require('../models/User');

const router = express.Router();

// Plan config
const PLANS = {
  sterling: {
    label:       'Sterling Plan',
    amountNaira: 7000,
    vaultReward: 7000,    // ₦ welcome bonus
  },
  sovereign: {
    label:       'Sovereign Plan',
    amountNaira: 15000,
    vaultReward: 15000,
  }
};

// Referral bonus amounts (₦)
const REFERRAL_BONUS = {
  direct: { sterling: 2000,  sovereign: 4000  },  // level 1 — adjust once confirmed
  level2: { sterling: 400,   sovereign: 800   },  // level 2
};

// ── POST /api/payments/initiate ──────────────────────────────
// Creates a Korapay checkout and returns the payment URL
router.post('/initiate', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
    }

    // Don't allow double payment
    if (req.user.status === 'verified') {
      return res.status(400).json({ success: false, message: 'Your account is already activated.' });
    }

    const planData  = PLANS[plan];
    const reference = 'VLT-' + nanoid(12).toUpperCase();

    // Call Korapay Checkout API
    const koraRes = await fetch(`${process.env.KORAPAY_BASE_URL}/charges/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
      },
      body: JSON.stringify({
        reference,
        amount:        planData.amountNaira,
        currency:      'NGN',
        customer: {
          name:  req.user.fullName,
          email: req.user.email
        },
        notification_url: `${process.env.BACKEND_URL || process.env.APP_URL}/api/payments/webhook`,
        redirect_url:     `${process.env.FRONTEND_URL || process.env.APP_URL}/dashboard.html?payment=success&reference=${reference}`,
        narration:        `VAULTRA ${planData.label} activation`,
        channels:         ['card', 'bank_transfer', 'pay_with_bank']
      })
    });

    const koraData = await koraRes.json();

    if (!koraData.status) {
      console.error('Korapay init error:', koraData);
      return res.status(502).json({ success: false, message: 'Payment gateway error. Please try again.' });
    }

    // Save pending payment record
    await Payment.create({
      user:      req.user._id,
      plan,
      reference,
      korapayRef: koraData.data?.payment_reference,
      amount:    planData.amountNaira,
      status:    'pending'
    });

    res.json({
      success:     true,
      checkoutUrl: koraData.data?.checkout_url,
      reference
    });

  } catch (err) {
    console.error('Payment initiate error:', err);
    res.status(500).json({ success: false, message: 'Could not initiate payment. Please try again.' });
  }
});

// ── POST /api/payments/webhook — Korapay webhook ─────────────
// Korapay calls this URL when payment status changes
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-korapay-signature'];
    const hash = crypto
      .createHmac('sha256', process.env.KORAPAY_ENCRYPTION_KEY)
      .update(req.body)
      .digest('hex');

    if (signature !== hash) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      if (status !== 'success') return res.json({ received: true });

      const payment = await Payment.findOne({ reference });
      if (!payment || payment.status === 'success') return res.json({ received: true });

      // Mark payment success
      payment.status      = 'success';
      payment.webhookData = event.data;
      payment.verifiedAt  = new Date();
      await payment.save();

      // Activate user account
      const user = await User.findById(payment.user);
      if (user && user.status !== 'verified') {
        const planData = PLANS[payment.plan];

        user.plan        = payment.plan;
        user.status      = 'verified';
        user.activatedAt = new Date();
        user.wallet.vaultRewardNaira += planData.vaultReward;

        // Credit referral bonuses
        if (user.referredBy) {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            const bonus = REFERRAL_BONUS.direct[payment.plan] || 2000;
            referrer.wallet.referralNaira += bonus;
            referrer.directReferrals.addToSet(user._id);
            await referrer.save({ validateBeforeSave: false });
          }
        }
        if (user.referredByLevel2) {
          const level2Referrer = await User.findById(user.referredByLevel2);
          if (level2Referrer) {
            const bonus = REFERRAL_BONUS.level2[payment.plan] || 400;
            level2Referrer.wallet.referralNaira += bonus;
            await level2Referrer.save({ validateBeforeSave: false });
          }
        }

        await user.save({ validateBeforeSave: false });
        console.log(`✅ User ${user.email} activated on ${payment.plan} plan`);
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// ── GET /api/payments/verify/:reference ──────────────────────
// Frontend polls this after redirect to confirm payment status
router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      reference: req.params.reference,
      user:      req.user._id
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    // Also check directly with Korapay
    const koraRes  = await fetch(
      `${process.env.KORAPAY_BASE_URL}/charges/${req.params.reference}`,
      { headers: { 'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}` } }
    );
    const koraData = await koraRes.json();

    res.json({
      success: true,
      status:  payment.status,
      plan:    payment.plan,
      korapay: koraData.data?.status
    });

  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

module.exports = router;
