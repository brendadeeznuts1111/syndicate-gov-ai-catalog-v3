// Database schema migration - v3.0.2 - Enhanced Schema
// [GOV][SQL][MIGRATION][SCHEMA-V3.0.2][v3.0][LIVE]
// Grepable: [gov-sql-migration-schema-v3.0.2-v3.0-live]
// scripts/migrations/v3.0.2-enhanced-schema.sql - Comprehensive database schema expansion
// 🛡️ **Maintainers**: @syndicate-gov/sql-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SQL][MIGRATION][SCHEMA][DATABASE]
// 📊 **Coverage**: Enhanced database schema with 8 tables for production deployment

-- Migration: v3.0.2 - Enhanced Production Schema
-- Date: 2025-10-29
-- Description: Expand database schema for production deployment

-- ==========================================
-- USER MANAGEMENT EXPANSION
-- ==========================================

-- Add new columns to users table
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN preferences TEXT; -- JSON preferences
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN last_login DATETIME;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create user_profiles table for extended user data
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  bio TEXT,
  website TEXT,
  location TEXT,
  company TEXT,
  social_links TEXT, -- JSON object
  skills TEXT, -- JSON array
  interests TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ==========================================
-- SESSION MANAGEMENT
-- ==========================================

-- Create sessions table for JWT management
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  device_info TEXT, -- JSON device information
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  refresh_expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create session_logs table for audit trail
CREATE TABLE session_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  user_id INTEGER,
  action TEXT NOT NULL, -- login, logout, refresh, expired, etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- ==========================================
-- API AUDIT & LOGGING
-- ==========================================

-- Create api_logs table for comprehensive audit trail
CREATE TABLE api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id INTEGER,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  request_size INTEGER,
  response_size INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_headers TEXT, -- JSON
  request_body TEXT, -- JSON (sanitized)
  response_body TEXT, -- JSON (sanitized)
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

-- Create api_metrics table for aggregated metrics
CREATE TABLE api_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  avg_response_time REAL DEFAULT 0,
  min_response_time INTEGER DEFAULT 0,
  max_response_time INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 100.0,
  last_request DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint, method)
);

-- ==========================================
-- RULES & CONFIGURATION MANAGEMENT
-- ==========================================

-- Create rules table for AI-generated governance rules
CREATE TABLE rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_hash TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL, -- GOV, SEC, OPS, etc.
  type TEXT NOT NULL, -- RULES, SCRIPT, CONFIG, etc.
  variant TEXT, -- EXPANDED, COMPACT, LIVE, etc.
  id_prefix TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full rule content
  metadata TEXT, -- JSON AI generation metadata
  confidence_score REAL,
  generated_by TEXT, -- AI model/version
  approved_by INTEGER,
  approved_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Create config_versions table for YAML configuration management
CREATE TABLE config_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_hash TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL,
  type TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL, -- Full YAML content
  metadata TEXT, -- JSON metadata
  generated_by INTEGER,
  approved_by INTEGER,
  is_active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
);

-- ==========================================
-- PERFORMANCE & ANALYTICS ENHANCEMENT
-- ==========================================

-- Expand analytics table with more detailed event tracking
ALTER TABLE analytics ADD COLUMN category TEXT;
ALTER TABLE analytics ADD COLUMN severity TEXT;
ALTER TABLE analytics ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE analytics ADD COLUMN duration INTEGER; -- for performance events
ALTER TABLE analytics ADD COLUMN success BOOLEAN DEFAULT TRUE;
ALTER TABLE analytics ADD COLUMN error_details TEXT;

-- Create performance_metrics table for detailed performance tracking
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, -- ai_generation, api_response, database_query, etc.
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL, -- ms, ops/sec, MB, etc.
  tags TEXT, -- JSON tags for filtering
  metadata TEXT, -- JSON additional context
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create performance_aggregates table for historical aggregates
CREATE TABLE performance_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  time_bucket TEXT NOT NULL, -- 1m, 5m, 1h, 1d
  bucket_start DATETIME NOT NULL,
  bucket_end DATETIME NOT NULL,
  count INTEGER DEFAULT 0,
  avg_value REAL,
  min_value REAL,
  max_value REAL,
  p50_value REAL,
  p95_value REAL,
  p99_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_type, metric_name, time_bucket, bucket_start)
);

-- ==========================================
-- WEBSOCKET & REAL-TIME FEATURES
-- ==========================================

-- Create websocket_connections table
CREATE TABLE websocket_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  session_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disconnected_at DATETIME,
  last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  bytes_sent INTEGER DEFAULT 0,
  bytes_received INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

-- Create websocket_messages table for message history
CREATE TABLE websocket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  direction TEXT NOT NULL, -- sent, received
  content TEXT,
  metadata TEXT, -- JSON metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES websocket_connections (connection_id) ON DELETE CASCADE
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Sessions table indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_active);

-- API logs indexes
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_session_id ON api_logs(session_id);
CREATE INDEX idx_api_logs_path ON api_logs(path);
CREATE INDEX idx_api_logs_method ON api_logs(method);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_category ON analytics(category);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);

