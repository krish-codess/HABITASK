const express = require('express');
const router = express.Router();
const { getWeightLogs, addWeight, deleteWeight } = require('../controllers/weightController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWeightLogs);
router.post('/', addWeight);
router.delete('/:id', deleteWeight);

module.exports = router;
