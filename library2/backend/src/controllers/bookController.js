const BookModel = require('../models/bookModel');

const getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const [rows] = search ? await BookModel.search(search) : await BookModel.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await BookModel.getById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const [result] = await BookModel.create(req.body);
    res.status(201).json({ message: 'Book added', Book_Id: result.insertId });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    await BookModel.update(req.params.id, req.body);
    res.json({ message: 'Book updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await BookModel.delete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
