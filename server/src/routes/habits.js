const express = require('express');
const router = express.Router();
const { getHabits, createHabit, updateHabit, deleteHabit, getLogs, toggleLog, getHeatmap, getStreak } = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Static routes first
router.get('/logs', getLogs);
router.get('/heatmap', getHeatmap);
router.post('/logs/:habitId/toggle', toggleLog);

// Collection
router.get('/', getHabits);
router.post('/', createHabit);

// Dynamic routes last
router.get('/:id/streak', getStreak);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
