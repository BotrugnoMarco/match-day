const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/request', authMiddleware, friendController.sendRequest);
router.put('/accept/:id', authMiddleware, friendController.acceptRequest);
router.put('/reject/:id', authMiddleware, friendController.rejectRequest);
router.get('/', authMiddleware, friendController.getFriends);
router.get('/pending', authMiddleware, friendController.getPendingRequests);
router.get('/status/:userId', authMiddleware, friendController.getFriendshipStatus);
router.delete('/:friendId', authMiddleware, friendController.removeFriend);

module.exports = router;
