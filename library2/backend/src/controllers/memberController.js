const MemberModel = require('../models/memberModel');
const bcrypt = require('bcryptjs');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await MemberModel.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await MemberModel.getById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: 'Member not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getActiveIssues = async (req, res, next) => {
  try {
    const [rows] = await MemberModel.getActiveIssues(req.params.id);
    res.json(rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { Mem_Name, Member_Type, Contact, Email, password } = req.body;
    if (!Mem_Name || !Member_Type || !Email || !password) {
      return res.status(400).json({ message: 'Mem_Name, Member_Type, Email and password are required' });
    }

    const Password_Hash = await bcrypt.hash(password, 10);
    const [result] = await MemberModel.create({ Mem_Name, Member_Type, Contact, Email: String(Email).trim().toLowerCase(), Password_Hash });
    res.status(201).json({ message: 'Member added', Member_Id: result.insertId });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { Mem_Name, Member_Type, Contact, Email, password } = req.body;
    if (!Mem_Name || !Member_Type || !Email) {
      return res.status(400).json({ message: 'Mem_Name, Member_Type and Email are required' });
    }

    const updatePayload = { Mem_Name, Member_Type, Contact, Email: String(Email).trim().toLowerCase() };
    if (password) {
      updatePayload.Password_Hash = await bcrypt.hash(password, 10);
    }

    await MemberModel.update(req.params.id, updatePayload);
    res.json({ message: 'Member updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await MemberModel.delete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (err) { next(err); }
};

const getMyProfile = async (req, res, next) => {
  try {
    const [rows] = await MemberModel.getById(req.user.id);
    if (!rows.length) return res.status(404).json({ message: 'Member not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getActiveIssues, create, update, remove, getMyProfile };
