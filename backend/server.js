/**
 * RailWayPro — Backend Server
 * Production-ready Express server with 15 hardening features
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const rateLimit  = require('express-rate-limit');

const pool           = require('./config/db');
const authRoutes     = require('./routes/authRoutes');
const trainRoutes    = require('./routes/trainRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production, set FRONTEND_URL in .env to lock down origins.
// In development, all origins are allowed.
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// ─── BODY PARSER ──────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── REQUEST TIMEOUT (Hardening #12) ──────────────────────────────────────────
// If any request hangs for > 10 seconds (e.g., DB stall), return 503.
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    res.status(503).json({ success: false, message: 'Request timeout. Please try again.' });
  });
  next();
});

// ─── RATE LIMITING (Hardening #11) ────────────────────────────────────────────
// 100 requests per 15-minute window per IP — prevents brute-force attacks.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});
app.use(limiter);

// ─── HEALTH CHECK (Hardening #6) ──────────────────────────────────────────────
// Used by Render, Railway, and other cloud providers to verify the server is alive.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'RailWayPro API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api', bookingRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── GLOBAL ERROR HANDLER (Hardening #1) ──────────────────────────────────────
// Must be the LAST middleware registered.
app.use(errorMiddleware);

// ─── START SERVER ─────────────────────────────────────────────────────────────
// Hardening #15: Test DB connection on startup. Exit gracefully if DB is unreachable.
pool.getConnection()
  .then((conn) => {
    conn.release();
    console.log('✅ Database connected successfully.');

    app.listen(PORT, () => {
      console.log(`🚂 RailWayPro API running on port ${PORT}`);
      console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
