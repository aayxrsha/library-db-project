const db = require('../config/db');

function tableExists(tableName) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS count
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = ?
        `;

        db.query(sql, [tableName], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows[0].count > 0);
        });
    });
}

function countRows(tableName) {
    return new Promise((resolve, reject) => {
        db.query('SELECT COUNT(*) AS count FROM ??', [tableName], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows[0].count);
        });
    });
}

exports.getStats = async (req, res) => {
    try {
        const groups = {
            books: ['books', 'book'],
            members: ['members', 'member'],
            issueRecords: ['issue_records', 'issues', 'issue_history']
        };

        const totals = {};

        for (const [metric, candidates] of Object.entries(groups)) {
            let foundCount = null;

            for (const table of candidates) {
                const exists = await tableExists(table);
                if (!exists) {
                    continue;
                }

                const current = await countRows(table);
                if (foundCount === null || current > foundCount) {
                    foundCount = current;
                }
            }

            totals[metric] = foundCount;
        }

        return res.status(200).json({
            totals
        });
    } catch (err) {
        console.error('Dashboard stats error:', err.message);
        return res.status(500).json({
            message: 'Failed to fetch dashboard stats',
            error: err.message
        });
    }
};
