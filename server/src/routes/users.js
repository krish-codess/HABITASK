const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateGoals, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/goals', updateGoals);
router.get('/search', searchUsers);

module.exports = router;
