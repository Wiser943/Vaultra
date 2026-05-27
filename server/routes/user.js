const express    = require('express');
const { nanoid } = require('nanoid');
const { protect, activatedOnly } = require('../middleware/auth');
const User       = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const { sendWithdrawalVerificationEmail } = require('../utils/resend');

const router = express.Router();

// ── GET /api/user/dashboard ──────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('directReferrals', 'fullName email createdAt status plan');

  res.json({
    success: true,
    data: {
      user:           user.toSafeObject(),
      wallet:         user.wallet,
      directReferrals: user.directReferrals,
      referralCode:   user.referralCode,
      referralLink:   `${process.env.FRONTEND_URL || process.env.APP_URL}/signup.html?ref=${user.referralCode}`
    }
  });
});

// ── POST /api/user/bank ──────────────────────────────────────
router.post('/bank', protect, async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, makePrimary } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'Bank name, account number and account name are required.' });
    }

    const user = req.user;

    // If making primary, unset others
    if (makePrimary) {
      user.bankAccounts.forEach(b => b.isPrimary = false);
    }

    user.bankAccounts.push({
      bankName,
      accountNumber,
      accountName,
      isPrimary: makePrimary || user.bankAccounts.length === 0
    });

    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Bank account added.', bankAccounts: user.bankAccounts });

  } catch (err) {
    console.error('Add bank error:', err);
    res.status(500).json({ success: false, message: 'Could not save bank account.' });
  }
});

// ── POST /api/user/withdraw/request ──────────────────────────
// Step 1: Request withdrawal (generates verification code)
router.post('/withdraw/request', protect, activatedOnly, async (req, res) => {
  try {
    const { amountEur, bankAccountId } = req.body;
    const user = req.user;

    if (!amountEur || amountEur < 5) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is €5.' });
    }
    if (amountEur > user.wallet.balanceEur) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    const bank = user.bankAccounts.id(bankAccountId) || user.bankAccounts.find(b => b.isPrimary);
    if (!bank) {
      return res.status(400).json({ success: false, message: 'Please add a bank account first.' });
    }

    // Exchange rate
    const RATE        = 1600;    // ₦ per €1
    const amountNaira = Math.round(amountEur * RATE);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create withdrawal record (not yet committed)
    const withdrawal = await Withdrawal.create({
      user:          user._id,
      amountEur,
      amountNaira,
      exchangeRate:  RATE,
      bankName:      bank.bankName,
      accountNumber: bank.accountNumber,
      accountName:   bank.accountName,
      reference:     'WDR-' + nanoid(10).toUpperCase(),
      status:        'pending',
      emailVerified: false,
      verificationCode,
      verificationExpiry
    });

    // Send verification email
    try {
      await sendWithdrawalVerificationEmail(user.email, user.fullName, verificationCode, 15);
    } catch (emailErr) {
      console.warn('Could not send verification email:', emailErr.message);
      // Still return success so user can try to verify
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email. Please verify to proceed.',
      withdrawalId: withdrawal._id,
      maskedEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

  } catch (err) {
    console.error('Withdraw request error:', err);
    res.status(500).json({ success: false, message: 'Could not process withdrawal request.' });
  }
});

// ── POST /api/user/withdraw/verify ───────────────────────────
// Step 2: Verify code and commit withdrawal
router.post('/withdraw/verify', protect, activatedOnly, async (req, res) => {
  try {
    const { withdrawalId, code } = req.body;

    if (!withdrawalId || !code) {
      return res.status(400).json({ success: false, message: 'Withdrawal ID and code are required.' });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal || withdrawal.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }

    // Check code and expiry
    if (withdrawal.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
    if (new Date() > withdrawal.verificationExpiry) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
    }

    // Mark as verified and deduct from wallet
    withdrawal.emailVerified = true;
    withdrawal.verificationSentAt = new Date();
    await withdrawal.save();

    const user = req.user;
    user.wallet.balanceEur    -= withdrawal.amountEur;
    user.wallet.totalWithdrawn += withdrawal.amountEur;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Withdrawal verified. Processing within 24–48 hours.',
      withdrawal
    });

  } catch (err) {
    console.error('Withdraw verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

// ── POST /api/user/withdraw/resend ───────────────────────────
// Resend verification code
router.post('/withdraw/resend', protect, activatedOnly, async (req, res) => {
  try {
    const { withdrawalId } = req.body;

    if (!withdrawalId) {
      return res.status(400).json({ success: false, message: 'Withdrawal ID is required.' });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal || withdrawal.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }

    if (withdrawal.emailVerified) {
      return res.status(400).json({ success: false, message: 'Withdrawal already verified.' });
    }

    // Resend email
    try {
      await sendWithdrawalVerificationEmail(req.user.email, req.user.fullName, withdrawal.verificationCode, 15);
    } catch (emailErr) {
      console.warn('Could not resend verification email:', emailErr.message);
    }

    withdrawal.verificationSentAt = new Date();
    await withdrawal.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Verification code resent to your email.'
    });

  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ success: false, message: 'Could not resend code.' });
  }
});

// ── GET /api/user/withdrawals ────────────────────────────────
router.get('/withdrawals', protect, async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.json({ success: true, withdrawals });
});

module.exports = router;
