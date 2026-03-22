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

async function safeQuery(sql, params = []) {
    try {
        return await query(sql, params);
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
            return [];
        }

        throw err;
    }
}

exports.getOverview = async (req, res) => {
    try {
        const members = await safeQuery('SELECT * FROM members ORDER BY member_id DESC LIMIT 300');
        const employees = await safeQuery('SELECT * FROM employees ORDER BY 1 DESC LIMIT 300');
        const users = await safeQuery('SELECT user_id, full_name, email, role, member_ref_id, created_at FROM library_users ORDER BY user_id DESC LIMIT 300');
        const books = await safeQuery('SELECT * FROM books ORDER BY 1 DESC LIMIT 300');

        const requests = await safeQuery(
            `
            SELECT
                br.request_id,
                br.member_user_id,
                br.book_id,
                br.status,
                br.notes,
                br.requested_at,
                lu.full_name AS member_name,
                lu.member_ref_id AS member_id
            FROM book_requests br
            LEFT JOIN library_users lu ON lu.user_id = br.member_user_id
            ORDER BY br.request_id DESC
            LIMIT 300
            `
        );

        const fines = await safeQuery('SELECT * FROM fines ORDER BY 1 DESC LIMIT 300');

        let issues = await safeQuery('SELECT * FROM issue_records ORDER BY 1 DESC LIMIT 300');
        if (!issues.length) {
            issues = await safeQuery('SELECT * FROM issues ORDER BY 1 DESC LIMIT 300');
        }

        return res.status(200).json({
            members,
            employees: employees.length ? employees : users.filter((user) => user.role !== 'member'),
            users,
            books,
            requests,
            fines,
            issues
        });
    } catch (err) {
        console.error('Admin overview error:', err.message);
        return res.status(500).json({ message: 'Failed to load admin overview', error: err.message });
    }
};
