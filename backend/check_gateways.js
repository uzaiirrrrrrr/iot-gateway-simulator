const db = require('./db');
require('dotenv').config();

(async () => {
  try {
    const result = await db.query('SELECT * FROM gateways');
    console.log('Total Gateways:', result.rows.length);
    console.log('Gateways:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
