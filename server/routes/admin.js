const express  = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const User     = require('../models/User');
const Payment  = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');

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
    const { plan } = req.body;    // 'sterling' or 'sovereign'
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.status === 'verified') {
      return res.status(400).json({ success: false, message: 'User already verified.' });
    }

    const vaultRewards = { sterling: 7000, sovereign: 15000 };

    user.plan        = plan || 'sterling';
    user.status      = 'verified';
    user.activatedAt = new Date();
    user.wallet.vaultRewardNaira += vaultRewards[user.plan] || 7000;
    await user.save({ validateBeforeSave: false });

    // Credit referrer if applicable
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const bonus = user.plan === 'sovereign' ? 4000 : 2000;
        referrer.wallet.referralNaira += bonus;
        referrer.directReferrals.addToSet(user._id);
        await referrer.save({ validateBeforeSave: false });
      }
    }
    if (user.referredByLevel2) {
      const l2 = await User.findById(user.referredByLevel2);
      if (l2) {
        l2.wallet.referralNaira += user.plan === 'sovereign' ? 800 : 400;
        await l2.save({ validateBeforeSave: false });
      }
    }

    res.json({ success: true, message: `User ${user.email} verified on ${user.plan} plan.`, user: user.toSafeObject() });

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
    .populate('user', 'fullName email phone');
  res.json({ success: true, payments });
});

// ── GET /api/admin/withdrawals ───────────────────────────────
router.get('/withdrawals', async (req, res) => {
  const withdrawals = await Withdrawal.find({ status: 'pending' })
    .sort('-createdAt')
    .populate('user', 'fullName email');
  res.json({ success: true, withdrawals });
});

// ── POST /api/admin/withdrawals/:id/process ──────────────────
router.post('/withdrawals/:id/process', async (req, res) => {
  try {
    const wd = await Withdrawal.findById(req.params.id);
    if (!wd) return res.status(404).json({ success: false, message: 'Withdrawal not found.' });

    wd.status      = req.body.status || 'completed';
    wd.processedAt = new Date();
    wd.note        = req.body.note || '';
    await wd.save();

    res.json({ success: true, message: 'Withdrawal updated.', withdrawal: wd });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  const [totalUsers, verified, sterling, sovereign, pendingWithdrawals] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'verified' }),
    User.countDocuments({ plan: 'sterling' }),
    User.countDocuments({ plan: 'sovereign' }),
    Withdrawal.countDocuments({ status: 'pending' })
  ]);

  res.json({
    success: true,
    stats: { totalUsers, verified, sterling, sovereign, pendingWithdrawals }
  });
});

module.exports = router;
