const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const { auth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// INITIATE WITHDRAWAL
router.post('/initiate', auth, async (req, res) => {
  try {
    const { amountEUR } = req.body;

    if (!amountEUR || amountEUR < 5) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is €5' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.balanceEUR < amountEUR) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    if (!user.bankAccounts || user.bankAccounts.length === 0) {
      return res.status(400).json({ success: false, message: 'No bank account added' });
    }

    // Get primary bank account
    const primaryBank = user.bankAccounts.find(b => b.isPrimary) || user.bankAccounts[0];

    // Create withdrawal record
    const amountNaira = Math.round(amountEUR * 1600);
    const withdrawal = new Withdrawal({
      userId: user._id,
      amountEUR,
      amountNaira,
      bankName: primaryBank.bankName,
      accountNumber: primaryBank.accountNumber,
      accountName: primaryBank.accountName,
    });

    // Generate verification code
    const code = Math.random().toString().slice(2, 8);
    withdrawal.emailVerificationCode = code;
    withdrawal.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await withdrawal.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.fullName, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      withdrawalId: withdrawal._id,
    });
  } catch (err) {
    console.error('Withdrawal initiation error:', err);
    res.status(500).json({ success: false, message: 'Withdrawal initiation failed' });
  }
});

// VERIFY EMAIL CODE
router.post('/verify', auth, async (req, res) => {
  try {
    const { withdrawalId, code } = req.body;

    if (!withdrawalId || !code) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    // Check if code is valid and not expired
    if (withdrawal.emailVerificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (new Date() > withdrawal.emailVerificationExpires) {
      return res.status(400).json({ success: false, message: 'Verification code expired' });
    }

    // Mark as verified
    withdrawal.emailVerified = true;
    withdrawal.status = 'processing';
    await withdrawal.save();

    // Deduct from user balance
    const user = await User.findById(req.userId);
    user.balanceEUR -= withdrawal.amountEUR;
    user.balanceNaira -= withdrawal.amountNaira;
    await user.save();

    res.json({
      success: true,
      message: 'Withdrawal verified. Processing will complete in 24-48 hours',
      withdrawal: {
        id: withdrawal._id,
        amountEUR: withdrawal.amountEUR,
        amountNaira: withdrawal.amountNaira,
        status: withdrawal.status,
        reference: withdrawal.reference,
      },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// GET WITHDRAWAL HISTORY
router.get('/history', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        amountEUR: w.amountEUR,
        amountNaira: w.amountNaira,
        status: w.status,
        bankName: w.bankName,
        reference: w.reference,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
      })),
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// ADD BANK ACCOUNT
router.post('/add-bank', auth, async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, makePrimary } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If making primary, unset other primaries
    if (makePrimary) {
      user.bankAccounts.forEach(b => b.isPrimary = false);
    }

    user.bankAccounts.push({
      bankName,
      accountNumber,
      accountName,
      isPrimary: makePrimary || user.bankAccounts.length === 0,
    });

    await user.save();

    res.json({
      success: true,
      message: 'Bank account added successfully',
      bankAccounts: user.bankAccounts,
    });
  } catch (err) {
    console.error('Add bank error:', err);
    res.status(500).json({ success: false, message: 'Failed to add bank account' });
  }
});

module.exports = router;
