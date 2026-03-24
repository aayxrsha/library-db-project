const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/fineController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/',                        verifyToken, ctrl.getAll);
router.get('/unpaid',                  verifyToken, ctrl.getUnpaid);
router.get('/member/:memberId',        verifyToken, ctrl.getByMember);
router.post('/',                       verifyToken, requireRole('Admin','Librarian','Clerk'), ctrl.create);
router.patch('/:id/pay',               verifyToken, requireRole('Admin','Librarian','Clerk'), ctrl.markPaid);

module.exports = router;
