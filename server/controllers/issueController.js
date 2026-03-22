const db = require('../config/db');

exports.getIssueHistory = (req, res) => {
    const sql = `
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

    db.query(sql, (err, rows) => {
        if (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return res.status(200).json([]);
            }

            console.error('Issue history error:', err.message);
            return res.status(500).json({
                message: 'Failed to fetch issue history',
                error: err.message
            });
        }

        return res.status(200).json(rows);
    });
};

exports.issueBook = (req, res) => {
    const { book_id, member_id, employee_id } = req.body;

    if (!book_id || !member_id || !employee_id) {
        return res.status(400).json({
            message: 'book_id, member_id, and employee_id are required'
        });
    }

    db.query('CALL issue_book(?, ?, ?)', [book_id, member_id, employee_id], (err) => {
        if (err) {
            console.error('Issue book error:', err.message);
            return res.status(500).json({
                message: 'Failed to issue book',
                error: err.message
            });
        }

        return res.status(200).json({ message: 'Book issued successfully' });
    });
};

exports.returnBook = (req, res) => {
    const { record_id } = req.body;

    if (!record_id) {
        return res.status(400).json({ message: 'record_id is required' });
    }

    db.query('CALL return_book(?)', [record_id], (err) => {
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
