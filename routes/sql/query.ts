// [GOV][SQL][UNIFIED-QUERY][SQL-QUERY-001][v3.0][LIVE]
// Grepable: [gov-sql-unified-query-sql-query-001-v3.0-live]
// routes/sql/query.ts - Unified SQL query endpoint with Bun SQL integration
// 🛡️ **Maintainers**: @syndicate-gov/sql-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SQL][UNIFIED-QUERY][TYPESCRIPT]
// 📊 **Coverage**: Unified SQL query interface with PostgreSQL integration

import { z } from 'zod';
import { Database } from 'bun:sqlite';

// SQL query request schema
const SQLQueryRequestSchema = z.object({
  query: z.string().min(1),
  parameters: z.array(z.any()).optional().default([]),
  type: z.enum(['select', 'insert', 'update', 'delete', 'procedure']).optional().default('select'),
  timeout: z.number().optional().default(30000)
});

// SQL query response schema
const SQLQueryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    rows: z.array(z.record(z.any())),
    rowCount: z.number(),
    columns: z.array(z.object({
      name: z.string(),
      type: z.string()
    })),
    executionTime: z.number(),
    queryType: z.string()
  }),
  metadata: z.object({
    database: z.string(),
    timestamp: z.string().datetime(),
    transactionId: z.string().uuid().optional()
  })
});

// SQL error schema
const SQLErrorSchema = z.object({
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.string().optional(),
    query: z.string(),
    timestamp: z.string().datetime()
  })
});

type SQLQueryRequest = z.infer<typeof SQLQueryRequestSchema>;
type SQLQueryResponse = z.infer<typeof SQLQueryResponseSchema>;

// Initialize database connection (using SQLite for demo, configurable for PostgreSQL)
let db: Database;

try {
  // In production, this would connect to PostgreSQL via DATABASE_URL
  db = new Database(':memory:');
  
  // Create sample tables for demonstration
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    INSERT OR IGNORE INTO users (username, email, role) VALUES 
      ('admin', 'admin@syndicate.gov', 'admin'),
      ('nolarose', 'nolarose@syndicate.gov', 'manager'),
      ('agent1', 'agent1@syndicate.gov', 'agent');
      
    INSERT OR IGNORE INTO analytics (event_type, user_id, metadata) VALUES 
      ('login', 1, '{"ip": "127.0.0.1"}'),
      ('bet_placed', 2, '{"amount": 100}'),
      ('report_generated', 1, '{"type": "daily"}');
  `);
  
} catch (error) {
  console.error('Database initialization failed:', error);
}

export const handle = async (req: Request) => {
  const startTime = Date.now();
  
  try {
    const body = await req.json() as SQLQueryRequest;
    const validated = SQLQueryRequestSchema.parse(body);
    
    // Validate query safety (basic SQL injection prevention)
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperQuery = validated.query.toUpperCase();
    
    if (validated.type === 'select' && dangerousKeywords.some(keyword => upperQuery.includes(keyword))) {
      throw new Error('Dangerous SQL keywords detected in SELECT query');
    }
    
    let result;
    const executionTime = Date.now() - startTime;
    
    switch (validated.type) {
      case 'select':
        result = db.query(validated.query).all();
        break;
      case 'insert':
        result = db.run(validated.query, ...validated.parameters);
        break;
      case 'update':
        result = db.run(validated.query, ...validated.parameters);
        break;
      case 'delete':
        result = db.run(validated.query, ...validated.parameters);
        break;
      default:
        throw new Error(`Unsupported query type: ${validated.type}`);
    }
    
    // Get column information
    const columns = [];
    if (Array.isArray(result) && result.length > 0) {
      const firstRow = result[0];
      for (const key in firstRow) {
        columns.push({
          name: key,
          type: typeof firstRow[key]
        });
      }
    }
    
    const response: SQLQueryResponse = {
      success: true,
      data: {
        rows: Array.isArray(result) ? result : [],
        rowCount: Array.isArray(result) ? result.length : (result?.changes || 0),
        columns,
        executionTime,
        queryType: validated.type
      },
      metadata: {
        database: 'sqlite-demo', // In production: 'postgresql'
        timestamp: new Date().toISOString(),
        transactionId: crypto.randomUUID()
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Query-Type': validated.type,
        'X-Execution-Time': executionTime.toString(),
        'X-Row-Count': response.data.rowCount.toString(),
        'X-Database': response.metadata.database
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'SQL_ERROR',
        message: error.message,
        details: error.stack,
        query: body?.query || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Error': 'true'
      }
    });
  }
};
