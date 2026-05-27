const express  = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const User     = require('../models/User');
const Payment  = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const { activateUserAfterPayment, PLANS } = require('../utils/referralService');

const router = express.Router();

// All admin routes require auth + admin flag
router.use(protect, adminOnly);

// ── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (req, res) => {
  const { status, plan, page = 1 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (plan)   filter.plan   = plan;

  const users = await User.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * 50)
    .limit(50)
    .select('-password');

  const total = await User.countDocuments(filter);

  res.json({ success: true, users, total, page: Number(page) });
});

// ── POST /api/admin/verify/:userId ───────────────────────────
// Manually activate a user (e.g. after manual bank transfer confirmation)
router.post('/verify/:userId', async (req, res) => {
  try {
    const { plan } = req.body;    // 'sterling', 'sovereign', or 'lifestyle'
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.status === 'verified') {
      return res.status(400).json({ success: false, message: 'User already verified.' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: `Invalid plan: ${plan}` });
    }

    // Use referral service for consistent activation
    await activateUserAfterPayment(user, plan);

    res.json({ success: true, message: `User ${user.email} verified on ${plan} plan.`, user: user.toSafeObject() });

  } catch (err) {
    console.error('Admin verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

// ── GET /api/admin/payments ──────────────────────────────────
router.get('/payments', async (req, res) => {
  const payments = await Payment.find()
    .sort('-createdAt')
    .limit(100)
    .populate('user', 'fullName email');

  res.json({ success: true, payments });
});

// ── GET /api/admin/withdrawals ───────────────────────────────
router.get('/withdrawals', async (req, res) => {
  const { status, page = 1 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const withdrawals = await Withdrawal.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * 50)
    .limit(50)
    .populate('user', 'fullName email');

  const total = await Withdrawal.countDocuments(filter);

  res.json({ success: true, withdrawals, total, page: Number(page) });
});

// ── POST /api/admin/withdrawal/:withdrawalId/process ────────
// Mark withdrawal as processed
router.post('/withdrawal/:withdrawalId/process', async (req, res) => {
  try {
    const { status, note } = req.body;  // status: 'completed' or 'failed'

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.withdrawalId,
      {
        status,
        processedAt: new Date(),
        note: note || ''
      },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }

    res.json({ success: true, message: `Withdrawal marked as ${status}.`, withdrawal });

  } catch (err) {
    console.error('Process withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Could not process withdrawal.' });
  }
});

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ status: 'verified' });
    const totalPayments = await Payment.countDocuments({ status: 'success' });
    const totalWithdrawals = await Withdrawal.countDocuments({ status: 'completed' });

    const paymentSum = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const withdrawalSum = await Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountNaira' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        totalPayments,
        totalWithdrawals,
        totalPaymentAmount: paymentSum[0]?.total || 0,
        totalWithdrawalAmount: withdrawalSum[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch stats.' });
  }
});

module.exports = router;
