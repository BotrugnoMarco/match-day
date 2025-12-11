const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, supportController.createTicket);
router.get('/', authMiddleware, supportController.getUserTickets);

module.exports = router;
