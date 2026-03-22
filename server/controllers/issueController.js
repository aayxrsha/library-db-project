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

function computeOverdueFine(issueRow) {
    const issueDate = issueRow.issue_date ? new Date(issueRow.issue_date) : null;
    const dueDate = issueRow.due_date
        ? new Date(issueRow.due_date)
        : (issueDate ? new Date(issueDate.getTime() + (14 * 86400000)) : null);

    if (!dueDate) {
        return 0;
    }

    const overdueDays = Math.floor((Date.now() - dueDate.getTime()) / 86400000);
    if (overdueDays <= 0) {
        return 0;
    }

    // Keep this aligned with current lending policy: Rs. 5/day overdue.
    return overdueDays * 5;
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

exports.returnBook = async (req, res) => {
    const { issue_id, record_id } = req.body;
    const issueId = Number(issue_id || record_id);

    if (!issueId) {
        return res.status(400).json({ message: 'issue_id is required' });
    }

    try {
        let fineAmount = 0;

        try {
            const issueRows = await query(
                'SELECT issue_id, issue_date, due_date, return_date, fine_amount FROM issues WHERE issue_id = ? LIMIT 1',
                [issueId]
            );

            if (issueRows.length > 0) {
                const issueRow = issueRows[0];

                if (issueRow.return_date) {
                    return res.status(400).json({ message: 'This issue is already returned' });
                }

                const storedFine = Number(issueRow.fine_amount || 0);
                const computedFine = computeOverdueFine(issueRow);
                fineAmount = Math.max(storedFine, computedFine);
            }
        } catch (_) {
            // Continue for schema variants that may not expose this table/columns.
        }

        if (fineAmount > 0) {
            let finePaid = false;

            try {
                const fineRows = await query(
                    'SELECT paid FROM fines WHERE issue_id = ? ORDER BY fine_id DESC LIMIT 1',
                    [issueId]
                );

                if (fineRows.length > 0) {
                    finePaid = Number(fineRows[0].paid) === 1;
                }
            } catch (_) {
                finePaid = false;
            }

            if (!finePaid) {
                return res.status(409).json({
                    message: `Fine due: Rs. ${fineAmount}. Ask librarian to mark fine as paid before completing return.`,
                    fine_amount: fineAmount,
                    fine_paid: false
                });
            }
        }

        await query('CALL return_book(?)', [issueId]);

        try {
            const issueRows = await query('SELECT fine_amount FROM issues WHERE issue_id = ? LIMIT 1', [issueId]);
            if (issueRows.length > 0) {
                fineAmount = Number(issueRows[0].fine_amount || 0);
            }
        } catch (_) {
            // Ignore schema-specific lookup errors and continue with fallback.
        }

        if (!fineAmount) {
            try {
                const fineRows = await query('SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE issue_id = ?', [issueId]);
                fineAmount = Number(fineRows[0]?.total || 0);
            } catch (_) {
                // Ignore schema-specific lookup errors and continue with default message.
            }
        }

        if (fineAmount > 0) {
            return res.status(200).json({
                message: `Book returned successfully. Fine due: Rs. ${fineAmount}.`,
                fine_amount: fineAmount
            });
        }

        return res.status(200).json({ message: 'Book returned successfully', fine_amount: 0 });
    } catch (err) {
        console.error('Return book error:', err.message);
        return res.status(500).json({
            message: 'Failed to return book',
            error: err.message
        });
    }
};
