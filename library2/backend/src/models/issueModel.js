const pool = require('../config/db');

const IssueModel = {
  getAll: () =>
    pool.query(`
      SELECT i.*, b.Name AS BookName, m.Mem_Name, e.Employee_Name AS IssuedBy
      FROM Issue i
      JOIN Book     b ON i.Book_Id     = b.Book_Id
      JOIN Member   m ON i.Member_Id   = m.Member_Id
      JOIN Employee e ON i.Employee_ID = e.Employee_ID
      ORDER BY i.Issue_Date DESC
    `),

  getById: (id) =>
    pool.query(
      `SELECT i.*, b.Name AS BookName, m.Mem_Name
       FROM Issue i
       JOIN Book b ON i.Book_Id = b.Book_Id
       JOIN Member m ON i.Member_Id = m.Member_Id
       WHERE i.Issue_Id = ?`,
      [id]
    ),

  create: (data) =>
    pool.query(
      `INSERT INTO Issue (Book_Id, Member_Id, Employee_ID, Issue_Date, Due_Date)
       VALUES (?, ?, ?, CURDATE(), ?)`,
      [data.Book_Id, data.Member_Id, data.Employee_ID, data.Due_Date]
    ),

  issueByProcedure: ({ Book_Id, Member_Id, Employee_ID, Due_Date }) =>
    pool.query(`CALL sp_issue_book(?, ?, ?, ?)`, [Book_Id, Member_Id, Employee_ID, Due_Date]),

  // Return a book — sets Return_Date to today
  returnBook: (id) =>
    pool.query(
      `UPDATE Issue SET Return_Date = CURDATE() WHERE Issue_Id = ?`,
      [id]
    ),

  returnByProcedure: ({ Issue_Id, Fine_Per_Day }) =>
    pool.query(`CALL sp_return_book(?, ?)`, [Issue_Id, Fine_Per_Day]),

  getOverdue: () =>
    pool.query(`
      SELECT i.*, b.Name AS BookName, m.Mem_Name, m.Contact,
             DATEDIFF(CURDATE(), i.Due_Date) AS DaysOverdue
      FROM Issue i
      JOIN Book   b ON i.Book_Id   = b.Book_Id
      JOIN Member m ON i.Member_Id = m.Member_Id
      WHERE i.Return_Date IS NULL AND i.Due_Date < CURDATE()
    `),

  createRequest: ({ Member_Id, Book_Id }) =>
    pool.query(
      `INSERT INTO Issue_Request (Member_Id, Book_Id, Status)
       VALUES (?, ?, 'Pending')`,
      [Member_Id, Book_Id]
    ),

  getRequests: ({ status, memberId }) => {
    const where = [];
    const params = [];

    if (status) {
      where.push('r.Status = ?');
      params.push(status);
    }

    if (memberId) {
      where.push('r.Member_Id = ?');
      params.push(memberId);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    return pool.query(
      `SELECT r.*, m.Mem_Name, b.Name AS BookName, e.Employee_Name AS ProcessedByName
       FROM Issue_Request r
       JOIN Member m ON r.Member_Id = m.Member_Id
       JOIN Book b ON r.Book_Id = b.Book_Id
       LEFT JOIN Employee e ON r.Processed_By = e.Employee_ID
       ${whereClause}
       ORDER BY r.Request_Date DESC`,
      params
    );
  },

  getRequestById: (id) =>
    pool.query(
      `SELECT r.*, b.Available
       FROM Issue_Request r
       JOIN Book b ON r.Book_Id = b.Book_Id
       WHERE r.Request_Id = ?`,
      [id]
    ),

  markRequestApproved: ({ Request_Id, Employee_ID, Due_Date, Note }) =>
    pool.query(
      `UPDATE Issue_Request
       SET Status='Approved', Processed_By=?, Processed_At=NOW(), Due_Date=?, Note=?
       WHERE Request_Id = ?`,
      [Employee_ID, Due_Date, Note || null, Request_Id]
    ),

  markRequestRejected: ({ Request_Id, Employee_ID, Note }) =>
    pool.query(
      `UPDATE Issue_Request
       SET Status='Rejected', Processed_By=?, Processed_At=NOW(), Note=?
       WHERE Request_Id = ?`,
      [Employee_ID, Note || null, Request_Id]
    ),
};

module.exports = IssueModel;
