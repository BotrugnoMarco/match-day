const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/', authMiddleware, voteController.submitVote);
router.get('/match/:matchId', authMiddleware, voteController.getMatchVotes);
router.get('/match/:matchId/mine', authMiddleware, voteController.getMyVotes);
router.get('/match/:matchId/comments', authMiddleware, voteController.getMyReceivedComments);
router.get('/match/:matchId/stats', authMiddleware, voteController.getVoteStats);

module.exports = router;
