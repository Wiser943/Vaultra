const axios = require('axios');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendVerificationEmail(email, fullName, code) {
  try {
    if (!RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not set. Verification code:', code);
      return { success: true, message: 'Email sending skipped (no API key)' };
    }

    const response = await axios.post(
      RESEND_API_URL,
      {
        from: 'noreply@vaultra.com',
        to: email,
        subject: 'Your VAULTRA Withdrawal Verification Code',
        html: `
          <h2>Withdrawal Verification</h2>
          <p>Hi ${fullName},</p>
          <p>Your verification code is:</p>
          <h1 style="color: #c9a84c; font-size: 32px; letter-spacing: 4px;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br/>VAULTRA Team</p>
        `,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email sending error:', err.response?.data || err.message);
    // Don't throw - allow withdrawal to proceed even if email fails
    return { success: false, error: err.message };
  }
}

async function sendPaymentConfirmation(email, fullName, planType, amount) {
  try {
    if (!RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not set. Skipping confirmation email.');
      return { success: true };
    }

    const response = await axios.post(
      RESEND_API_URL,
      {
        from: 'noreply@vaultra.com',
        to: email,
        subject: 'Payment Confirmation - VAULTRA Account Activated',
        html: `
          <h2>Welcome to VAULTRA!</h2>
          <p>Hi ${fullName},</p>
          <p>Your ${planType} plan has been activated successfully!</p>
          <p><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
          <p>You now have access to all 6 task streams and can start earning immediately.</p>
          <p>Best regards,<br/>VAULTRA Team</p>
        `,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Payment confirmation email sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Confirmation email error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPaymentConfirmation,
};
