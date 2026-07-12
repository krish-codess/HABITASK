const express = require('express');
const router = express.Router();
const { scanBarcode, addScannedToFoods } = require('../controllers/barcodeController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:code', scanBarcode);
router.post('/add', addScannedToFoods);

module.exports = router;
