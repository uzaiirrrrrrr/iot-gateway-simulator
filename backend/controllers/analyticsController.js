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
