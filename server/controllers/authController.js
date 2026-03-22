const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows);
        });
    });
}

function buildToken(user) {
    return jwt.sign(
        {
            userId: user.user_id,
            role: user.role,
            memberRefId: user.member_ref_id,
            fullName: user.full_name,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

exports.registerMember = async (req, res) => {
    try {
        const { full_name, email, password, member_ref_id } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'full_name, email, and password are required' });
        }

        const existing = await query('SELECT user_id FROM library_users WHERE email = ? LIMIT 1', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await query(
            `
            INSERT INTO library_users (full_name, email, password_hash, role, member_ref_id)
            VALUES (?, ?, ?, 'member', ?)
            `,
            [full_name, email, passwordHash, member_ref_id || null]
        );

        return res.status(201).json({ message: 'Member account created successfully' });
    } catch (err) {
        console.error('Register member error:', err.message);
        return res.status(500).json({ message: 'Failed to register member', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        const users = await query(
            `
            SELECT user_id, full_name, email, password_hash, role, member_ref_id
            FROM library_users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = buildToken(user);

        return res.status(200).json({
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                member_ref_id: user.member_ref_id
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ message: 'Failed to login', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const rows = await query(
            `
            SELECT user_id, full_name, email, role, member_ref_id, created_at
            FROM library_users
            WHERE user_id = ?
            LIMIT 1
            `,
            [req.user.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Profile error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
};
