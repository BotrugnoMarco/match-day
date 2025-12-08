const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (or protected if you prefer)
router.get('/', matchController.getAllMatches);
router.get('/mine', authMiddleware, matchController.getUserMatches);
router.get('/:id', matchController.getMatchById);

// Protected routes
router.post('/', authMiddleware, matchController.createMatch);
router.post('/:id/join', authMiddleware, matchController.joinMatch);
router.post('/:id/leave', authMiddleware, matchController.leaveMatch);
router.put('/:id/status', authMiddleware, matchController.updateMatchStatus);
router.put('/:id/post-match', authMiddleware, matchController.updatePostMatchStatus);
router.post('/:id/invite', authMiddleware, matchController.inviteUser);
router.post('/:id/generate-teams', authMiddleware, matchController.generateTeams);

module.exports = router;
