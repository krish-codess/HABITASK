const express = require('express');
const router = express.Router();
const { getWater, addWater, deleteWater } = require('../controllers/waterController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWater);
router.post('/', addWater);
router.delete('/:id', deleteWater);

module.exports = router;
