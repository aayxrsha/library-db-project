const IssueModel  = require('../models/issueModel');
const BookModel   = require('../models/bookModel');

const FINE_PER_DAY = 5; // ₹5 per day overdue

const getAll = async (req, res, next) => {
  try {
    const [rows] = await IssueModel.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

const getOverdue = async (req, res, next) => {
  try {
    const [rows] = await IssueModel.getOverdue();
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/issues  — issue a book to a member
const create = async (req, res, next) => {
  try {
    const { Book_Id, Member_Id, Due_Date } = req.body;
    if (!Book_Id || !Member_Id || !Due_Date)
      return res.status(400).json({ message: 'Book_Id, Member_Id and Due_Date are required' });

    // Check book availability
    const [books] = await BookModel.getById(Book_Id);
    const book = books[0];
    const hasCopies = book && Number.isFinite(Number(book.Number_Of_Copies))
      ? Number(book.Number_Of_Copies) > 0
      : Boolean(book?.Available);

    if (!books.length || !hasCopies)
      return res.status(409).json({ message: 'Book is not available' });

    const [resultSets] = await IssueModel.issueByProcedure({
      Book_Id,
      Member_Id,
      Employee_ID: req.user.id,
      Due_Date,
    });

    const issueId = resultSets?.[0]?.[0]?.Issue_Id;
    res.status(201).json({ message: 'Book issued', Issue_Id: issueId || null });
  } catch (err) { next(err); }
};

// PATCH /api/issues/:id/return  — return book, auto-calculate fine
const returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [resultSets] = await IssueModel.returnByProcedure({
      Issue_Id: id,
      Fine_Per_Day: FINE_PER_DAY,
    });

    const result = resultSets?.[0]?.[0] || { DaysLate: 0, FineAmount: 0 };
    const fine = Number(result.FineAmount) > 0
      ? { Amount: Number(result.FineAmount), DaysLate: Number(result.DaysLate) }
      : null;

    res.json({ message: 'Book returned successfully', fine });
  } catch (err) { next(err); }
};

const requestIssue = async (req, res, next) => {
  try {
    const { Book_Id } = req.body;
    if (!Book_Id) return res.status(400).json({ message: 'Book_Id is required' });

    const [books] = await BookModel.getById(Book_Id);
    if (!books.length) return res.status(404).json({ message: 'Book not found' });
    const book = books[0];
    const hasCopies = Number.isFinite(Number(book.Number_Of_Copies))
      ? Number(book.Number_Of_Copies) > 0
      : Boolean(book.Available);
    if (!hasCopies) return res.status(409).json({ message: 'Book is not available' });

    const [result] = await IssueModel.createRequest({
      Member_Id: req.user.id,
      Book_Id,
    });

    res.status(201).json({ message: 'Issue request submitted', Request_Id: result.insertId });
  } catch (err) { next(err); }
};

const getRequests = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      memberId: req.user.userType === 'member' ? req.user.id : req.query.memberId,
    };
    const [rows] = await IssueModel.getRequests(filters);
    res.json(rows);
  } catch (err) { next(err); }
};

const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Due_Date, Note } = req.body;
    if (!Due_Date) return res.status(400).json({ message: 'Due_Date is required' });

    const [rows] = await IssueModel.getRequestById(id);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];
    if (request.Status !== 'Pending') {
      return res.status(400).json({ message: `Request already ${request.Status.toLowerCase()}` });
    }

    const [resultSets] = await IssueModel.issueByProcedure({
      Book_Id: request.Book_Id,
      Member_Id: request.Member_Id,
      Employee_ID: req.user.id,
      Due_Date,
    });

    await IssueModel.markRequestApproved({
      Request_Id: id,
      Employee_ID: req.user.id,
      Due_Date,
      Note,
    });

    const issueId = resultSets?.[0]?.[0]?.Issue_Id;
    res.json({ message: 'Request approved and book issued', Issue_Id: issueId || null });
  } catch (err) { next(err); }
};

const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Note } = req.body;

    const [rows] = await IssueModel.getRequestById(id);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];
    if (request.Status !== 'Pending') {
      return res.status(400).json({ message: `Request already ${request.Status.toLowerCase()}` });
    }

    await IssueModel.markRequestRejected({
      Request_Id: id,
      Employee_ID: req.user.id,
      Note,
    });

    res.json({ message: 'Request rejected' });
  } catch (err) { next(err); }
};

module.exports = {
  getAll,
  getOverdue,
  create,
  returnBook,
  requestIssue,
  getRequests,
  approveRequest,
  rejectRequest,
};
