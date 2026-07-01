const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addColumnsToGateways = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Add heartbeat_interval column to gateways if it doesn't exist
    await client.query(`
      ALTER TABLE gateways
      ADD COLUMN IF NOT EXISTS heartbeat_interval INT DEFAULT 10;
    `);
    console.log('Added heartbeat_interval column to gateways table');

    // Add traffic_rate column to gateways if it doesn't exist
    await client.query(`
      ALTER TABLE gateways
      ADD COLUMN IF NOT EXISTS traffic_rate INT DEFAULT 5000;
    `);
    console.log('Added traffic_rate column to gateways table');

    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error.message);
  } finally {
    await client.end();
  }
};

(async () => {
  await addColumnsToGateways();
  process.exit(0);
})();
