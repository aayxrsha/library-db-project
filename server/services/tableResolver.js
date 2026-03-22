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

async function resolveFirstTable(candidates) {
    for (const table of candidates) {
        const exists = await tableExists(table);
        if (exists) {
            return table;
        }
    }

    return null;
}

module.exports = {
    tableExists,
    resolveFirstTable
};
