const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const test = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    const res = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['admin@io.com']);
    if (res.rows.length === 0) {
      console.log('User admin@io.com not found');
      return;
    }
    const user = res.rows[0];
    const isMatch = await bcrypt.compare('admin123', user.password_hash);
    console.log(`User: ${user.email}`);
    console.log(`Password 'admin123' Match: ${isMatch}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
};

test();
