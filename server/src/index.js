require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HabiTask server running on port ${PORT}`);
});
