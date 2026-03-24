const pool = require('../config/db');

const AuthorModel = {
  getAll: () => pool.query('SELECT Author_Id, Author_Name FROM Author ORDER BY Author_Name'),

  create: (data) =>
    pool.query(
      'INSERT INTO Author (Author_Name) VALUES (?)',
      [data.Author_Name]
    ),

  countBooksUsingAuthor: (id) =>
    pool.query('SELECT COUNT(*) AS BookCount FROM Book WHERE Book_Author = ?', [id]),

  remove: (id) =>
    pool.query('DELETE FROM Author WHERE Author_Id = ?', [id]),
};

module.exports = AuthorModel;
