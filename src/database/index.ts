// [GOV][SQL][DATABASE][SQL-DB-001][v3.0][LIVE]
// Grepable: [gov-sql-database-sql-db-001-v3.0-live]
// src/database/index.ts - Unified database connection and schema management
// 🛡️ **Maintainers**: @syndicate-gov/sql-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SQL][DATABASE][TYPESCRIPT]
// 📊 **Coverage**: Unified database connection with schema management and migrations

import { Database } from 'bun:sqlite';

// Database configuration
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  url?: string;
  path?: string;
  pool?: {
    min: number;
    max: number;
    idleTimeout: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  path: ':memory:', // In production: './.citadel/catalog.db'
  pool: {
    min: 2,
    max: 10,
    idleTimeout: 30000
  }
};

// Singleton database instance
let dbInstance: Database | null = null;
let isInitialized = false;

// Schema definitions
const SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      full_name TEXT,
      preferences TEXT,
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      login_attempts INTEGER DEFAULT 0,
      account_locked BOOLEAN DEFAULT FALSE,
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      phone TEXT,
      timezone TEXT DEFAULT 'UTC',
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  user_profiles: `
    CREATE TABLE IF NOT EXISTS user_profiles (
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
  `,

  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
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
  `,

  analytics: `
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      user_id INTEGER,
      metadata TEXT,
      category TEXT,
      severity TEXT,
      tags TEXT,
      duration INTEGER,
      success BOOLEAN DEFAULT TRUE,
      error_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `,

  api_logs: `
    CREATE TABLE IF NOT EXISTS api_logs (
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
  `,

  performance_metrics: `
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_type TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      tags TEXT,
      metadata TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

  rules: `
    CREATE TABLE IF NOT EXISTS rules (
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
  `,

  health_log: `
    CREATE TABLE IF NOT EXISTS health_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      query_time INTEGER
    );
  `
};

// Indexes for performance
const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
  'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
  'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);',
  'CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_logs(path);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);',
  'CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);',
  'CREATE INDEX IF NOT EXISTS idx_rules_scope ON rules(scope);'
];

// Views for common queries
const VIEWS = [
  `CREATE VIEW IF NOT EXISTS active_users AS
   SELECT u.*, up.bio, up.website, up.location
   FROM users u
   LEFT JOIN user_profiles up ON u.id = up.user_id
   WHERE u.status = 'active';`,

  `CREATE VIEW IF NOT EXISTS recent_api_activity AS
   SELECT al.*, u.username
   FROM api_logs al
   LEFT JOIN users u ON al.user_id = u.id
   WHERE al.created_at >= datetime('now', '-24 hours')
   ORDER BY al.created_at DESC;`
];

// Seed data
const SEED_DATA = [
  `INSERT OR IGNORE INTO users (username, email, role) VALUES
   ('admin', 'admin@syndicate.gov', 'admin'),
   ('nolarose', 'nolarose@syndicate.gov', 'manager'),
   ('agent1', 'agent1@syndicate.gov', 'agent');`,

  `INSERT OR IGNORE INTO analytics (event_type, user_id, metadata) VALUES
   ('login', 1, '{"ip": "127.0.0.1"}'),
   ('bet_placed', 2, '{"amount": 100}'),
   ('report_generated', 1, '{"type": "daily"}');`,

  `INSERT OR IGNORE INTO performance_metrics (metric_type, metric_name, value, unit, tags) VALUES
   ('ai_generation', 'header_generation', 0.07, 'ms', '["production", "v3.0"]'),
   ('ai_generation', 'yaml_generation', 0.07, 'ms', '["production", "v3.0"]'),
   ('api_response', 'sql_query', 1.0, 'ms', '["database", "sqlite"]');`
];

export class DatabaseManager {
  private config: DatabaseConfig;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConnection(): Database {
    if (!dbInstance) {
      if (this.config.type === 'sqlite') {
        dbInstance = new Database(this.config.path || ':memory:');
      } else {
        throw new Error('PostgreSQL not yet implemented - use SQLite for now');
      }
    }
    return dbInstance;
  }

  async initialize(): Promise<void> {
    if (isInitialized) return;

    const db = this.getConnection();

    try {
      // Create all tables
      for (const [name, schema] of Object.entries(SCHEMAS)) {
        db.exec(schema);
        console.log(`📋 Created table: ${name}`);
      }

      // Create indexes
      for (const index of INDEXES) {
        db.exec(index);
      }

      // Create views
      for (const view of VIEWS) {
        db.exec(view);
      }

      // Seed data
      for (const seed of SEED_DATA) {
        db.exec(seed);
      }

      // Mark schema version
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version TEXT PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        );
      `);

      db.run(
        'INSERT OR REPLACE INTO schema_version (version, description) VALUES (?, ?)',
        '3.0.2',
        'Enhanced production schema with 8 tables, comprehensive audit logging, and performance tracking'
      );

      isInitialized = true;
      console.log('🗄️ Database initialized with enhanced schema v3.0.2');

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    tables: number;
    connections: number;
    queryTime: number;
  }> {
    const startTime = Date.now();
    const db = this.getConnection();

    try {
      // Test query
      const result = db.query('SELECT 1 as test').get();

      // Get table count
      const tables = db.query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };

      const queryTime = Date.now() - startTime;
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (queryTime > 100) status = 'degraded';
      if (queryTime > 1000) status = 'unhealthy';

      return {
        status,
        tables: tables.count,
        connections: 1, // SQLite doesn't have connection pooling
        queryTime
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        tables: 0,
        connections: 0,
        queryTime: Date.now() - startTime
      };
    }
  }

  async close(): Promise<void> {
    if (dbInstance) {
      // Note: In-memory databases don't need to be closed
      dbInstance = null;
      isInitialized = false;
    }
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();

// Initialize on module load
dbManager.initialize().catch(console.error);

// Export database instance for direct use
export const getDatabase = () => dbManager.getConnection();
