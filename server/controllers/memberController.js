const db = require('../config/db');

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
