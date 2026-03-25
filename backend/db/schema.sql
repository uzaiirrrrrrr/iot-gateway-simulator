-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Viewer', -- Admin, User, Viewer
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gateways (
  id VARCHAR(50) PRIMARY KEY, -- e.g. GTW-1234
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline',
  last_heartbeat TIMESTAMP,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(50) PRIMARY KEY, -- e.g. DEV-5678
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traffic_logs (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  payload_size INT,
  is_secure BOOLEAN, -- true for TLS, false for HTTP
  latency INT, -- in ms
  status VARCHAR(50), -- success, failed
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  severity VARCHAR(50), -- INFO, WARNING, ERROR, CRITICAL
  message TEXT,
  status VARCHAR(50) DEFAULT 'unread',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attack_logs (
  id SERIAL PRIMARY KEY,
  target_gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  type VARCHAR(100), -- DDoS, Injection, etc.
  intensity VARCHAR(50), -- Low, Medium, High
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  scenario_type VARCHAR(100),
  settings JSONB,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP
);
