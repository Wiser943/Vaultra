const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect routes — requires valid JWT ──────────────────────
exports.protect = async (req, res, next) => {
  try {
    // Accept token from cookie OR Authorization header
    let token = req.cookies?.vaultra_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please sign in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
  }
};

// ── Admin only ───────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// ── Verified users only (plan activated) ─────────────────────
exports.activatedOnly = (req, res, next) => {
  if (req.user?.status !== 'verified') {
    return res.status(403).json({ success: false, message: 'Account not yet activated. Please complete your Vault Fee payment.' });
  }
  next();
};