-- Rules indexes
CREATE INDEX idx_rules_scope ON rules(scope);
CREATE INDEX idx_rules_type ON rules(type);
CREATE INDEX idx_rules_status ON rules(status);
CREATE INDEX idx_rules_is_active ON rules(is_active);
CREATE INDEX idx_rules_hash ON rules(rule_hash);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- WebSocket indexes
CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_connected_at ON websocket_connections(connected_at);
CREATE INDEX idx_websocket_messages_connection_id ON websocket_messages(connection_id);
CREATE INDEX idx_websocket_messages_timestamp ON websocket_messages(timestamp);

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- Active users view
CREATE VIEW active_users AS
SELECT
  u.*,
  up.bio,
  up.website,
  up.location,
  up.company,
  s.session_token,
  s.last_activity
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN sessions s ON u.id = s.user_id AND s.is_active = TRUE
WHERE u.status = 'active';

-- Recent API activity view
CREATE VIEW recent_api_activity AS
SELECT
  al.*,
  u.username,
  u.email
FROM api_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.created_at >= datetime('now', '-24 hours')
ORDER BY al.created_at DESC;

-- Performance summary view
CREATE VIEW performance_summary AS
SELECT
  metric_type,
  metric_name,
  COUNT(*) as total_measurements,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  strftime('%Y-%m-%d %H:00:00', timestamp) as hour_bucket
FROM performance_metrics
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY metric_type, metric_name, hour_bucket
ORDER BY hour_bucket DESC, metric_type, metric_name;

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Update updated_at timestamp on users table
CREATE TRIGGER update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Update updated_at timestamp on user_profiles table
CREATE TRIGGER update_user_profiles_updated_at
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Auto-update session last_activity
CREATE TRIGGER update_session_last_activity
  AFTER UPDATE ON sessions
  FOR EACH ROW
  BEGIN
    UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Log session events
CREATE TRIGGER log_session_events
  AFTER INSERT ON sessions
  FOR EACH ROW
  BEGIN
    INSERT INTO session_logs (session_id, user_id, action, ip_address, user_agent, metadata)
    VALUES (NEW.id, NEW.user_id, 'login', NEW.ip_address, NEW.user_agent,
            json_object('device_info', NEW.device_info));
  END;

CREATE TRIGGER log_session_logout
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN NEW.is_active = FALSE AND OLD.is_active = TRUE
  BEGIN
    INSERT INTO session_logs (session_id, user_id, action, metadata)
    VALUES (NEW.id, NEW.user_id, 'logout', json_object('last_activity', NEW.last_activity));
  END;

-- ==========================================
-- INITIAL DATA SEEDING
-- ==========================================

-- Insert sample data for testing
INSERT INTO user_profiles (user_id, bio, website, location, company, skills, interests)
SELECT
  id,
  CASE username
    WHEN 'admin' THEN 'System administrator and AI governance lead'
    WHEN 'nolarose' THEN 'Manager and operations specialist'
    ELSE 'AI agent for automated governance'
  END,
  CASE username
    WHEN 'admin' THEN 'https://syndicate.gov/admin'
    WHEN 'nolarose' THEN 'https://syndicate.gov/nolarose'
    ELSE 'https://syndicate.gov/' || username
  END,
  'Syndicate HQ',
  'Syndicate GOV',
  '["AI", "Governance", "Security"]',
  '["Automation", "Blockchain", "Quantum Computing"]'
FROM users;

-- Insert sample performance metrics
INSERT INTO performance_metrics (metric_type, metric_name, value, unit, tags, metadata)
VALUES
  ('ai_generation', 'header_generation', 0.07, 'ms', '["production", "v3.0"]', '{"confidence": 0.978, "model": "wasm"}'),
  ('ai_generation', 'yaml_generation', 0.07, 'ms', '["production", "v3.0"]', '{"confidence": 0.978, "model": "wasm"}'),
  ('api_response', 'sql_query', 1.0, 'ms', '["database", "sqlite"]', '{"query_type": "select"}'),
  ('system', 'memory_usage', 45.0, 'MB', '["rss"]', '{"heap_used": 4, "heap_total": 7}');

-- Insert sample API metrics
INSERT INTO api_metrics (endpoint, method, total_requests, avg_response_time, success_rate, last_request)
VALUES
  ('/api/sql/health', 'GET', 5, 1.2, 100.0, CURRENT_TIMESTAMP),
  ('/api/sql/query', 'POST', 15, 2.1, 100.0, CURRENT_TIMESTAMP),
  ('/api/sql/users', 'GET', 3, 1.8, 100.0, CURRENT_TIMESTAMP),
  ('/api/sql/analytics', 'GET', 2, 3.2, 100.0, CURRENT_TIMESTAMP);

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Update database version
CREATE TABLE schema_version (
  version TEXT PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('3.0.2', 'Enhanced production schema with 8 tables, comprehensive audit logging, and performance tracking');
