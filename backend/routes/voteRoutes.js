const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/', authMiddleware, voteController.submitVote);
router.get('/match/:matchId', authMiddleware, voteController.getMatchVotes);

module.exports = router;
