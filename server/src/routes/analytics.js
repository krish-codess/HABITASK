const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSummary, getHeatmap, getInsights } = require('../controllers/analyticsController');

router.get('/summary', protect, getSummary);
router.get('/heatmap', protect, getHeatmap);
router.get('/insights', protect, getInsights);

module.exports = router;
