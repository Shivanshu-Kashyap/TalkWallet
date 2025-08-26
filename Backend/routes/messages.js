const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/groups/:id/messages
router.get('/:id/messages', auth, messageController.getMessages);

module.exports = router;
