const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const migrate = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Connected to database for migration...');

    // 1. Update Gateways table
    await client.query(`
      ALTER TABLE gateways 
      ADD COLUMN IF NOT EXISTS heartbeat_interval INT DEFAULT 10,
      ADD COLUMN IF NOT EXISTS decommissioned_at TIMESTAMP;
    `);
    console.log('Gateways table updated.');

    // 2. Create Refresh Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Refresh Tokens table created.');

    // 3. Update Devices table (ensure status exists)
    await client.query(`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
    `);
    console.log('Devices table updated.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
};

migrate();
