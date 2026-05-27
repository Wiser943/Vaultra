const User = require('../models/User');
const { sendReferralBonusEmail, sendActivationEmail } = require('./resend');

// Plan configuration with Lifestyle support
const PLANS = {
  sterling: {
    label: 'Sterling Plan',
    amountNaira: 7000,
    vaultReward: 7000,
  },
  sovereign: {
    label: 'Sovereign Plan',
    amountNaira: 15000,
    vaultReward: 15000,
  },
  lifestyle: {
    label: 'Vaultra Lifestyle Plan',
    amountNaira: 5000,
    vaultReward: 5000,
  }
};

// Referral bonus amounts (₦)
const REFERRAL_BONUS = {
  direct: { sterling: 2000, sovereign: 4000, lifestyle: 1000 },
  level2: { sterling: 400, sovereign: 800, lifestyle: 200 },
};

/**
 * Credit referral bonuses to direct and level-2 referrers
 * Called after user activation
 */
async function creditReferralBonuses(user, planName) {
  try {
    // Credit direct referrer (level 1)
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const bonus = REFERRAL_BONUS.direct[planName] || 1000;
        referrer.wallet.referralNaira += bonus;
        referrer.directReferrals.addToSet(user._id);
        await referrer.save({ validateBeforeSave: false });
        
        // Send email notification to referrer
        try {
          await sendReferralBonusEmail(
            referrer.email,
            referrer.fullName,
            user.fullName,
            bonus,
            PLANS[planName].label
          );
        } catch (emailErr) {
          console.warn('Could not send referral email to', referrer.email, emailErr.message);
        }
      }
    }

    // Credit level-2 referrer
    if (user.referredByLevel2) {
      const level2Referrer = await User.findById(user.referredByLevel2);
      if (level2Referrer) {
        const bonus = REFERRAL_BONUS.level2[planName] || 200;
        level2Referrer.wallet.referralNaira += bonus;
        await level2Referrer.save({ validateBeforeSave: false });
        
        // Send email notification to level-2 referrer
        try {
          await sendReferralBonusEmail(
            level2Referrer.email,
            level2Referrer.fullName,
            user.fullName,
            bonus,
            PLANS[planName].label
          );
        } catch (emailErr) {
          console.warn('Could not send referral email to', level2Referrer.email, emailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Error crediting referral bonuses:', err);
    throw err;
  }
}

/**
 * Activate user after successful payment
 * Handles vault reward, referral bonuses, and email notifications
 */
async function activateUserAfterPayment(user, planName) {
  try {
    const planData = PLANS[planName];
    if (!planData) throw new Error(`Invalid plan: ${planName}`);

    user.plan = planName;
    user.status = 'verified';
    user.activatedAt = new Date();
    user.wallet.vaultRewardNaira += planData.vaultReward;
    await user.save({ validateBeforeSave: false });

    // Credit referral bonuses
    await creditReferralBonuses(user, planName);

    // Send activation email
    try {
      await sendActivationEmail(user.email, user.fullName, planData.label);
    } catch (emailErr) {
      console.warn('Could not send activation email to', user.email, emailErr.message);
    }

    console.log(`✅ User ${user.email} activated on ${planName} plan`);
    return user;
  } catch (err) {
    console.error('Error activating user:', err);
    throw err;
  }
}

module.exports = {
  PLANS,
  REFERRAL_BONUS,
  creditReferralBonuses,
  activateUserAfterPayment
};
