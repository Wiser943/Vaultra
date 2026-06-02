const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, phone, niche, referralCode } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      phone,
      niche: niche || 'lifestyle',
    });

    // Generate referral code
    user.generateReferralCode();

    // Handle referral
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
        referrer.level1Referrals.push(user._id);

        // Add to referrer's referrer's level 2
        if (referrer.referredBy) {
          const level2Referrer = await User.findById(referrer.referredBy);
          if (level2Referrer) {
            level2Referrer.level2Referrals.push(user._id);
            await level2Referrer.save();
          }
        }

        await referrer.save();
      }
    }

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

// SIGNIN
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        planActivated: user.planActivated,
      },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ success: false, message: 'Signin failed' });
  }
});

// GET PROFILE
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('referredBy', 'fullName email')
      .populate('level1Referrals', 'fullName email')
      .populate('level2Referrals', 'fullName email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        niche: user.niche,
        referralCode: user.referralCode,
        balanceEUR: user.balanceEUR,
        balanceNaira: user.balanceNaira,
        planActivated: user.planActivated,
        planType: user.planType,
        level1Count: user.level1Referrals.length,
        level2Count: user.level2Referrals.length,
        level1Earnings: user.level1Earnings,
        level2Earnings: user.level2Earnings,
        bankAccounts: user.bankAccounts,
      },
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

module.exports = router;
