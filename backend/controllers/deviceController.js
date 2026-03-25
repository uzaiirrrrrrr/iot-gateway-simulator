const db = require('../db');

exports.createDevice = async (req, res) => {
  const { id, gateway_id, name, type } = req.body;

  if (!id || !gateway_id || !name) {
    return res.status(400).json({ message: 'Device ID, Gateway ID, and Name are required.' });
  }

  try {
    const gateway = await db.query('SELECT id FROM gateways WHERE id = $1', [gateway_id]);
    if (gateway.rows.length === 0) {
      return res.status(400).json({ message: 'Gateway not found.' });
    }

    const existing = await db.query('SELECT id FROM devices WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Device with this ID already exists.' });
    }

    const result = await db.query(
      `INSERT INTO devices (id, gateway_id, name, type, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [id, gateway_id, name, type]
    );

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'DEVICE_PROVISIONED', `Device ${id} mapped to Gateway ${gateway_id}`, req.ip]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM devices WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'DEVICE_DELETED', `Device ${id} deleted`, req.ip]);

    res.json({ message: 'Device deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
