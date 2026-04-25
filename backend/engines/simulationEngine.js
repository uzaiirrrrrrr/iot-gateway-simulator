const db = require('../db');
const crypto = require('node:crypto');

class SimulationEngine {
  constructor() {
    this.trafficInterval = null;
    this.healthInterval = null;
    this.defaultTrafficRate = 5000;
  }

  start() {
    console.log('[SimulationEngine] Starting engines...');
    console.log('[SimulationEngine] Crypto check:', typeof crypto.randomBytes === 'function' ? 'OK' : 'FAIL');
    // Poll health every 5s, but check against individual HB intervals
    this.healthInterval = setInterval(() => this.checkGatewaysHealth(), 5000);
    // Poll traffic frequently (every 1s), but only fire for gateways based on their traffic_rate
    this.trafficInterval = setInterval(() => this.generateTraffic(), 1000);
    // Send heartbeats every 2s
    this.hbInterval = setInterval(() => this.sendHeartbeats(), 2000);
    
    this.lastTrafficFire = {}; // Track last fire time per gateway
    this.lastHeartbeatFire = {}; // Track last heartbeat time per gateway
  }

  async sendHeartbeats() {
    try {
        const enabledGateways = await db.query(`SELECT id, heartbeat_interval FROM gateways WHERE is_enabled = true`);
        const now = Date.now();
        
        for (let gw of enabledGateways.rows) {
            const lastHb = this.lastHeartbeatFire[gw.id] || 0;
            const intervalMs = (gw.heartbeat_interval || 10) * 1000;

            if (now - lastHb >= intervalMs) {
                // Update heartbeat timestamp
                await db.query(`UPDATE gateways SET last_heartbeat = NOW() WHERE id = $1`, [gw.id]);
                await db.query(`INSERT INTO heartbeat_logs (gateway_id) VALUES ($1)`, [gw.id]);
                this.lastHeartbeatFire[gw.id] = now;

                // Auto-recovery: If it was offline but is enabled and sending heartbeats, mark it online
                const currentGw = await db.query('SELECT status FROM gateways WHERE id = $1', [gw.id]);
                if (currentGw.rows[0].status === 'offline') {
                    await db.query(`UPDATE gateways SET status = 'online' WHERE id = $1`, [gw.id]);
                    await db.query(`INSERT INTO gateway_status_logs (gateway_id, old_status, new_status, reason) 
                                   VALUES ($1, 'offline', 'online', 'Heartbeat detected - Auto-recovery sequence')`, [gw.id]);
                    await db.query(
                        `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
                        [gw.id, 'INFO', `Gateway ${gw.id} has recovered and is now back online.`]
                    );
                }
            }
        }
    } catch (e) {
        console.error('[Engine Error] Heartbeat sender:', e);
    }
  }

  async checkGatewaysHealth() {
    try {
      const gateways = await db.query('SELECT * FROM gateways WHERE is_enabled = true');
      for (let gw of gateways.rows) {
        const now = new Date();
        const lastHb = new Date(gw.last_heartbeat || now);
        const diff = (now - lastHb) / 1000;
        const threshold = (gw.heartbeat_interval || 10) * 3; 

        if (diff > threshold && gw.status === 'online') {
          await db.query(`UPDATE gateways SET status = 'offline' WHERE id = $1`, [gw.id]);
          await db.query(`INSERT INTO gateway_status_logs (gateway_id, old_status, new_status, reason) 
                         VALUES ($1, 'online', 'offline', 'Heartbeat timeout threshold exceeded')`, [gw.id]);
          await db.query(
            `INSERT INTO alerts (gateway_id, severity, message) VALUES ($1, $2, $3)`,
            [gw.id, 'CRITICAL', `Gateway ${gw.id} missed multiple heartbeats and is now offline.`]
          );
        }
      }
    } catch (error) {
      console.error('[Engine Error] Health check:', error);
    }
  }

  async generateTraffic() {
    try {
      const activeGateways = await db.query(`SELECT * FROM gateways WHERE status = 'online' AND is_enabled = true`);
      if (activeGateways.rows.length === 0) return;

      const now = Date.now();

      for (let gw of activeGateways.rows) {
        const lastFire = this.lastTrafficFire[gw.id] || 0;
        const rate = gw.traffic_rate || this.defaultTrafficRate;

        if (now - lastFire < rate) continue;
        this.lastTrafficFire[gw.id] = now;

        const devices = await db.query(`SELECT * FROM devices WHERE gateway_id = $1 AND status = 'active'`, [gw.id]);

        for (let dev of devices.rows) {
          const isSecure = Math.random() > 0.3; 
          const latency = Math.floor(Math.random() * 200) + 10;
          
          // Generate context-aware data
          let payload;
          if (dev.type === 'Sensor') {
              payload = JSON.stringify({ temp: (Math.random()*30 + 10).toFixed(2), hum: (Math.random()*50 + 30).toFixed(0), unit: 'C' });
          } else if (dev.type === 'Camera') {
              payload = `IMAGE_DATA:0x${crypto.randomBytes(16).toString('hex')}`;
          } else if (dev.type === 'Motion') {
              payload = JSON.stringify({ motion: Math.random() > 0.8, zone: 'A1', sensitivity: 0.9 });
          } else {
              payload = `CMD_ACK:${Math.random() > 0.5 ? 'SUCCESS' : 'PENDING'}`;
          }

          const payloadSize = Buffer.byteLength(payload);

          await db.query(
            `INSERT INTO traffic_logs (device_id, gateway_id, payload_size, is_secure, latency, status, payload)
             VALUES ($1, $2, $3, $4, $5, 'success', $6)`,
            [dev.id, dev.gateway_id, payloadSize, isSecure, latency, payload]
          );

          // Update device view with last payload
          await db.query(`UPDATE devices SET last_payload = $1 WHERE id = $2`, [payload, dev.id]);
        }
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
