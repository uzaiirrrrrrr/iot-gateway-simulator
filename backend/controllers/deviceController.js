const db = require('../db');
const crypto = require('crypto');

exports.createDevice = async (req, res) => {
  let { id, gateway_id, name, type } = req.body;

  if (!gateway_id || !name) {
    return res.status(400).json({ message: 'Gateway ID and Name are required.' });
  }

  if (!id) {
    id = 'DEV-' + crypto.randomBytes(3).toString('hex').toUpperCase();
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

exports.updateDeviceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'inactive'
    try {
        const result = await db.query('UPDATE devices SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Device not found.' });
        
        await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
            [req.user.id, 'DEVICE_STATUS_UPDATED', `Device ${id} status: ${status}`, req.ip]);
            
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateDeviceMapping = async (req, res) => {
    const { id } = req.params;
    const { gateway_id } = req.body;
    try {
        // Validation: Target gateway must be active/enabled
        const gtw = await db.query('SELECT is_enabled FROM gateways WHERE id = $1', [gateway_id]);
        if (gtw.rows.length === 0) return res.status(404).json({ message: 'Target gateway not found.' });
        if (!gtw.rows[0].is_enabled) return res.status(400).json({ message: 'Cannot map device to a disabled gateway.' });

        const result = await db.query('UPDATE devices SET gateway_id = $1 WHERE id = $2 RETURNING *', [gateway_id, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Device not found.' });
        
        await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
            [req.user.id, 'DEVICE_MAPPING_UPDATED', `Device ${id} re-mapped to Gateway ${gateway_id}`, req.ip]);
            
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateDeviceMetadata = async (req, res) => {
    const { id } = req.params;
    const { metadata } = req.body;
    try {
        const result = await db.query('UPDATE devices SET metadata = $1 WHERE id = $2 RETURNING *', [metadata, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Device not found.' });
        
        await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
            [req.user.id, 'DEVICE_METADATA_UPDATED', `Device ${id} metadata updated`, req.ip]);
            
        res.json(result.rows[0]);
    } catch (e) {
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
