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
    // Let's get a gateway ID and user ID first
    const gatewayRes = await pool.query('SELECT id FROM gateways LIMIT 1');
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (gatewayRes.rows.length === 0 || userRes.rows.length === 0) {
      console.log('Gateway or User not found in database');
      return;
    }
    
    const gatewayId = gatewayRes.rows[0].id;
    const userId = userRes.rows[0].id;
    const is_secure = false;
    const ip = '127.0.0.1';
    
    console.log(`Using Gateway ID: ${gatewayId}, User ID: ${userId}`);
    
    await pool.query('BEGIN');
    
    const result = await pool.query(
      'UPDATE gateways SET is_secure = $1 WHERE id = $2 RETURNING *',
      [is_secure, gatewayId]
    );
    console.log('Update gateways result rows:', result.rows.length);
    
    const modeName = is_secure ? 'SECURE_TLS' : 'INSECURE_HTTP';
    
    await pool.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [userId, 'GATEWAY_SECURITY_TOGGLED', `Gateway ${gatewayId} switched to ${modeName}`, ip]);
    console.log('Inserted into audit_logs successfully');

    await pool.query(
      `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
      [gatewayId, is_secure ? 'INFO' : 'WARNING', `Gateway ${gatewayId} security mode toggled to ${is_secure ? 'Encrypted (TLS/HTTPS)' : 'Plaintext (HTTP)'}.`]
    );
    console.log('Inserted into alerts successfully');
    
    await pool.query('ROLLBACK');
    console.log('Transaction rolled back successfully');
  } catch (err) {
    console.error('Error during query execution:', err);
  } finally {
    await pool.end();
  }
};

test();
