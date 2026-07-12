const express = require('express');
const router = express.Router();
const { searchFoods, getFoodById, createCustomFood } = require('../controllers/foodController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/search', searchFoods);
router.get('/:id', getFoodById);
router.post('/', createCustomFood);

module.exports = router;
