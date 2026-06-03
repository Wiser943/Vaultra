const express = require('express');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET DASHBOARD STATS
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('level1Referrals', 'fullName email')
      .populate('level2Referrals', 'fullName email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get recent withdrawals
    const recentWithdrawals = await Withdrawal.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get task streams
    const taskStreams = [
      { name: 'Vault Lifestyle', rate: '€2/hr', unlocked: user.planActivated },
      { name: 'Vault Realtime', rate: '€2/hr', unlocked: user.planActivated },
      { name: 'Vault FaceTime', rate: '€2/hr', unlocked: user.planActivated },
      { name: 'Vault Works', rate: '€2/hr', unlocked: user.planActivated },
      { name: 'Vault Lingua', rate: '€2/hr', unlocked: user.planActivated },
      { name: 'Script2Cash', rate: '€2/hr', unlocked: user.planActivated },
    ];

    res.json({
      success: true,
      dashboard: {
        user: {
          fullName: user.fullName,
          email: user.email,
          planActivated: user.planActivated,
          planType: user.planType,
          referralCode: user.referralCode,
          bankAccounts: user.bankAccounts,
        },
        wallet: {
          balanceEUR: user.balanceEUR,
          balanceNaira: user.balanceNaira,
          totalEarned: user.balanceEUR + user.balanceNaira / 1600,
        },
        referrals: {
          level1: {
            count: user.level1Referrals.length,
            earnings: user.level1Earnings,
            referrals: user.level1Referrals,
          },
          level2: {
            count: user.level2Referrals.length,
            earnings: user.level2Earnings,
            referrals: user.level2Referrals,
          },
        },
        taskStreams,
        recentWithdrawals: recentWithdrawals.map(w => ({
          id: w._id,
          amountEUR: w.amountEUR,
          amountNaira: w.amountNaira,
          status: w.status,
          reference: w.reference,
          createdAt: w.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
