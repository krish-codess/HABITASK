const express = require('express');
const router = express.Router();
const { getWorkouts, createWorkout, deleteWorkout, getWeeklySummary } = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWorkouts);
router.post('/', createWorkout);
router.delete('/:id', deleteWorkout);
router.get('/summary/weekly', getWeeklySummary);

module.exports = router;
