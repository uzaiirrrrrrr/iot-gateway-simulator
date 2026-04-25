const db = require('../db');
const crypto = require('crypto');

exports.createGateway = async (req, res) => {
  let { id, name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Gateway Name is required.' });
  }

  // Generate unique ID if not provided
  if (!id) {
      id = 'GTW-' + crypto.randomBytes(4).toString('hex').toUpperCase();
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
  const status = is_enabled ? 'online' : 'offline';

  try {
    const result = await db.query(
      'UPDATE gateways SET is_enabled = $1, status = $2, last_heartbeat = CASE WHEN $1 = TRUE THEN NOW() ELSE last_heartbeat END WHERE id = $3 RETURNING *',
      [is_enabled, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gateway not found.' });
    }

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'GATEWAY_UPDATED', `Gateway ${id} status toggled: ${status} (enabled: ${is_enabled})`, req.ip]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
    const { id } = req.params;
    const { heartbeat_interval, traffic_rate } = req.body;

    try {
        const result = await db.query(
            'UPDATE gateways SET heartbeat_interval = COALESCE($1, heartbeat_interval), traffic_rate = COALESCE($2, traffic_rate) WHERE id = $3 RETURNING *',
            [heartbeat_interval, traffic_rate, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Gateway not found.' });

        await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
            [req.user.id, 'GATEWAY_SETTINGS_UPDATED', `Gateway ${id} settings: HB ${heartbeat_interval}s, TR ${traffic_rate}ms`, req.ip]);

        res.json(result.rows[0]);
    } catch (e) {
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

exports.getGatewayLogs = async (req, res) => {
    const { id } = req.params;
    try {
        const [statusLogs, heartbeatLogs] = await Promise.all([
            db.query('SELECT * FROM gateway_status_logs WHERE gateway_id = $1 ORDER BY timestamp DESC LIMIT 20', [id]),
            db.query('SELECT * FROM heartbeat_logs WHERE gateway_id = $1 ORDER BY timestamp DESC LIMIT 30', [id])
        ]);
        res.json({
            statusHistory: statusLogs.rows,
            heartbeatHistory: heartbeatLogs.rows
        });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};
