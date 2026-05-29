const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Run automatic schema migrations for security recovery
pool.query(`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
`).then(() => {
  console.log('Database auto-migrations executed successfully. Security recovery columns verified.');
}).catch(err => {
  console.error('Failed to run schema auto-migrations for password resets:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

