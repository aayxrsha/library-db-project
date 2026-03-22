const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const issueRoutes = require('./routes/issueRoutes');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const memberPortalRoutes = require('./routes/memberPortalRoutes');
const librarianRoutes = require('./routes/librarianRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { ensureAuthSchema } = require('./schema/ensureAuthSchema');

app.use('/api/issues', issueRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/member', memberPortalRoutes);
app.use('/api/librarian', librarianRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Server is working');
});

app.get('/api/health', (req, res) => {
    db.query('SELECT 1 AS ok', (err) => {
        if (err) {
            return res.status(500).json({
                status: 'down',
                database: 'disconnected',
                error: err.message
            });
        }

        return res.status(200).json({
            status: 'up',
            database: 'connected'
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('DB config:', {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'library_db',
        hasPassword: Boolean(process.env.DB_PASSWORD)
    });

    // Probe DB once at startup so connectivity issues are obvious immediately.
    db.query('SELECT 1 AS ok', (err) => {
        if (err) {
            console.error(`Startup DB check failed: ${err.message}`);
            return;
        }

        console.log('Startup DB check: connected');

        ensureAuthSchema()
            .then(() => {
                console.log('Auth schema check: ready');
            })
            .catch((schemaErr) => {
                console.error(`Auth schema check failed: ${schemaErr.message}`);
            });
    });
});

