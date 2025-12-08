const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', authMiddleware, userController.getProfile);
router.get('/stats', authMiddleware, userController.getUserStats);
router.get('/history', authMiddleware, userController.getMatchHistory);
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/:id/profile', authMiddleware, userController.getUserProfileById);
router.get('/:id/stats', authMiddleware, userController.getUserStatsById);
router.get('/:id/history', authMiddleware, userController.getUserHistoryById);
router.put('/status', authMiddleware, userController.updateStatus);
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
