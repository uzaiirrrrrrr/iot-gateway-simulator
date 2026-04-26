const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const reinit = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    await client.connect();
    // Terminate other connections to the DB so we can drop it
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `, [process.env.DB_NAME]);
    
    await client.query(`DROP DATABASE IF EXISTS "${process.env.DB_NAME}"`);
    console.log(`Database ${process.env.DB_NAME} dropped.`);
  } catch (err) {
    console.error('Error dropping database:', err.message);
  } finally {
    await client.end();
  }
};

reinit();
