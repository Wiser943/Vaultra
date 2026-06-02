const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

const router = express.Router();

const KORAPAY_API_URL = 'https://api.korapay.com/merchant/api/v1';
const KORAPAY_PUBLIC_KEY = process.env.KORAPAY_PUBLIC_KEY;
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

const PLANS = {
  sterling: { naira: 7000, eur: 4.38, level1Bonus: 2000, level2Bonus: 400 },
  sovereign: { naira: 15000, eur: 9.38, level1Bonus: 4000, level2Bonus: 800 },
};

// INITIATE PAYMENT
router.post('/initiate', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const planDetails = PLANS[plan];

    // Create payment record
    const payment = new Payment({
      userId: user._id,
      planType: plan,
      amountNaira: planDetails.naira,
      amountEUR: planDetails.eur,
      status: 'pending',
    });

    await payment.save();

    // Call Korapay API
    try {
      const korapayResponse = await axios.post(
        `${KORAPAY_API_URL}/charges/initialize`,
        {
          amount: planDetails.naira * 100, // Amount in kobo
          currency: 'NGN',
          reference: `VAULTRA-${payment._id}`,
          customer: {
            email: user.email,
            name: user.fullName,
          },
          notification_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/payments/webhook`,
          merchant_bears_cost: false,
        },
        {
          headers: {
            Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (korapayResponse.data.status === 'success') {
        payment.korapayReference = korapayResponse.data.data.reference;
        payment.korapayCheckoutUrl = korapayResponse.data.data.checkout_url;
        await payment.save();

        return res.json({
          success: true,
          checkoutUrl: korapayResponse.data.data.checkout_url,
          reference: korapayResponse.data.data.reference,
        });
      }
    } catch (korapayErr) {
      console.error('Korapay error:', korapayErr.response?.data || korapayErr.message);
      return res.status(500).json({ success: false, message: 'Payment gateway error' });
    }
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// VERIFY PAYMENT
router.post('/verify/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ korapayReference: reference });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify with Korapay
    try {
      const verifyResponse = await axios.get(
        `${KORAPAY_API_URL}/charges/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
          },
        }
      );

      if (verifyResponse.data.data.status === 'success') {
        payment.status = 'success';
        payment.completedAt = new Date();
        await payment.save();

        // Credit user and apply referral bonuses
        await creditUserAndReferrals(payment);

        return res.json({
          success: true,
          message: 'Payment verified and account activated',
          payment: {
            status: payment.status,
            planType: payment.planType,
          },
        });
      }
    } catch (korapayErr) {
      console.error('Korapay verification error:', korapayErr.response?.data || korapayErr.message);
    }

    res.status(400).json({ success: false, message: 'Payment verification failed' });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// WEBHOOK (Korapay callback)
router.post('/webhook', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.reference) {
      return res.status(400).json({ success: false });
    }

    const payment = await Payment.findOne({ korapayReference: data.reference });
    if (!payment) {
      return res.status(404).json({ success: false });
    }

    if (data.status === 'success') {
      payment.status = 'success';
      payment.webhookData = data;
      payment.completedAt = new Date();
      await payment.save();

      // Credit user and referrals
      await creditUserAndReferrals(payment);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false });
  }
});

// Helper: Credit user and referrals
async function creditUserAndReferrals(payment) {
  try {
    const user = await User.findById(payment.userId);
    const planDetails = PLANS[payment.planType];

    // Activate plan and unlock streams
    user.planActivated = true;
    user.planType = payment.planType;
    user.planActivatedAt = new Date();
    user.balanceNaira += planDetails.naira; // Welcome bonus

    // Unlock all 6 task streams
    const streams = [
      'Vault Lifestyle',
      'Vault Realtime',
      'Vault FaceTime',
      'Vault Works',
      'Vault Lingua',
      'Script2Cash',
    ];
    user.unlockedStreams = streams.map(name => ({ name, unlockedAt: new Date() }));

    // Credit Level 1 referral
    if (user.referredBy && !payment.referralBonusApplied) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.balanceNaira += planDetails.level1Bonus;
        referrer.level1Earnings += planDetails.level1Bonus;
        await referrer.save();
      }

      // Credit Level 2 referral
      if (referrer && referrer.referredBy) {
        const level2Referrer = await User.findById(referrer.referredBy);
        if (level2Referrer) {
          level2Referrer.balanceNaira += planDetails.level2Bonus;
          level2Referrer.level2Earnings += planDetails.level2Bonus;
          await level2Referrer.save();
        }
      }

      payment.referralBonusApplied = true;
      payment.referrerBonusAmount = planDetails.level1Bonus;
      payment.level2BonusAmount = planDetails.level2Bonus;
    }

    await user.save();
    await payment.save();

    console.log(`✅ Payment processed: ${payment._id}, User: ${user.email}`);
  } catch (err) {
    console.error('Error crediting user:', err);
  }
}

module.exports = router;
