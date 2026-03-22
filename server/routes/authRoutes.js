const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register-member', authController.registerMember);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
