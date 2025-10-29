import { z } from 'zod';
import { getDatabase } from '../../src/database/index.js';

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

// Track startup time
const startTime = new Date().toISOString();

export const handle = async (req: Request) => {
  const queryStartTime = Date.now();

  try {
    const db = getDatabase();

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
