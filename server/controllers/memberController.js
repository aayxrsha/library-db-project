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

exports.getMembers = (req, res) => {
    const sql = 'SELECT * FROM members LIMIT 200';

    db.query(sql, (err, rows) => {
        if (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return res.status(200).json([]);
            }

            console.error('Members query error:', err.message);
            return res.status(500).json({
                message: 'Failed to fetch members',
                error: err.message
            });
        }

        return res.status(200).json(rows);
    });
};

exports.getMemberDetails = async (req, res) => {
    try {
        const { memberId } = req.params;

        const members = await query('SELECT * FROM members WHERE member_id = ? LIMIT 1', [Number(memberId)]);
        if (members.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const member = members[0];
        let transactions = [];

        try {
            transactions = await query(
                `
                SELECT
                    ir.issue_id,
                    ir.book_id,
                    b.title AS book_title,
                    ir.issue_date,
                    ir.return_date,
                    ir.status
                FROM issue_records ir
                LEFT JOIN books b ON b.book_id = ir.book_id
                WHERE ir.member_id = ?
                ORDER BY ir.issue_id DESC
                `,
                [Number(memberId)]
            );
        } catch (firstErr) {
            if (firstErr.code === 'ER_NO_SUCH_TABLE' || firstErr.code === 'ER_BAD_FIELD_ERROR') {
                transactions = await query(
                    `
                    SELECT
                        i.issue_id,
                        i.book_id,
                        b.title AS book_title,
                        i.issue_date,
                        i.return_date,
                        i.status
                    FROM issues i
                    LEFT JOIN books b ON b.book_id = i.book_id
                    WHERE i.member_id = ?
                    ORDER BY i.issue_id DESC
                    `,
                    [Number(memberId)]
                );
            } else {
                throw firstErr;
            }
        }

        const currentlyBorrowed = transactions.filter((item) => {
            const status = String(item.status || '').toLowerCase();
            return status === 'issued' || status === 'borrowed' || (!item.return_date && status !== 'returned');
        });

        return res.status(200).json({
            member,
            currentlyBorrowed,
            history: transactions
        });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(200).json({ member: null, currentlyBorrowed: [], history: [] });
        }

        console.error('Member details error:', err.message);
        return res.status(500).json({
            message: 'Failed to fetch member details',
            error: err.message
        });
    }
};
