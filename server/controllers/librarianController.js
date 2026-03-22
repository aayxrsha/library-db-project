const db = require('../config/db');

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

exports.listRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT
                br.request_id,
                br.member_user_id,
                br.book_id,
                br.notes,
                br.status,
                br.requested_at,
                br.reviewed_at,
                m.full_name AS member_name,
                m.member_ref_id,
                l.full_name AS reviewed_by_name
            FROM book_requests br
            JOIN library_users m ON br.member_user_id = m.user_id
            LEFT JOIN library_users l ON br.reviewed_by = l.user_id
        `;

        const params = [];
        if (status) {
            sql += ' WHERE br.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY br.request_id DESC';

        const rows = await query(sql, params);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('List requests error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
    }
};

exports.issueRequestedBook = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { employee_id } = req.body;

        const requestRows = await query(
            `
            SELECT br.request_id, br.member_user_id, br.book_id, br.status, m.member_ref_id, m.full_name, m.email
            FROM book_requests br
            JOIN library_users m ON br.member_user_id = m.user_id
            WHERE br.request_id = ?
            LIMIT 1
            `,
            [requestId]
        );

        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requestRows[0];
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be issued' });
        }

        let memberIdForIssue = Number(request.member_ref_id) || null;

        if (memberIdForIssue) {
            const memberCheck = await query('SELECT member_id FROM members WHERE member_id = ? LIMIT 1', [memberIdForIssue]);
            if (memberCheck.length === 0) {
                memberIdForIssue = null;
            }
        }

        if (!memberIdForIssue && request.email) {
            const memberByEmail = await query('SELECT member_id FROM members WHERE email = ? LIMIT 1', [request.email]);
            if (memberByEmail.length > 0) {
                memberIdForIssue = memberByEmail[0].member_id;
            }
        }

        if (!memberIdForIssue) {
            const createdMember = await query(
                `
                INSERT INTO members (name, email, is_active)
                VALUES (?, ?, 1)
                `,
                [request.full_name || 'Library Member', request.email || null]
            );

            memberIdForIssue = createdMember.insertId;
        }

        await query('UPDATE library_users SET member_ref_id = ? WHERE user_id = ?', [memberIdForIssue, request.member_user_id]);

        const employeeId = Number(employee_id || req.user.userId);

        // Support legacy and newer procedure signatures across DB variants.
        try {
            await query('CALL issue_book(?, ?, ?)', [request.book_id, memberIdForIssue, employeeId]);
        } catch (spErr) {
            if (spErr.code !== 'ER_SP_WRONG_NO_OF_ARGS') {
                throw spErr;
            }

            await query('CALL issue_book(?, ?)', [request.book_id, memberIdForIssue]);
        }

        await query(
            `
            UPDATE book_requests
            SET status = 'issued', reviewed_by = ?, reviewed_at = NOW()
            WHERE request_id = ?
            `,
            [req.user.userId, requestId]
        );

        return res.status(200).json({ message: 'Book issued and request completed' });
    } catch (err) {
        console.error('Issue requested book error:', err.message);
        return res.status(500).json({ message: 'Failed to issue requested book', error: err.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const affected = await query(
            `
            UPDATE book_requests
            SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW()
            WHERE request_id = ? AND status = 'pending'
            `,
            [req.user.userId, requestId]
        );

        if (affected.affectedRows === 0) {
            return res.status(404).json({ message: 'Pending request not found' });
        }

        return res.status(200).json({ message: 'Request rejected' });
    } catch (err) {
        console.error('Reject request error:', err.message);
        return res.status(500).json({ message: 'Failed to reject request', error: err.message });
    }
};

exports.addFine = async (req, res) => {
    try {
        const { member_user_id, request_id, amount, reason } = req.body;

        if (!member_user_id || !amount) {
            return res.status(400).json({ message: 'member_user_id and amount are required' });
        }

        const columns = await query('SHOW COLUMNS FROM fines');
        const columnNames = columns.map((c) => c.Field);

        if (columnNames.includes('member_user_id')) {
            await query(
                `
                INSERT INTO fines (member_user_id, request_id, amount, reason, status)
                VALUES (?, ?, ?, ?, 'unpaid')
                `,
                [Number(member_user_id), request_id || null, Number(amount), reason || null]
            );
        } else if (columnNames.includes('member_id') && columnNames.includes('issue_id')) {
            if (!request_id) {
                return res.status(400).json({ message: 'For this database schema, request_id must be a valid issue_id' });
            }

            await query(
                `
                INSERT INTO fines (issue_id, member_id, amount, paid)
                VALUES (?, ?, ?, 0)
                `,
                [Number(request_id), Number(member_user_id), Number(amount)]
            );
        } else if (columnNames.includes('member_id')) {
            await query(
                `
                INSERT INTO fines (member_id, amount)
                VALUES (?, ?)
                `,
                [Number(member_user_id), Number(amount)]
            );
        } else {
            return res.status(500).json({ message: 'Unsupported fines table schema' });
        }

        return res.status(201).json({ message: 'Fine added successfully' });
    } catch (err) {
        console.error('Add fine error:', err.message);
        return res.status(500).json({ message: 'Failed to add fine', error: err.message });
    }
};

exports.listFines = async (req, res) => {
    try {
        let rows = [];

        try {
            rows = await query(
                `
                SELECT
                    f.fine_id,
                    f.member_user_id,
                    lu.full_name AS member_name,
                    f.request_id,
                    f.amount,
                    f.reason,
                    f.status,
                    f.created_at
                FROM fines f
                LEFT JOIN library_users lu ON f.member_user_id = lu.user_id
                ORDER BY f.fine_id DESC
                `
            );
        } catch (firstErr) {
            if (firstErr.code === 'ER_BAD_FIELD_ERROR') {
                rows = await query('SELECT * FROM fines ORDER BY 1 DESC LIMIT 200');
            } else {
                throw firstErr;
            }
        }

        return res.status(200).json(rows);
    } catch (err) {
        console.error('List fines error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch fines', error: err.message });
    }
};
