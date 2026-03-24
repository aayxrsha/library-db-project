const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/issueController');
const { verifyToken, requireRole, requireUserType } = require('../middleware/auth');

router.get('/',             verifyToken, ctrl.getAll);
router.get('/overdue',      verifyToken, ctrl.getOverdue);
router.get('/requests',     verifyToken, ctrl.getRequests);
router.post('/requests',    verifyToken, requireUserType('member'), ctrl.requestIssue);
router.patch('/requests/:id/approve', verifyToken, requireRole('Admin','Librarian'), ctrl.approveRequest);
router.patch('/requests/:id/reject',  verifyToken, requireRole('Admin','Librarian'), ctrl.rejectRequest);
router.post('/',            verifyToken, requireRole('Admin','Librarian','Clerk'), ctrl.create);
router.patch('/:id/return', verifyToken, requireRole('Admin','Librarian','Clerk'), ctrl.returnBook);

module.exports = router;
