const express    = require('express');
const { nanoid } = require('nanoid');
const { protect, activatedOnly } = require('../middleware/auth');
const User       = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

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

// ── POST /api/user/withdraw ──────────────────────────────────
router.post('/withdraw', protect, activatedOnly, async (req, res) => {
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

    // Exchange rate — hardcoded for now, replace with live rate API later
    const RATE        = 1600;    // ₦ per €1
    const amountNaira = Math.round(amountEur * RATE);

    // Deduct from wallet
    user.wallet.balanceEur    -= amountEur;
    user.wallet.totalWithdrawn += amountEur;
    await user.save({ validateBeforeSave: false });

    const withdrawal = await Withdrawal.create({
      user:          user._id,
      amountEur,
      amountNaira,
      exchangeRate:  RATE,
      bankName:      bank.bankName,
      accountNumber: bank.accountNumber,
      accountName:   bank.accountName,
      reference:     'WDR-' + nanoid(10).toUpperCase()
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Processing within 24–48 hours.',
      withdrawal
    });

  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, message: 'Withdrawal failed. Please try again.' });
  }
});

// ── GET /api/user/withdrawals ────────────────────────────────
router.get('/withdrawals', protect, async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.json({ success: true, withdrawals });
});

module.exports = router;
