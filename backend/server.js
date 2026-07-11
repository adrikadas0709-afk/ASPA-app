require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const path         = require('path');
const rateLimit    = require('express-rate-limit');
const connectDB    = require('./config/db');

// ── Routes ────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const audioRoutes   = require('./routes/audio');
const aiRoutes      = require('./routes/ai');
const filterRoutes  = require('./routes/filter');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect DB ────────────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: { success: false, message: 'AI rate limit reached. Wait 1 minute.' },
});

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audio',    audioRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/filter',   filterRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ASPA API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'development') console.error('🔴 Error:', err);
  res.status(status).json({ success: false, message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ASPA API server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
