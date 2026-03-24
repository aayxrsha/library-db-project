const AuthorModel = require('../models/authorModel');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await AuthorModel.getAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { Author_Name } = req.body;
    if (!Author_Name) {
      return res.status(400).json({ message: 'Author_Name is required' });
    }

    const [result] = await AuthorModel.create({ Author_Name });
    res.status(201).json({ message: 'Author added', Author_Id: result.insertId });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const authorId = req.params.id;
    const [[usage]] = await AuthorModel.countBooksUsingAuthor(authorId);
    if ((usage?.BookCount || 0) > 0) {
      return res.status(409).json({
        message: `Cannot delete this author because ${usage.BookCount} book(s) are linked. Reassign or remove those books first.`,
      });
    }

    await AuthorModel.remove(req.params.id);
    res.json({ message: 'Author deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, remove };
