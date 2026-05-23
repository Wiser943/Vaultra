require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const connectDB    = require('../config/db');

const app = express();

// ── Connect Database ─────────────────────────────────────────
connectDB();

// ── Security & Middleware ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'", "https://api.korapay.com"]
    }
  }
}));

app.use(cors({
  origin:      process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// ── Webhook route needs raw body — must come BEFORE express.json ──
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/user',  require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// ── Serve Frontend ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback — all unknown routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 VAULTRA server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   URL:  http://localhost:${PORT}`);
});
