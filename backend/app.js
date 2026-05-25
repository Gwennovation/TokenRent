/**
 * Express app factory — used by both local server.js (npm start) and
 * api/index.js (Vercel serverless). No app.listen() here.
 */
const path           = require('path');
const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const cookieParser   = require('cookie-parser');
const rateLimit      = require('express-rate-limit');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/error.middleware');

// --- App init ----------------------------------------------------------
const app = express();

// --- Connect MongoDB (idempotent — safe under serverless cold starts) ---
connectDB();

// --- Core middleware ---------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// --- Rate limiting on the API ------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down a bit.' },
});
app.use('/api', apiLimiter);

// --- Routes ------------------------------------------------------------
app.use('/auth',         require('./routes/auth.routes'));
app.use('/api/items',    require('./routes/items.routes'));
app.use('/api/rentals',  require('./routes/rentals.routes'));
app.use('/api/users',    require('./routes/users.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));

// --- Health check ------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// --- Static frontend (local dev only — Vercel handles this via routing) -
if (process.env.NODE_ENV !== 'production') {
  const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
  app.use(express.static(FRONTEND_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return next();
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
}

// --- Error handler (last) ----------------------------------------------
app.use(errorHandler);

module.exports = app;
