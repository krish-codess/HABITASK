const express = require('express');
const router = express.Router();
const { getFeed, getLeaderboard } = require('../controllers/feedController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getFeed);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
