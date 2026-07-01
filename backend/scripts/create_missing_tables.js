const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createMissingTables = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Create heartbeat_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS heartbeat_logs (
        id SERIAL PRIMARY KEY,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created heartbeat_logs table');

    // Create gateway_status_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gateway_status_logs (
        id SERIAL PRIMARY KEY,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created gateway_status_logs table');

    console.log('All missing tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error.message);
  } finally {
    await client.end();
  }
};

(async () => {
  await createMissingTables();
  process.exit(0);
})();
