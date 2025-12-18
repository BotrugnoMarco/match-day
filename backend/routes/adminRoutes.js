const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/matches', adminController.getMatches);
router.delete('/matches/:id', adminController.deleteMatch);

router.get('/votes', adminController.getVotes);
router.delete('/votes/:id', adminController.deleteVote);

router.get('/friendships', adminController.getFriendships);
router.delete('/friendships/:id', adminController.deleteFriendship);

router.get('/participants', adminController.getParticipants);
router.delete('/participants/:id', adminController.deleteParticipant);

router.get('/notifications', adminController.getNotifications);
router.delete('/notifications/:id', adminController.deleteNotification);

module.exports = router;
