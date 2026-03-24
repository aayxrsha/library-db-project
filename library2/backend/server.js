require('dotenv').config();
const app  = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.query('SELECT 1'); // verify DB connection
    console.log('✅ MySQL connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
})();
