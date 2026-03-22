const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.get('/', bookController.getBooks);
router.post('/', bookController.addBook);
router.delete('/:bookId', bookController.deleteBook);

module.exports = router;
