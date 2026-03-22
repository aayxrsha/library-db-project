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

exports.getBooks = (req, res) => {
    const sql = 'SELECT * FROM books LIMIT 200';

    db.query(sql, (err, rows) => {
        if (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return res.status(200).json([]);
            }

            console.error('Books query error:', err.message);
            return res.status(500).json({
                message: 'Failed to fetch books',
                error: err.message
            });
        }

        return res.status(200).json(rows);
    });
};

exports.addBook = async (req, res) => {
    const title = String(req.body?.title || '').trim();
    const author = String(req.body?.author || '').trim();
    const genre = String(req.body?.genre || '').trim();
    const publishedYear = req.body?.published_year ? Number(req.body.published_year) : null;
    const parsedCopies = Number(req.body?.copies || 1);
    const copies = Number.isFinite(parsedCopies) && parsedCopies > 0 ? Math.floor(parsedCopies) : 1;

    if (!title || !author) {
        return res.status(400).json({ message: 'title and author are required' });
    }

    const attempts = [
        {
            sql: 'INSERT INTO books (title, author, category, year, copies, available, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: [
                title,
                author,
                genre || 'General',
                Number.isFinite(publishedYear) ? publishedYear : null,
                copies,
                copies,
                copies > 0 ? 'available' : 'issued'
            ]
        },
        {
            sql: 'INSERT INTO books (title, author, genre, published_year, copies) VALUES (?, ?, ?, ?, ?)',
            params: [title, author, genre || null, Number.isFinite(publishedYear) ? publishedYear : null, copies]
        },
        {
            sql: 'INSERT INTO books (title, author, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)',
            params: [title, author, genre || 'General', copies, copies]
        },
        {
            sql: 'INSERT INTO books (title, author, genre, quantity, available_quantity) VALUES (?, ?, ?, ?, ?)',
            params: [title, author, genre || null, copies, copies]
        },
        {
            sql: 'INSERT INTO books (title, author) VALUES (?, ?)',
            params: [title, author]
        }
    ];

    let lastErr;
    for (const attempt of attempts) {
        try {
            const result = await query(attempt.sql, attempt.params);
            return res.status(201).json({
                message: 'Book added successfully',
                id: result.insertId
            });
        } catch (err) {
            lastErr = err;
            if (err.code !== 'ER_BAD_FIELD_ERROR') {
                break;
            }
        }
    }

    console.error('Add book error:', lastErr?.message || 'unknown error');
    return res.status(500).json({
        message: 'Failed to add book',
        error: lastErr?.message || 'Unknown error'
    });
};

exports.deleteBook = async (req, res) => {
    const bookId = Number(req.params.bookId);

    if (!bookId) {
        return res.status(400).json({ message: 'Valid bookId is required' });
    }

    const attempts = [
        { sql: 'DELETE FROM books WHERE book_id = ?', params: [bookId] },
        { sql: 'DELETE FROM books WHERE id = ?', params: [bookId] }
    ];

    let lastErr;
    for (const attempt of attempts) {
        try {
            const result = await query(attempt.sql, attempt.params);
            if (!result.affectedRows) {
                return res.status(404).json({ message: 'Book not found' });
            }

            return res.status(200).json({ message: 'Book removed successfully' });
        } catch (err) {
            lastErr = err;
            if (err.code !== 'ER_BAD_FIELD_ERROR') {
                break;
            }
        }
    }

    console.error('Delete book error:', lastErr?.message || 'unknown error');
    return res.status(500).json({
        message: 'Failed to remove book',
        error: lastErr?.message || 'Unknown error'
    });
};
