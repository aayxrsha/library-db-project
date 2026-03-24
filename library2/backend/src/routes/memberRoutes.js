// memberRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/memberController');
const { verifyToken, requireRole, requireUserType } = require('../middleware/auth');

router.get('/me/profile',              verifyToken, requireUserType('member'),           ctrl.getMyProfile);
router.get('/',                      verifyToken, ctrl.getAll);
router.get('/:id',                   verifyToken, ctrl.getById);
router.get('/:id/issues',            verifyToken, ctrl.getActiveIssues);
router.post('/',                     verifyToken, requireRole('Admin'), ctrl.create);
router.put('/:id',                   verifyToken, requireRole('Admin'), ctrl.update);
router.delete('/:id',                verifyToken, requireRole('Admin'),                     ctrl.remove);

module.exports = router;
