const Payment = require('../models/Payment');
const User = require('../models/User');

const PLANS = {
  sterling: { naira: 7000, eur: 4.38, level1Bonus: 2000, level2Bonus: 400 },
  sovereign: { naira: 15000, eur: 9.38, level1Bonus: 4000, level2Bonus: 800 },
};

async function handleKorapayWebhook(req, res) {
  try {
    const { data } = req.body;

    if (!data || !data.reference) {
      return res.status(400).json({ success: false });
    }

    console.log('🔔 Webhook received:', data.reference, data.status);

    const payment = await Payment.findOne({ korapayReference: data.reference });
    if (!payment) {
      console.log('❌ Payment not found:', data.reference);
      return res.status(404).json({ success: false });
    }

    if (data.status === 'success') {
      payment.status = 'success';
      payment.webhookData = data;
      payment.completedAt = new Date();
      await payment.save();

      // Credit user and referrals
      const user = await User.findById(payment.userId);
      const planDetails = PLANS[payment.planType];

      // Activate plan
      user.planActivated = true;
      user.planType = payment.planType;
      user.planActivatedAt = new Date();
      user.balanceNaira += planDetails.naira; // Welcome bonus

      // Unlock streams
      const streams = [
        'Vault Lifestyle',
        'Vault Realtime',
        'Vault FaceTime',
        'Vault Works',
        'Vault Lingua',
        'Script2Cash',
      ];
      user.unlockedStreams = streams.map(name => ({ name, unlockedAt: new Date() }));

      // Credit referrals
      if (user.referredBy && !payment.referralBonusApplied) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          referrer.balanceNaira += planDetails.level1Bonus;
          referrer.level1Earnings += planDetails.level1Bonus;
          await referrer.save();
          console.log(`✅ L1 Bonus: ${referrer.email} +₦${planDetails.level1Bonus}`);
        }

        // Level 2
        if (referrer && referrer.referredBy) {
          const level2Referrer = await User.findById(referrer.referredBy);
          if (level2Referrer) {
            level2Referrer.balanceNaira += planDetails.level2Bonus;
            level2Referrer.level2Earnings += planDetails.level2Bonus;
            await level2Referrer.save();
            console.log(`✅ L2 Bonus: ${level2Referrer.email} +₦${planDetails.level2Bonus}`);
          }
        }

        payment.referralBonusApplied = true;
        payment.referrerBonusAmount = planDetails.level1Bonus;
        payment.level2BonusAmount = planDetails.level2Bonus;
      }

      await user.save();
      await payment.save();

      console.log(`✅ Payment processed: ${payment._id}, User: ${user.email}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).json({ success: false });
  }
}

module.exports = handleKorapayWebhook;
