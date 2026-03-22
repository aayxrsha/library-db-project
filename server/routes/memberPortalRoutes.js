const express = require('express');
const router = express.Router();
const memberPortalController = require('../controllers/memberPortalController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole('member'));

router.get('/books', memberPortalController.listBooksForMember);
router.post('/requests', memberPortalController.createRequest);
router.get('/requests', memberPortalController.listMyRequests);
router.get('/fines', memberPortalController.listMyFines);

module.exports = router;
