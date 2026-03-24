const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes   = require('./routes/authRoutes');
const bookRoutes   = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const issueRoutes  = require('./routes/issueRoutes');
const fineRoutes   = require('./routes/fineRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authorRoutes = require('./routes/authorRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/books',   bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/issues',  issueRoutes);
app.use('/api/fines',   fineRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/authors', authorRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;
