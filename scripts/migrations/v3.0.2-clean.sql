-- Migration: v3.0.2 - Enhanced Production Schema
-- Expand users table
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN preferences TEXT;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN last_login DATETIME;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  bio TEXT,
  website TEXT,
  location TEXT,
  company TEXT,
  social_links TEXT,
  skills TEXT,
  interests TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  refresh_expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create api_logs table
CREATE TABLE api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id INTEGER,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_headers TEXT,
  request_body TEXT,
  response_body TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

-- Expand analytics table
ALTER TABLE analytics ADD COLUMN category TEXT;
ALTER TABLE analytics ADD COLUMN severity TEXT;
ALTER TABLE analytics ADD COLUMN tags TEXT;
ALTER TABLE analytics ADD COLUMN duration INTEGER;
ALTER TABLE analytics ADD COLUMN success BOOLEAN DEFAULT TRUE;
ALTER TABLE analytics ADD COLUMN error_details TEXT;

-- Create performance_metrics table
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  tags TEXT,
  metadata TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create rules table
CREATE TABLE rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_hash TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL,
  type TEXT NOT NULL,
  variant TEXT,
  id_prefix TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  confidence_score REAL,
  generated_by TEXT,
  approved_by INTEGER,
  approved_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_api_logs_path ON api_logs(path);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);

-- Create views
CREATE VIEW active_users AS
SELECT u.*, up.bio, up.website
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.status = 'active';

-- Insert sample data
INSERT INTO user_profiles (user_id, bio, website, location, company)
SELECT id, 'System user', 'https://syndicate.gov', 'HQ', 'Syndicate GOV' FROM users;

INSERT INTO performance_metrics (metric_type, metric_name, value, unit, tags)
VALUES ('ai_generation', 'header_generation', 0.07, 'ms', '["production"]');

-- Mark migration complete
CREATE TABLE schema_version (version TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP);
INSERT INTO schema_version (version) VALUES ('3.0.2');
