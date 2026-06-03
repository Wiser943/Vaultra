const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const { adminAuth, requirePermission } = require('../middleware/adminAuth');

const router = express.Router();

// ===== ADMIN AUTH =====

// ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account is inactive' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email,
        role: admin.role,
        isAdmin: true 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET ADMIN PROFILE
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// ===== DASHBOARD ANALYTICS =====

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Total payments
    const totalPayments = await Payment.countDocuments({ status: 'success' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amountNaira' } } }
    ]);

    // Pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const processingWithdrawals = await Withdrawal.countDocuments({ status: 'processing' });

    // Recent payments
    const recentPayments = await Payment.find({ status: 'success' })
      .populate('userId', 'fullName email')
      .sort({ completedAt: -1 })
      .limit(10);

    // Recent withdrawals
    const recentWithdrawals = await Withdrawal.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Top referrers
    const topReferrers = await User.find({ level1Referrals: { $exists: true, $ne: [] } })
      .select('fullName email level1Referrals level1Earnings level2Earnings')
      .sort({ level1Earnings: -1 })
      .limit(10);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingWithdrawals,
        processingWithdrawals,
        recentPayments: recentPayments.map(p => ({
          id: p._id,
          user: p.userId?.fullName || 'Unknown',
          plan: p.planType,
          amount: p.amountNaira,
          status: p.status,
          date: p.completedAt,
        })),
        recentWithdrawals: recentWithdrawals.map(w => ({
          id: w._id,
          amount: w.amountEUR,
          status: w.status,
          reference: w.reference,
          date: w.createdAt,
        })),
        topReferrers: topReferrers.map(u => ({
          id: u._id,
          name: u.fullName,
          email: u.email,
          referrals: u.level1Referrals.length,
          earnings: u.level1Earnings + u.level2Earnings,
        })),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// ===== USER MANAGEMENT =====

router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('fullName email phone niche planActivated planType balanceEUR balanceNaira createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('referredBy', 'fullName email')
      .populate('level1Referrals', 'fullName email')
      .populate('level2Referrals', 'fullName email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

router.put('/users/:userId', adminAuth, requirePermission('manage_users'), async (req, res) => {
  try {
    const { balanceEUR, balanceNaira, planActivated } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (balanceEUR !== undefined) user.balanceEUR = balanceEUR;
    if (balanceNaira !== undefined) user.balanceNaira = balanceNaira;
    if (planActivated !== undefined) user.planActivated = planActivated;

    await user.save();

    res.json({ success: true, message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// ===== PAYMENT MANAGEMENT =====

router.get('/payments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate('userId', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments();

    res.json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        user: p.userId?.fullName || 'Unknown',
        email: p.userId?.email,
        plan: p.planType,
        amount: p.amountNaira,
        status: p.status,
        reference: p.korapayReference,
        date: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// ===== WITHDRAWAL MANAGEMENT =====

router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Withdrawal.countDocuments();

    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        amount: w.amountEUR,
        amountNaira: w.amountNaira,
        status: w.status,
        reference: w.reference,
        bankName: w.bankName,
        accountNumber: w.accountNumber,
        emailVerified: w.emailVerified,
        date: w.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

router.put('/withdrawals/:withdrawalId/status', adminAuth, requirePermission('manage_payments'), async (req, res) => {
  try {
    const { status } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    withdrawal.status = status;
    if (status === 'completed') {
      withdrawal.completedAt = new Date();
    }

    await withdrawal.save();

    res.json({ success: true, message: 'Withdrawal status updated', withdrawal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update withdrawal' });
  }
});

module.exports = router;
