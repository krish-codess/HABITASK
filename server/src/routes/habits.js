const express = require('express');
const router = express.Router();
const { getHabits, createHabit, updateHabit, deleteHabit, getLogs, toggleLog, getHeatmap, getStreak } = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.get('/logs', getLogs);
router.post('/logs/:habitId/toggle', toggleLog);
router.get('/heatmap', getHeatmap);
router.get('/:id/streak', getStreak);

module.exports = router;
