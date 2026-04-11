const { Pool } = require('pg');

/**
 * server/utils/dbPool.js
 * 
 * Centralized Database Connection Pool using the 'pg' library.
 * Designed to connect to Supabase's PgBouncer (Port 6543) for 
 * efficient connection management during high-traffic bursts.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Logging pool health
pool.on('error', (err) => {
  console.error('[DATABASE_POOL_ERROR]:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
