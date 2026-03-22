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

exports.getIssueHistory = (req, res) => {
    const fromIssueRecords = `
        SELECT
            issue_id,
            book_id,
            member_id,
            issue_date,
            return_date,
            status
        FROM issue_records
        ORDER BY issue_id DESC
        LIMIT 100
    `;

    const fromIssues = `
        SELECT
            issue_id,
            book_id,
            member_id,
            issue_date,
            return_date,
            status
        FROM issues
        ORDER BY issue_id DESC
        LIMIT 100
    `;

    db.query(fromIssueRecords, (err, rows) => {
        if (!err) {
            return res.status(200).json(rows);
        }

        if (err.code !== 'ER_NO_SUCH_TABLE') {
            console.error('Issue history error:', err.message);
            return res.status(500).json({
                message: 'Failed to fetch issue history',
                error: err.message
            });
        }

        db.query(fromIssues, (fallbackErr, fallbackRows) => {
            if (fallbackErr) {
                if (fallbackErr.code === 'ER_NO_SUCH_TABLE') {
                    return res.status(200).json([]);
                }

                console.error('Issue history fallback error:', fallbackErr.message);
                return res.status(500).json({
                    message: 'Failed to fetch issue history',
                    error: fallbackErr.message
                });
            }

            return res.status(200).json(fallbackRows);
        });
    });
};

exports.issueBook = async (req, res) => {
    const { book_id, member_id, employee_id } = req.body;
    const bookId = Number(book_id);
    const memberId = Number(member_id);
    const employeeId = Number(employee_id || 0);

    if (!bookId || !memberId) {
        return res.status(400).json({
            message: 'book_id and member_id are required'
        });
    }

    try {
        // Try 3-arg variant first for schemas that track issuing employee.
        try {
            if (employeeId) {
                await query('CALL issue_book(?, ?, ?)', [bookId, memberId, employeeId]);
                return res.status(200).json({ message: 'Book issued successfully' });
            }

            throw Object.assign(new Error('Skip 3-arg attempt'), { code: 'SKIP_3_ARG' });
        } catch (spErr) {
            const shouldFallback = spErr.code === 'ER_SP_WRONG_NO_OF_ARGS'
                || spErr.code === 'ER_WRONG_PARAMCOUNT_TO_PROCEDURE'
                || spErr.code === 'SKIP_3_ARG';

            if (!shouldFallback) {
                throw spErr;
            }

            await query('CALL issue_book(?, ?)', [bookId, memberId]);
            return res.status(200).json({ message: 'Book issued successfully' });
        }
    } catch (err) {
        console.error('Issue book error:', err.message);
        return res.status(500).json({
            message: 'Failed to issue book',
            error: err.message
        });
    }
};

exports.returnBook = (req, res) => {
    const { issue_id, record_id } = req.body;
    const issueId = Number(issue_id || record_id);

    if (!issueId) {
        return res.status(400).json({ message: 'issue_id is required' });
    }

    db.query('CALL return_book(?)', [issueId], (err) => {
        if (err) {
            console.error('Return book error:', err.message);
            return res.status(500).json({
                message: 'Failed to return book',
                error: err.message
            });
        }

        return res.status(200).json({ message: 'Book returned successfully' });
    });
};
