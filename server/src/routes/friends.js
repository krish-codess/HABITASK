const express = require('express');
const router = express.Router();
const { getFriends, sendRequest, getPendingRequests, acceptRequest, rejectRequest, unfriend } = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getFriends);
router.post('/request', sendRequest);
router.get('/requests/pending', getPendingRequests);
router.put('/request/:id/accept', acceptRequest);
router.put('/request/:id/reject', rejectRequest);
router.delete('/:id', unfriend);

module.exports = router;
