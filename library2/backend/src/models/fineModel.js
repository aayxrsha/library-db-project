const pool = require('../config/db');

const FineModel = {
  getAll: () =>
    pool.query(`
      SELECT f.*, m.Mem_Name, i.Due_Date, i.Return_Date, b.Name AS BookName
      FROM Fine f
      JOIN Member m ON f.Member_Id = m.Member_Id
      JOIN Issue  i ON f.Issue_Id  = i.Issue_Id
      JOIN Book   b ON i.Book_Id   = b.Book_Id
      ORDER BY f.Fine_Id DESC
    `),

  getByMember: (memberId) =>
    pool.query(
      `SELECT f.*, i.Due_Date, b.Name AS BookName
       FROM Fine f
       JOIN Issue i ON f.Issue_Id = i.Issue_Id
       JOIN Book  b ON i.Book_Id  = b.Book_Id
       WHERE f.Member_Id = ?`,
      [memberId]
    ),

  create: (data) =>
    pool.query(
      `INSERT INTO Fine (Issue_Id, Member_Id, Amount, Reason) VALUES (?, ?, ?, ?)`,
      [data.Issue_Id, data.Member_Id, data.Amount, data.Reason]
    ),

  getOpenIssueById: (issueId) =>
    pool.query(
      `SELECT i.Issue_Id, i.Member_Id, i.Return_Date, b.Name AS BookName, m.Mem_Name
       FROM Issue i
       JOIN Book b ON i.Book_Id = b.Book_Id
       JOIN Member m ON i.Member_Id = m.Member_Id
       WHERE i.Issue_Id = ? AND i.Return_Date IS NULL`,
      [issueId]
    ),

  createForIssue: ({ Issue_Id, Amount, Reason }) =>
    pool.query(
      `INSERT INTO Fine (Issue_Id, Member_Id, Amount, Reason)
       SELECT i.Issue_Id, i.Member_Id, ?, ?
       FROM Issue i
       WHERE i.Issue_Id = ? AND i.Return_Date IS NULL`,
      [Amount, Reason, Issue_Id]
    ),

  markPaid: (id) =>
    pool.query(`UPDATE Fine SET Paid = TRUE WHERE Fine_Id = ?`, [id]),

  getUnpaid: () =>
    pool.query(
      `SELECT f.*, m.Mem_Name FROM Fine f
       JOIN Member m ON f.Member_Id = m.Member_Id
       WHERE f.Paid = FALSE`
    ),
};

module.exports = FineModel;
