const FineModel = require('../models/fineModel');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await FineModel.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

const getUnpaid = async (req, res, next) => {
  try {
    const [rows] = await FineModel.getUnpaid();
    res.json(rows);
  } catch (err) { next(err); }
};

const getByMember = async (req, res, next) => {
  try {
    const [rows] = await FineModel.getByMember(req.params.memberId);
    res.json(rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { Issue_Id, Amount, Reason } = req.body;

    if (!Issue_Id) {
      return res.status(400).json({ message: 'Issue_Id is required' });
    }

    const numericAmount = Number(Amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }

    if (!Reason || !String(Reason).trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const [issueRows] = await FineModel.getOpenIssueById(Issue_Id);
    if (issueRows.length === 0) {
      return res.status(400).json({ message: 'Issue not found or book already returned' });
    }

    const [result] = await FineModel.createForIssue({
      Issue_Id,
      Amount: numericAmount,
      Reason: String(Reason).trim(),
    });

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Unable to create fine for this issue' });
    }

    res.status(201).json({ message: 'Fine added successfully', Fine_Id: result.insertId });
  } catch (err) { next(err); }
};

const markPaid = async (req, res, next) => {
  try {
    await FineModel.markPaid(req.params.id);
    res.json({ message: 'Fine marked as paid' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getUnpaid, getByMember, create, markPaid };
