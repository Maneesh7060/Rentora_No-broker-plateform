const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Recommended pool settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    return;
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('❌ PostgreSQL query error:', err.message);
    } else {
      console.log('✅ PostgreSQL connected successfully at:', result.rows[0].now);
    }
  });
});

module.exports = pool;
