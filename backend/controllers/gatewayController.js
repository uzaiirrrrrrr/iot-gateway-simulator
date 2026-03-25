const db = require('../db');

exports.createGateway = async (req, res) => {
  const { id, name } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ message: 'Gateway ID and Name are required.' });
  }

  try {
    const existing = await db.query('SELECT id FROM gateways WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Gateway with this ID already exists.' });
    }

    const result = await db.query(
      `INSERT INTO gateways (id, name, status, last_heartbeat) VALUES ($1, $2, 'online', NOW()) RETURNING *`,
      [id, name]
    );

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'GATEWAY_CREATED', `Gateway ${id} created`, req.ip]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGateways = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM gateways ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGatewayStatus = async (req, res) => {
  const { id } = req.params;
  const { is_enabled } = req.body;

  try {
    const result = await db.query(
      'UPDATE gateways SET is_enabled = $1 WHERE id = $2 RETURNING *',
      [is_enabled, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gateway not found.' });
    }

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'GATEWAY_UPDATED', `Gateway ${id} status toggled: ${is_enabled}`, req.ip]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteGateway = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM gateways WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gateway not found.' });
    }

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'GATEWAY_DELETED', `Gateway ${id} deleted`, req.ip]);

    res.json({ message: 'Gateway deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
