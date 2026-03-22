const db = require('../config/db');
const { resolveFirstTable } = require('../services/tableResolver');

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

exports.listBooksForMember = async (req, res) => {
    try {
        const bookTable = await resolveFirstTable(['books', 'book']);
        if (!bookTable) {
            return res.status(200).json([]);
        }

        const rows = await query('SELECT * FROM ?? LIMIT 200', [bookTable]);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Member books error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch books', error: err.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { book_id, notes } = req.body;
        if (!book_id) {
            return res.status(400).json({ message: 'book_id is required' });
        }

        await query(
            `
            INSERT INTO book_requests (member_user_id, book_id, notes, status)
            VALUES (?, ?, ?, 'pending')
            `,
            [req.user.userId, Number(book_id), notes || null]
        );

        return res.status(201).json({ message: 'Book issue request submitted' });
    } catch (err) {
        console.error('Create request error:', err.message);
        return res.status(500).json({ message: 'Failed to submit request', error: err.message });
    }
};

exports.listMyRequests = async (req, res) => {
    try {
        const rows = await query(
            `
            SELECT
                br.request_id,
                br.book_id,
                br.notes,
                br.status,
                br.requested_at,
                br.reviewed_at,
                lu.full_name AS reviewed_by_name
            FROM book_requests br
            LEFT JOIN library_users lu ON br.reviewed_by = lu.user_id
            WHERE br.member_user_id = ?
            ORDER BY br.request_id DESC
            `,
            [req.user.userId]
        );

        return res.status(200).json(rows);
    } catch (err) {
        console.error('My requests error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
    }
};

exports.listMyFines = async (req, res) => {
    try {
        let rows = [];

        try {
            rows = await query('SELECT * FROM fines WHERE member_user_id = ? ORDER BY fine_id DESC', [req.user.userId]);
        } catch (firstErr) {
            if (firstErr.code === 'ER_BAD_FIELD_ERROR') {
                try {
                    rows = await query('SELECT * FROM fines WHERE member_id = ? ORDER BY fine_id DESC', [req.user.memberRefId || -1]);
                } catch (secondErr) {
                    if (secondErr.code === 'ER_BAD_FIELD_ERROR') {
                        rows = await query('SELECT * FROM fines ORDER BY 1 DESC LIMIT 200');
                    } else {
                        throw secondErr;
                    }
                }
            } else {
                throw firstErr;
            }
        }

        return res.status(200).json(rows);
    } catch (err) {
        console.error('My fines error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch fines', error: err.message });
    }
};
