const db = require('./db');
require('dotenv').config();

(async () => {
  try {
    // Check if gateways exist
    const checkResult = await db.query('SELECT COUNT(*) as count FROM gateways');
    const count = checkResult.rows[0].count;
    
    console.log(`Current gateways in DB: ${count}`);

    if (count === 0) {
      console.log('No gateways found, adding sample gateways...');
      
      // Add sample gateways
      await db.query(
        `INSERT INTO gateways (id, name, status, is_enabled, last_heartbeat) 
         VALUES ($1, $2, 'online', true, NOW())`,
        ['GTW-HQ-01', 'Headquarters Gateway']
      );
      
      await db.query(
        `INSERT INTO gateways (id, name, status, is_enabled, last_heartbeat) 
         VALUES ($1, $2, 'online', true, NOW())`,
        ['GTW-BR-02', 'Branch Gateway']
      );

      await db.query(
        `INSERT INTO gateways (id, name, status, is_enabled, last_heartbeat) 
         VALUES ($1, $2, 'offline', false, NOW())`,
        ['GTW-DC-03', 'Data Center Gateway']
      );

      console.log('Sample gateways added successfully!');
    } else {
      console.log('Gateways already exist in database.');
      
      // Show current gateways
      const result = await db.query('SELECT id, name, status, is_enabled FROM gateways ORDER BY created_at DESC');
      console.log('Current Gateways:');
      result.rows.forEach(row => {
        console.log(`- ${row.id}: ${row.name} (${row.status}, enabled: ${row.is_enabled})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
