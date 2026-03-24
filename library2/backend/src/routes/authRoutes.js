// routes/authRoutes.js
const express    = require('express');
const router     = express.Router();
const { login, memberLogin, memberRegister }  = require('../controllers/authController');
router.post('/login', login);
router.post('/member-login', memberLogin);
router.post('/member-register', memberRegister);
module.exports = router;
