const express = require('express');
const router = express.Router();

const issueController = require('../controllers/issueController');

router.get('/history', issueController.getIssueHistory);
router.post('/issue', issueController.issueBook);
router.post('/return', issueController.returnBook);

module.exports = router;
