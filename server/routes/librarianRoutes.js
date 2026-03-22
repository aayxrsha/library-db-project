const express = require('express');
const router = express.Router();
const librarianController = require('../controllers/librarianController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole('librarian', 'admin'));

router.get('/requests', librarianController.listRequests);
router.post('/requests/:requestId/issue', librarianController.issueRequestedBook);
router.post('/requests/:requestId/reject', librarianController.rejectRequest);
router.get('/fines', librarianController.listFines);
router.post('/fines', librarianController.addFine);

module.exports = router;
