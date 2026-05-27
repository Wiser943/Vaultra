const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email verification code for withdrawal
 */
async function sendWithdrawalVerificationEmail(email, fullName, code, expiresInMinutes = 15) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@vaultra.com',
      to: email,
      subject: 'VAULTRA Withdrawal Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Withdrawal Verification</h2>
          <p>Hi ${fullName},</p>
          <p>You requested to withdraw funds from your VAULTRA account. To proceed, please use the verification code below:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 2px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code expires in ${expiresInMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">© 2026 VAULTRA. All rights reserved.</p>
        </div>
      `
    });
    return result;
  } catch (err) {
    console.error('Resend email error:', err);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send referral bonus notification
 */
async function sendReferralBonusEmail(email, fullName, referrerName, bonusAmount, planName) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@vaultra.com',
      to: email,
      subject: 'VAULTRA Referral Bonus Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations!</h2>
          <p>Hi ${fullName},</p>
          <p><strong>${referrerName}</strong> just activated the <strong>${planName}</strong> plan using your referral link.</p>
          <p>You've earned a referral bonus of <strong>₦${bonusAmount.toLocaleString()}</strong>!</p>
          <p><a href="${process.env.FRONTEND_URL || process.env.APP_URL}/dashboard.html" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Your Dashboard</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">© 2026 VAULTRA. All rights reserved.</p>
        </div>
      `
    });
    return result;
  } catch (err) {
    console.error('Resend email error:', err);
    throw new Error('Failed to send referral email');
  }
}

/**
 * Send account activation confirmation
 */
async function sendActivationEmail(email, fullName, planName) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@vaultra.com',
      to: email,
      subject: 'VAULTRA Account Activated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Welcome to VAULTRA!</h2>
          <p>Hi ${fullName},</p>
          <p>Your account has been successfully activated on the <strong>${planName}</strong> plan.</p>
          <p>You can now start earning and manage your account from your dashboard.</p>
          <p><a href="${process.env.FRONTEND_URL || process.env.APP_URL}/dashboard.html" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">© 2026 VAULTRA. All rights reserved.</p>
        </div>
      `
    });
    return result;
  } catch (err) {
    console.error('Resend email error:', err);
    throw new Error('Failed to send activation email');
  }
}

module.exports = {
  sendWithdrawalVerificationEmail,
  sendReferralBonusEmail,
  sendActivationEmail
};
