const pool = require('../config/db');

const BookModel = {
  getAll: () =>
    pool.query(`
      SELECT b.*, a.Author_Name, p.Publish_Name, c.Collection_Genre
      FROM Book b
      LEFT JOIN Author    a ON b.Book_Author   = a.Author_Id
      LEFT JOIN Publisher p ON b.Publisher_Id  = p.Id
      LEFT JOIN Collection c ON b.Collection_Id = c.Collection_Id
    `),

  getById: (id) =>
    pool.query(
      `SELECT b.*, a.Author_Name, p.Publish_Name
       FROM Book b
       LEFT JOIN Author    a ON b.Book_Author  = a.Author_Id
       LEFT JOIN Publisher p ON b.Publisher_Id = p.Id
       WHERE b.Book_Id = ?`,
      [id]
    ),

  search: (term) =>
    pool.query(
      `SELECT * FROM Book WHERE Name LIKE ? OR Book_Des LIKE ?`,
      [`%${term}%`, `%${term}%`]
    ),

  create: (data) =>
    (() => {
      const copies = Math.max(parseInt(data.Number_Of_Copies, 10) || 1, 0);
      const available = copies > 0;
      return pool.query(
        `INSERT INTO Book (Name, Book_Des, Genre, Book_Author, Publisher_Id, Collection_Id, Number_Of_Copies, Available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.Name, data.Book_Des, data.Genre, data.Book_Author || null, data.Publisher_Id || null, data.Collection_Id || null, copies, available]
      );
    })(),

  update: (id, data) =>
    (() => {
      const copies = Math.max(parseInt(data.Number_Of_Copies, 10) || 0, 0);
      const available = copies > 0;
      return pool.query(
        `UPDATE Book
         SET Name=?, Book_Des=?, Genre=?, Book_Author=?, Publisher_Id=?, Collection_Id=?, Number_Of_Copies=?, Available=?
         WHERE Book_Id=?`,
        [
          data.Name,
          data.Book_Des,
          data.Genre,
          data.Book_Author || null,
          data.Publisher_Id || null,
          data.Collection_Id || null,
          copies,
          available,
          id,
        ]
      );
    })(),

  delete: (id) =>
    pool.query(`DELETE FROM Book WHERE Book_Id = ?`, [id]),

  setAvailability: (id, available) =>
    pool.query(`UPDATE Book SET Available = ? WHERE Book_Id = ?`, [available, id]),
};

module.exports = BookModel;
