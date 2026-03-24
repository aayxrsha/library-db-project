const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/bookController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/',     verifyToken, ctrl.getAll);
router.get('/:id',  verifyToken, ctrl.getById);
router.post('/',    verifyToken, requireRole('Admin','Librarian'), ctrl.create);
router.put('/:id',  verifyToken, requireRole('Admin','Librarian'), ctrl.update);
router.delete('/:id', verifyToken, requireRole('Admin'),           ctrl.remove);

module.exports = router;
