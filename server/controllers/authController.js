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
        const { full_name, password } = req.body;

        if (!full_name || !password) {
            return res.status(400).json({ message: 'full_name and password are required' });
        }

        const generatedEmail = `${String(full_name).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'member'}.${Date.now()}@library.local`;

        const existing = await query('SELECT user_id FROM library_users WHERE email = ? LIMIT 1', [generatedEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Registration conflict, please try again' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let memberRefId = null;

        try {
            const insertMember = await query(
                `
                INSERT INTO members (name, email, is_active)
                VALUES (?, ?, 1)
                `,
                [full_name, generatedEmail]
            );

            memberRefId = insertMember.insertId;
        } catch (memberErr) {
            if (memberErr.code !== 'ER_NO_SUCH_TABLE' && memberErr.code !== 'ER_BAD_FIELD_ERROR') {
                throw memberErr;
            }
        }

        const inserted = await query(
            `
            INSERT INTO library_users (full_name, email, password_hash, role, member_ref_id)
            VALUES (?, ?, ?, 'member', ?)
            `,
            [full_name, generatedEmail, passwordHash, memberRefId]
        );

        const finalMemberId = memberRefId || inserted.insertId;
        await query('UPDATE library_users SET member_ref_id = ? WHERE user_id = ?', [finalMemberId, inserted.insertId]);

        return res.status(201).json({
            message: 'Member account created successfully',
            member_ref_id: finalMemberId,
            generated_email: generatedEmail
        });
    } catch (err) {
        console.error('Register member error:', err.message);
        return res.status(500).json({ message: 'Failed to register member', error: err.message });
    }
};

exports.registerAdmin = async (req, res) => {
    try {
        const { full_name, email, password, registration_key } = req.body;
        const expectedKey = process.env.ADMIN_REGISTRATION_KEY;

        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'full_name, email, and password are required' });
        }

        if (!expectedKey) {
            return res.status(503).json({ message: 'Admin registration is not configured' });
        }

        if (!registration_key || registration_key !== expectedKey) {
            return res.status(403).json({ message: 'Invalid admin registration key' });
        }

        const existing = await query('SELECT user_id FROM library_users WHERE email = ? LIMIT 1', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await query(
            `
            INSERT INTO library_users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, 'admin')
            `,
            [full_name, email, passwordHash]
        );

        return res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('Register admin error:', err.message);
        return res.status(500).json({ message: 'Failed to register admin', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, identifier, member_ref_id } = req.body;
        const identity = email || identifier || member_ref_id;

        if (!identity || !password) {
            return res.status(400).json({ message: 'identifier and password are required' });
        }

        let users = [];

        if (/^\d+$/.test(String(identity))) {
            users = await query(
                `
                SELECT user_id, full_name, email, password_hash, role, member_ref_id
                FROM library_users
                WHERE member_ref_id = ? OR user_id = ?
                LIMIT 1
                `,
                [Number(identity), Number(identity)]
            );
        } else {
            users = await query(
                `
                SELECT user_id, full_name, email, password_hash, role, member_ref_id
                FROM library_users
                WHERE email = ?
                LIMIT 1
                `,
                [identity]
            );
        }

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
