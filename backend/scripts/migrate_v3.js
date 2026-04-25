const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'iot_simulator',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5432,
});

const migration = async () => {
  try {
    await client.connect();
    console.log('--- Phase 1: Creating New Log Tables ---');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS gateway_status_logs (
        id SERIAL PRIMARY KEY,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS heartbeat_logs (
        id SERIAL PRIMARY KEY,
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Logs tables created.');

    console.log('--- Phase 2: Updating Device Table ---');
    await client.query(`
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_payload TEXT;
    `);
    console.log('✓ Device schema updated.');

    console.log('--- Phase 3: Initializing Metadata ---');
    await client.query(`
      UPDATE devices SET metadata = '{"manufacturer": "DeepMind IoT", "firmware": "v2.0.4", "hw_version": "rev.B"}' WHERE metadata = '{}';
    `);
    console.log('✓ Metadata seeded.');

    console.log('Migration Successfully Completed!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
};

migration();
