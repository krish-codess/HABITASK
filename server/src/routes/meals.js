const express = require('express');
const router = express.Router();
const { getMeals, addFoodToMeal, removeMealEntry, getDailyCalories, getCalorieTrend } = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getMeals);
router.post('/add', addFoodToMeal);
router.delete('/entry/:id', removeMealEntry);
router.get('/calories/daily', getDailyCalories);
router.get('/calories/trend', getCalorieTrend);

module.exports = router;
