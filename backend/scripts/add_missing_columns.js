const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addMissingColumns = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Add last_payload column if it doesn't exist
    await client.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS last_payload TEXT;
    `);
    console.log('Added last_payload column to devices table');

    // Add heartbeat_interval column if it doesn't exist
    await client.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS heartbeat_interval INT DEFAULT 5000;
    `);
    console.log('Added heartbeat_interval column to devices table');

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error.message);
  } finally {
    await client.end();
  }
};

(async () => {
  await addMissingColumns();
  process.exit(0);
})();
