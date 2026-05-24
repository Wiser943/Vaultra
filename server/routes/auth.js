const express   = require('express');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User      = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes.' }
});

// ── Helper: sign JWT & set cookie ────────────────────────────
function signToken(userId, res) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  res.cookie('vaultra_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
  });
  return token;
}

// ── POST /api/auth/signup ────────────────────────────────────
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { fullName, email, phone, password, niche, referralCode } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Handle referral
    let referredBy     = null;
    let referredByLevel2 = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
        // Level 2 — if referrer was also referred by someone
        if (referrer.referredBy) referredByLevel2 = referrer.referredBy;
      }
    }

    const user = await User.create({
      fullName, email, phone, password,
      niche: niche || 'lifestyle',
      referredBy,
      referredByLevel2
    });

    signToken(user._id, res);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: user.toSafeObject()
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ── POST /api/auth/signin ────────────────────────────────────
router.post('/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    signToken(user._id, res);

    res.json({
      success: true,
      message: 'Signed in successfully!',
      user: user.toSafeObject()
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ── GET /api/auth/me — get current user ──────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// ── POST /api/auth/signout ───────────────────────────────────
router.post('/signout', (req, res) => {
  res.clearCookie('vaultra_token');
  res.json({ success: true, message: 'Signed out.' });
});

module.exports = router;
