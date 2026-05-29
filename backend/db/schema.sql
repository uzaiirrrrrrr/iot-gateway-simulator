-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Viewer', -- Admin, User, Viewer
  status VARCHAR(50) DEFAULT 'active',
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  device_otp VARCHAR(255),
  device_otp_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gateways (
  id VARCHAR(50) PRIMARY KEY, -- e.g. GTW-1234
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline',
  last_heartbeat TIMESTAMP,
  heartbeat_interval INT DEFAULT 10,
  traffic_rate INT DEFAULT 5000,
  is_enabled BOOLEAN DEFAULT true,
  is_secure BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(50) PRIMARY KEY, -- e.g. DEV-5678
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  last_payload TEXT,
  metadata JSONB DEFAULT '{}',
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
  payload TEXT,
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
CREATE TABLE IF NOT EXISTS gateway_status_logs (
  id SERIAL PRIMARY KEY,
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS heartbeat_logs (
  id SERIAL PRIMARY KEY,
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloud_pipelines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'AWS', 'Azure', 'Custom'
  status VARCHAR(50) DEFAULT 'connected', -- 'connected', 'disconnected', 'reconnecting'
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS cloud_storage_logs (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
  gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
  payload TEXT,
  stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


