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
    console.log('Connected to database for v3 migration...');

    // 1. Add is_secure column to gateways table
    await client.query(`
      ALTER TABLE gateways 
      ADD COLUMN IF NOT EXISTS is_secure BOOLEAN DEFAULT true;
    `);
    console.log('Gateways table updated with is_secure column.');

    // 2. Create cloud_pipelines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cloud_pipelines (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL, -- 'AWS', 'Azure', 'Custom'
        status VARCHAR(50) DEFAULT 'connected', -- 'connected', 'disconnected', 'reconnecting'
        gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('cloud_pipelines table created.');

    // 3. Retrieve existing gateways
    const gatewaysResult = await client.query('SELECT id FROM gateways LIMIT 3');
    const gatewayIds = gatewaysResult.rows.map(row => row.id);

    // Seed default cloud pipelines
    const defaultPipelines = [
      {
        id: 'PL-AWS-1',
        name: 'AWS IoT Core Ingress',
        provider: 'AWS',
        status: 'connected',
        gateway_id: gatewayIds[0] || null
      },
      {
        id: 'PL-AZURE-1',
        name: 'Azure IoT Hub Pipeline',
        provider: 'Azure',
        status: 'connected',
        gateway_id: gatewayIds[1] || gatewayIds[0] || null
      },
      {
        id: 'PL-CUSTOM-1',
        name: 'Custom MQTT Ingestion Broker',
        provider: 'Custom',
        status: 'connected',
        gateway_id: gatewayIds[2] || gatewayIds[0] || null
      }
    ];

    for (const pl of defaultPipelines) {
      await client.query(`
        INSERT INTO cloud_pipelines (id, name, provider, status, gateway_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, provider = EXCLUDED.provider, gateway_id = COALESCE(cloud_pipelines.gateway_id, EXCLUDED.gateway_id);
      `, [pl.id, pl.name, pl.provider, pl.status, pl.gateway_id]);
    }
    console.log('Default cloud pipelines seeded.');

    console.log('V3 Migration completed successfully.');
  } catch (error) {
    console.error('V3 Migration failed:', error);
  } finally {
    await client.end();
  }
};

migrate();
