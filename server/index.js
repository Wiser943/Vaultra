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
// CSP is intentionally disabled for now because the current frontend uses
// Google Fonts, inline styles, inline handlers, JSON-LD, and optional debug tools.
// Re-enable a stricter CSP after moving inline handlers/styles into external files.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:8888,http://localhost:3000,http://127.0.0.1:5500')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server calls, health checks, Postman/curl, and Korapay webhooks.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(cookieParser());

// Keep the Korapay webhook body raw for HMAC signature verification.
// All other routes should use JSON parsing.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  return express.json()(req, res, next);
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/admin',    require('./routes/admin'));

// ── Serve Frontend only when this backend is used as a single Render app ──
app.use(express.static(path.join(__dirname, '../public')));

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
  console.log(`VAULTRA server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.join(', ')}`);
});
