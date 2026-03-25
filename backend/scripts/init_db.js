const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createDB = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default to create the new DB
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Database ${process.env.DB_NAME} not found, creating it...`);
      await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`Database created successfully.`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await client.end();
  }
};

const initSchemaAndData = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('Schema executed successfully.');

    // Check if Admin exists
    const adminCheck = await client.query(`SELECT * FROM users WHERE email = 'admin@io.com'`);
    if (adminCheck.rows.length === 0) {
      console.log('Inserting dummy data...');
      const pHashAdmin = await bcrypt.hash('admin123', 10);
      const pHashUser = await bcrypt.hash('user123', 10);
      
      await client.query(`INSERT INTO users (email, password_hash, role) VALUES ('admin@io.com', $1, 'Admin')`, [pHashAdmin]);
      await client.query(`INSERT INTO users (email, password_hash, role) VALUES ('user@io.com', $1, 'User')`, [pHashUser]);

      await client.query(`INSERT INTO gateways (id, name, status, is_enabled) VALUES ('GTW-HQ-01', 'HQ Main Gateway', 'online', true)`);
      await client.query(`INSERT INTO gateways (id, name, status, is_enabled) VALUES ('GTW-BR-02', 'Branch Proxy', 'offline', false)`);

      await client.query(`INSERT INTO devices (id, gateway_id, name, type, status) VALUES ('DEV-TEMP-A', 'GTW-HQ-01', 'Warehouse Temp Sensor', 'temperature', 'active')`);
      await client.query(`INSERT INTO devices (id, gateway_id, name, type, status) VALUES ('DEV-MOT-B', 'GTW-HQ-01', 'Entrance Motion Sensor', 'motion', 'active')`);
      await client.query(`INSERT INTO devices (id, gateway_id, name, type, status) VALUES ('DEV-CAM-C', 'GTW-BR-02', 'Perimeter Camera', 'camera', 'inactive')`);
      
      console.log('Dummy data inserted successfully. Admin: admin@io.com / admin123');
    } else {
      console.log('Dummy data already exists.');
    }
    
  } catch (error) {
    console.error('Error initializing schema/data:', error.message);
  } finally {
    await client.end();
  }
};

(async () => {
  await createDB();
  await initSchemaAndData();
  process.exit(0);
})();
