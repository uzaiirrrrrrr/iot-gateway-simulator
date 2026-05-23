const db = require('../db');

exports.getTrafficStats = async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query; // '1h', '24h', '7d'
    let interval = '1 HOUR';
    if (timeRange === '24h') interval = '24 HOURS';
    if (timeRange === '7d') interval = '7 DAYS';

    const result = await db.query(`
      SELECT DATE_TRUNC('minute', timestamp) as time, SUM(payload_size) as total_bytes, COUNT(*) as packets
      FROM traffic_logs
      WHERE timestamp >= NOW() - INTERVAL '${interval}'
      GROUP BY time
      ORDER BY time ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving traffic stats' });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.email as user_email FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.timestamp DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.triggerAttack = async (req, res) => {
  const { targetGatewayId, type, intensity } = req.body;
  if (!targetGatewayId || !type) return res.status(400).json({ message: 'Gateway ID and Attack Type required' });
  
  try {
    const result = await db.query(
      `INSERT INTO attack_logs (target_gateway_id, type, intensity) VALUES ($1, $2, $3) RETURNING *`,
      [targetGatewayId, type, intensity || 'High']
    );

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'ATTACK_SIMULATION_STARTED', `Attack ${type} started on Gateway ${targetGatewayId}`, req.ip]);

    // Send an immediate alert
    await db.query(
        `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
        [targetGatewayId, 'CRITICAL', `Training/Simulation: ${type} attack initiated.`]
    );

    res.json({ message: 'Attack started successfully', attack: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrafficLogs = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const result = await db.query(`
      SELECT t.*, d.name as device_name, g.name as gateway_name 
      FROM traffic_logs t
      LEFT JOIN devices d ON t.device_id = d.id
      LEFT JOIN gateways g ON t.gateway_id = g.id
      ORDER BY t.timestamp DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearLogs = async (req, res) => {
  try {
    // Only Admin can do this
    await db.query(`DELETE FROM traffic_logs`);
    await db.query(`DELETE FROM alerts`);
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.runScenario = async (req, res) => {
  const { name } = req.body;
  const simulationEngine = require('../engines/simulationEngine');
  await simulationEngine.triggerScenario(name || 'Default Recovery Scenario');
  res.json({ message: 'Scenario started' });
};

exports.getPipelines = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, g.name as gateway_name 
      FROM cloud_pipelines p
      LEFT JOIN gateways g ON p.gateway_id = g.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPipeline = async (req, res) => {
  const { id, name, provider, gateway_id } = req.body;
  if (!name || !provider) {
    return res.status(400).json({ message: 'Pipeline Name and Provider are required.' });
  }

  const pipelineId = id || 'PL-' + provider.toUpperCase() + '-' + Math.floor(Math.random() * 1000);

  try {
    const existing = await db.query('SELECT id FROM cloud_pipelines WHERE id = $1', [pipelineId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Pipeline with this ID already exists.' });
    }

    const result = await db.query(
      `INSERT INTO cloud_pipelines (id, name, provider, gateway_id, status)
       VALUES ($1, $2, $3, $4, 'connected') RETURNING *`,
      [pipelineId, name, provider, gateway_id || null]
    );

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'PIPELINE_CREATED', `Cloud pipeline ${pipelineId} created`, req.ip]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePipeline = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM cloud_pipelines WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pipeline not found.' });
    }

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'PIPELINE_DELETED', `Cloud pipeline ${id} deleted`, req.ip]);

    res.json({ message: 'Cloud pipeline deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePipelineStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const result = await db.query(
      'UPDATE cloud_pipelines SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pipeline not found.' });
    }

    const pipeline = result.rows[0];

    await db.query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`, 
      [req.user.id, 'PIPELINE_STATUS_CHANGED', `Pipeline ${id} status set to ${status}`, req.ip]);

    if (status === 'disconnected') {
      await db.query(
        `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
        [pipeline.gateway_id, 'CRITICAL', `Cloud pipeline ${id} was disconnected. Transmission pipelines are dropping packets!`]
      );
    } else if (status === 'connected') {
      await db.query(
        `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
        [pipeline.gateway_id, 'INFO', `Cloud pipeline ${id} has successfully established connection. Flow stabilized.`]
      );
    }

    res.json(pipeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

