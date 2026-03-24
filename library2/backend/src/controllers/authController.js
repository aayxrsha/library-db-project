const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { Employee_ID, password } = req.body;
    if (!Employee_ID || !password)
      return res.status(400).json({ message: 'Employee ID and password required' });

    const [rows] = await pool.query(
      `SELECT * FROM Employee WHERE Employee_ID = ?`, [Employee_ID]
    );
    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' });

    const emp = rows[0];
    const valid = await bcrypt.compare(password, emp.Password_Hash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: emp.Employee_ID, name: emp.Employee_Name, role: emp.Role, userType: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      employee: { id: emp.Employee_ID, name: emp.Employee_Name, role: emp.Role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/member-login
const memberLogin = async (req, res, next) => {
  try {
    const { Member_Id, password } = req.body;
    if (!Member_Id || !password)
      return res.status(400).json({ message: 'Member ID and password required' });

    const [rows] = await pool.query(
      `SELECT * FROM Member WHERE Member_Id = ?`, [Member_Id]
    );

    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' });

    const member = rows[0];
    const valid = await bcrypt.compare(password, member.Password_Hash || '');

    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: member.Member_Id,
        name: member.Mem_Name,
        role: 'Member',
        memberType: member.Member_Type,
        userType: 'member',
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      member: {
        id: member.Member_Id,
        name: member.Mem_Name,
        memberType: member.Member_Type,
        role: 'Member',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/member-register
const memberRegister = async (req, res, next) => {
  try {
    const { Mem_Name, Member_Type, Contact, Email, password } = req.body;

    if (!Mem_Name || !Member_Type || !Email || !password) {
      return res.status(400).json({ message: 'Mem_Name, Member_Type, Email and password are required' });
    }

    const normalizedEmail = String(Email).trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!emailOk) {
      return res.status(400).json({ message: 'Please enter a valid Email address' });
    }

    const allowedTypes = ['Student', 'Teacher', 'NT_Staff'];
    if (!allowedTypes.includes(Member_Type)) {
      return res.status(400).json({ message: 'Invalid Member_Type' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query(
      'SELECT Member_Id FROM Member WHERE Email = ? LIMIT 1',
      [normalizedEmail]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const Password_Hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO Member (Mem_Name, Member_Type, Contact, Email, Password_Hash)
       VALUES (?, ?, ?, ?, ?)`,
      [String(Mem_Name).trim(), Member_Type, Contact || null, normalizedEmail, Password_Hash]
    );

    res.status(201).json({
      message: 'Member registered successfully',
      Member_Id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, memberLogin, memberRegister };
