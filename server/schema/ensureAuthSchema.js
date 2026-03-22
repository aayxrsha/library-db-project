const bcrypt = require('bcryptjs');
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

async function ensureAuthSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS library_users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            member_ref_id INT NULL,
            full_name VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('member', 'librarian') NOT NULL DEFAULT 'member',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS book_requests (
            request_id INT AUTO_INCREMENT PRIMARY KEY,
            member_user_id INT NOT NULL,
            book_id INT NOT NULL,
            notes VARCHAR(255) NULL,
            status ENUM('pending', 'approved', 'rejected', 'issued') NOT NULL DEFAULT 'pending',
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_by INT NULL,
            reviewed_at DATETIME NULL,
            issue_record_id INT NULL
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS fines (
            fine_id INT AUTO_INCREMENT PRIMARY KEY,
            member_user_id INT NOT NULL,
            request_id INT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            reason VARCHAR(255) NULL,
            status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.local';
    const librarianPassword = process.env.LIBRARIAN_PASSWORD || 'admin123';

    const existing = await query('SELECT user_id FROM library_users WHERE email = ? LIMIT 1', [librarianEmail]);
    if (existing.length === 0) {
        const hash = await bcrypt.hash(librarianPassword, 10);
        await query(
            `
            INSERT INTO library_users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, 'librarian')
            `,
            ['Head Librarian', librarianEmail, hash]
        );
    }
}

module.exports = {
    ensureAuthSchema
};
