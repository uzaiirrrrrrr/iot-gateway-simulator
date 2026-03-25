const db = require('../db');

class SimulationEngine {
  constructor() {
    this.trafficInterval = null;
    this.healthInterval = null;
    this.trafficRate = 5000; // 5 seconds default
  }

  start() {
    console.log('[SimulationEngine] Starting engines...');
    this.healthInterval = setInterval(() => this.checkGatewaysHealth(), 10000);
    this.trafficInterval = setInterval(() => this.generateTraffic(), this.trafficRate);
  }

  async checkGatewaysHealth() {
    try {
      const gateways = await db.query('SELECT * FROM gateways WHERE is_enabled = true');
      for (let gw of gateways.rows) {
        const now = new Date();
        const lastHb = new Date(gw.last_heartbeat || now);
        const diff = (now - lastHb) / 1000;
        
        if (diff > 30 && gw.status === 'online') {
          await db.query(`UPDATE gateways SET status = 'offline' WHERE id = $1`, [gw.id]);
          await db.query(
            `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
            [gw.id, 'CRITICAL', `Gateway ${gw.id} missed heartbeat and went offline.`]
          );
        }
      }
    } catch (error) {
      console.error('[Engine Error] Health check:', error);
    }
  }

  async generateTraffic() {
    try {
      const activeGateways = await db.query(`SELECT id FROM gateways WHERE status = 'online' AND is_enabled = true`);
      if (activeGateways.rows.length === 0) return;

      const gwIds = activeGateways.rows.map(g => g.id);
      const devices = await db.query(`SELECT * FROM devices WHERE gateway_id = ANY($1)`, [gwIds]);

      for (let dev of devices.rows) {
        const isSecure = Math.random() > 0.3; // 70% secure
        const payloadSize = Math.floor(Math.random() * 500) + 50; 
        const latency = Math.floor(Math.random() * 200) + 10;
        
        const activeAttacks = await db.query(`SELECT * FROM attack_logs WHERE target_gateway_id = $1 ORDER BY timestamp DESC LIMIT 1`, [dev.gateway_id]);
        
        let finalPayload = payloadSize;
        let finalLatency = latency;
        
        if (activeAttacks.rows.length > 0) {
          const attack = activeAttacks.rows[0];
          const attackAge = (new Date() - new Date(attack.timestamp)) / 1000;
          if (attackAge < 300) { // attack active for 5 minutes
            if (attack.type === 'DDoS') {
              finalPayload += Math.floor(Math.random() * 5000); 
              finalLatency += 500;
            } else if (attack.type === 'Malicious Payload') {
               finalPayload = 9999;
               finalLatency += 200;
            }
          }
        }

        // Anomaly logic
        if (finalPayload > 1000) {
          await db.query(
            `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
            [dev.gateway_id, 'WARNING', `Anomalous payload spike detected from device ${dev.id}: ${finalPayload} bytes`]
          );
        }

        if (finalLatency > 400) {
           await db.query(
            `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
            [dev.gateway_id, 'WARNING', `High latency detected on gateway. Latency: ${finalLatency} ms`]
          );
        }

        await db.query(
          `INSERT INTO traffic_logs (device_id, gateway_id, payload_size, is_secure, latency, status)
           VALUES ($1, $2, $3, $4, $5, 'success')`,
          [dev.id, dev.gateway_id, finalPayload, isSecure, finalLatency]
        );

        // Update heartbeat
        await db.query(`UPDATE gateways SET last_heartbeat = NOW() WHERE id = $1`, [dev.gateway_id]);
      }
    } catch (error) {
      console.error('[Engine Error] Traffic generation:', error);
    }
  }

  async triggerScenario(name) {
    console.log(`[SimulationEngine] Starting scenario: ${name}`);
    // Simulate a rapid sequence of events
    const gws = await db.query('SELECT id FROM gateways WHERE status = \'online\' LIMIT 1');
    if (gws.rows.length === 0) return;
    const gwId = gws.rows[0].id;

    await db.query(`INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`, 
      [gwId, 'INFO', `Scenario "${name}" initiated by operator.`]);

    // Step 1: Small latency spike
    setTimeout(async () => {
      await db.query(`INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`, 
        [gwId, 'WARNING', `Scenario Step 1: Unusual latency detected across regional nodes.`]);
    }, 2000);

    // Step 2: Critical failure
    setTimeout(async () => {
      await db.query(`INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`, 
        [gwId, 'CRITICAL', `Scenario Step 2: DATABASE CONNECTION TIMEOUT - Failing over to secondary.`]);
    }, 7000);

    // Step 3: Resolution
    setTimeout(async () => {
      await db.query(`INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`, 
        [gwId, 'INFO', `Scenario Step 3: Critical systems recovered. Traffic stabilizing.`]);
    }, 15000);
  }
}

module.exports = new SimulationEngine();
