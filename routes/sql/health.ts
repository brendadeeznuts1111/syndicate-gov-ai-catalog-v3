// [GOV][SQL][HEALTH-CHECK][SQL-HEALTH-001][v3.0][LIVE]
// Grepable: [gov-sql-health-check-sql-health-001-v3.0-live]
// routes/sql/health.ts - Database health and performance monitoring
// 🛡️ **Maintainers**: @syndicate-gov/sql-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SQL][HEALTH-CHECK][TYPESCRIPT]
// 📊 **Coverage**: Database health metrics and performance monitoring

import { z } from 'zod';
import { Database } from 'bun:sqlite';

// Response schema
const SQLHealthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    database: z.object({
      type: z.string(),
      version: z.string(),
      size: z.string(),
      connectionPool: z.object({
        active: z.number(),
        idle: z.number(),
        total: z.number()
      })
    }),
    performance: z.object({
      queryTime: z.number(),
      connections: z.number(),
      cacheHitRate: z.number(),
      slowQueries: z.number()
    }),
    tables: z.array(z.object({
      name: z.string(),
      rowCount: z.number(),
      size: z.string()
    })),
    uptime: z.string(),
    lastCheck: z.string().datetime()
  })
});

type SQLHealthResponse = z.infer<typeof SQLHealthResponseSchema>;

// Initialize database connection
const db = new Database(':memory:');

// Create sample tables for health monitoring
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    user_id INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS health_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    query_time INTEGER
  );
  
  INSERT OR IGNORE INTO users (username, email, role) VALUES 
    ('admin', 'admin@syndicate.gov', 'admin'),
    ('nolarose', 'nolarose@syndicate.gov', 'manager'),
    ('agent_smith', 'agent.smith@syndicate.gov', 'agent');
    
  INSERT OR IGNORE INTO analytics (event_type, user_id, metadata) VALUES 
    ('login', 1, '{"ip": "127.0.0.1"}'),
    ('bet_placed', 2, '{"amount": 100}'),
    ('report_generated', 1, '{"type": "daily"}');
`);

// Track startup time
const startTime = new Date().toISOString();

export const handle = async (req: Request) => {
  const queryStartTime = Date.now();
  
  try {
    // Perform health check queries
    const testQuery = 'SELECT 1 as test';
    const testResult = db.query(testQuery).get();
    
    // Get table information
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    
    const tableInfo = tables.map(table => {
      const count = db.query(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      return {
        name: table.name,
        rowCount: count.count,
        size: '~1KB' // SQLite doesn't provide size info easily
      };
    });
    
    // Get database info
    const dbInfo = {
      type: 'SQLite',
      version: '3.x', // SQLite version
      size: '~1MB',   // In-memory database
      connectionPool: {
        active: 1,
        idle: 0,
        total: 1
      }
    };
    
    // Performance metrics
    const queryTime = Date.now() - queryStartTime;
    const performance = {
      queryTime,
      connections: 1,
      cacheHitRate: 0.95, // Mock cache hit rate
      slowQueries: 0
    };
    
    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (queryTime > 1000) status = 'degraded';
    if (queryTime > 5000) status = 'unhealthy';
    
    // Log health check
    db.run(
      'INSERT INTO health_log (status, query_time) VALUES (?, ?)',
      status,
      queryTime
    );
    
    const response: SQLHealthResponse = {
      success: true,
      data: {
        status,
        database: dbInfo,
        performance,
        tables: tableInfo,
        uptime: startTime,
        lastCheck: new Date().toISOString()
      }
    };
    
    // Set HTTP status based on health
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return new Response(JSON.stringify(response), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Health-Status': status,
        'X-Query-Time': queryTime.toString(),
        'X-Table-Count': tables.length.toString(),
        'X-Database-Type': dbInfo.type,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'SQL_HEALTH_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Health-Status': 'unhealthy',
        'X-SQL-Error': 'true'
      }
    });
  }
};
