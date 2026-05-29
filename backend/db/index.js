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

// Run automatic schema migrations for security recovery & device registry
const runMigrations = async () => {
  try {
    // Password reset columns
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
    `);

    // Device OTP verification columns
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS device_otp VARCHAR(255),
      ADD COLUMN IF NOT EXISTS device_otp_expires TIMESTAMP;
    `);

    // Registered devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        device_name VARCHAR(255),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, device_id)
      );
    `);

    // Simulated Cloud Storage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cloud_storage_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        payload TEXT,
        stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);


    console.log('Database auto-migrations executed successfully. Security recovery + device registry verified.');
  } catch (err) {
    console.error('Failed to run schema auto-migrations:', err.message);
  }
};

runMigrations();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
