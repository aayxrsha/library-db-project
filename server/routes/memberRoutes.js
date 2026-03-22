const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/', memberController.getMembers);
router.get('/:memberId/details', memberController.getMemberDetails);

module.exports = router;
