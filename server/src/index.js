require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const habitRoutes = require('./routes/habits');
const workoutRoutes = require('./routes/workouts');
const mealRoutes = require('./routes/meals');
const foodRoutes = require('./routes/foods');
const barcodeRoutes = require('./routes/barcode');
const friendRoutes = require('./routes/friends');
const feedRoutes = require('./routes/feed');
const voteRoutes = require('./routes/votes');
const waterRoutes = require('./routes/water');
const weightRoutes = require('./routes/weight');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Vercel preview/production deployment for this project
  if (/^https:\/\/habitask.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HabiTask server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
