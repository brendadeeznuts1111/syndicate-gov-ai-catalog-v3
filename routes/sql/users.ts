// [GOV][SQL][USERS-LIST][SQL-USERS-001][v3.0][LIVE]
// Grepable: [gov-sql-users-list-sql-users-001-v3.0-live]
// routes/sql/users.ts - SQL-based user management endpoint
// 🛡️ **Maintainers**: @syndicate-gov/sql-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SQL][USERS-LIST][TYPESCRIPT]
// 📊 **Coverage**: SQL-powered user listing with pagination and filtering

import { z } from 'zod';
import { Database } from 'bun:sqlite';

// Query parameters schema
const SQLUsersParamsSchema = z.object({
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
  role: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['id', 'username', 'email', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Response schema
const SQLUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    users: z.array(z.object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
      role: z.string(),
      created_at: z.string(),
      last_login: z.string().optional(),
      is_active: z.boolean()
    })),
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      total: z.number(),
      hasMore: z.boolean()
    }),
    filters: z.object({
      role: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.string(),
      sortOrder: z.string()
    })
  }),
  metadata: z.object({
    query: z.string(),
    executionTime: z.number(),
    timestamp: z.string().datetime()
  })
});

type SQLUsersParams = z.infer<typeof SQLUsersParamsSchema>;
type SQLUsersResponse = z.infer<typeof SQLUsersResponseSchema>;

// Initialize database connection
const db = new Database(':memory:');

// Ensure users table exists and has sample data
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
  );
  
  INSERT OR IGNORE INTO users (username, email, role, last_login, is_active) VALUES 
    ('admin', 'admin@syndicate.gov', 'admin', datetime('now', '-1 hour'), 1),
    ('nolarose', 'nolarose@syndicate.gov', 'manager', datetime('now', '-30 minutes'), 1),
    ('agent_smith', 'agent.smith@syndicate.gov', 'agent', datetime('now', '-2 hours'), 1),
    ('jane_doe', 'jane.doe@syndicate.gov', 'agent', datetime('now', '-1 day'), 0),
    ('bob_jones', 'bob.jones@syndicate.gov', 'agent', datetime('now', '-3 hours'), 1),
    ('sarah_wilson', 'sarah.wilson@syndicate.gov', 'manager', datetime('now', '-12 hours'), 1);
`);

export const handle = async (req: Request, { query }: { query: Record<string, string> }) => {
  const startTime = Date.now();
  
  try {
    // Validate query parameters
    const params = SQLUsersParamsSchema.parse(query);
    
    // Build dynamic SQL query
    let sqlQuery = 'SELECT id, username, email, role, created_at, last_login, is_active FROM users WHERE 1=1';
    const sqlParams: any[] = [];
    
    // Add filters
    if (params.role) {
      sqlQuery += ' AND role = ?';
      sqlParams.push(params.role);
    }
    
    if (params.search) {
      sqlQuery += ' AND (username LIKE ? OR email LIKE ?)';
      sqlParams.push(`%${params.search}%`, `%${params.search}%`);
    }
    
    // Get total count
    const countQuery = sqlQuery.replace('SELECT id, username, email, role, created_at, last_login, is_active', 'SELECT COUNT(*) as total');
    const countResult = db.query(countQuery).get(sqlParams) as { total: number };
    const total = countResult.total;
    
    // Add sorting and pagination
    sqlQuery += ` ORDER BY ${params.sortBy} ${params.sortOrder.toUpperCase()}`;
    sqlQuery += ' LIMIT ? OFFSET ?';
    sqlParams.push(params.limit, params.offset);
    
    // Execute query
    const users = db.query(sqlQuery).all(sqlParams);
    
    const executionTime = Date.now() - startTime;
    
    const response: SQLUsersResponse = {
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          is_active: Boolean(user.is_active)
        })),
        pagination: {
          limit: params.limit,
          offset: params.offset,
          total,
          hasMore: params.offset + params.limit < total
        },
        filters: {
          role: params.role,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      },
      metadata: {
        query: sqlQuery,
        executionTime,
        timestamp: new Date().toISOString()
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Execution-Time': executionTime.toString(),
        'X-User-Count': users.length.toString(),
        'X-Total-Users': total.toString(),
        'X-Has-More': response.data.pagination.hasMore.toString(),
        'Cache-Control': 'private, max-age=30'
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'SQL_USERS_ERROR',
        message: error.message,
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
