const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addDeviceMetadata = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Add metadata column if it doesn't exist
    await client.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    `);
    console.log('Added metadata column to devices table');

    // Add data_type column
    await client.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS data_type VARCHAR(50) DEFAULT 'temperature';
    `);
    console.log('Added data_type column to devices table');

    // Add traffic_logs table enhancements
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_traffic_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        payload_size INT,
        is_secure BOOLEAN,
        latency INT,
        status VARCHAR(50),
        payload_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created device_traffic_logs table');

    console.log('All device schema updates completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
};

(async () => {
  await addDeviceMetadata();
  process.exit(0);
})();
