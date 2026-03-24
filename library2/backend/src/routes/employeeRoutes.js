const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employeeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('Admin'), ctrl.getAll);
router.get('/:id', verifyToken, requireRole('Admin'), ctrl.getById);
router.post('/', verifyToken, requireRole('Admin'), ctrl.create);
router.put('/:id', verifyToken, requireRole('Admin'), ctrl.update);
router.delete('/:id', verifyToken, requireRole('Admin'), ctrl.remove);

module.exports = router;
