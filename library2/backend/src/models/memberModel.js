const pool = require('../config/db');

const MemberModel = {
  getAll: () =>
    pool.query(`SELECT * FROM Member ORDER BY Mem_Name`),

  getById: (id) =>
    pool.query(`SELECT * FROM Member WHERE Member_Id = ?`, [id]),

  create: (data) =>
    pool.query(
      `INSERT INTO Member (Mem_Name, Member_Type, Contact, Email, Password_Hash) VALUES (?, ?, ?, ?, ?)`,
      [data.Mem_Name, data.Member_Type, data.Contact, data.Email, data.Password_Hash]
    ),

  update: (id, data) =>
    data.Password_Hash
      ? pool.query(
          `UPDATE Member SET Mem_Name=?, Member_Type=?, Contact=?, Email=?, Password_Hash=? WHERE Member_Id=?`,
          [data.Mem_Name, data.Member_Type, data.Contact, data.Email, data.Password_Hash, id]
        )
      : pool.query(
          `UPDATE Member SET Mem_Name=?, Member_Type=?, Contact=?, Email=? WHERE Member_Id=?`,
          [data.Mem_Name, data.Member_Type, data.Contact, data.Email, id]
        ),

  delete: (id) =>
    pool.query(`DELETE FROM Member WHERE Member_Id = ?`, [id]),

  getActiveIssues: (id) =>
    pool.query(
      `SELECT i.*, b.Name AS BookName FROM Issue i
       JOIN Book b ON i.Book_Id = b.Book_Id
       WHERE i.Member_Id = ? AND i.Return_Date IS NULL`,
      [id]
    ),
};

module.exports = MemberModel;
