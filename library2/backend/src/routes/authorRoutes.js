const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authorController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, ctrl.getAll);
router.post('/', verifyToken, requireRole('Admin'), ctrl.create);
router.delete('/:id', verifyToken, requireRole('Admin'), ctrl.remove);

module.exports = router;
