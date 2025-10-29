import { z } from 'zod';
import { getDatabase } from '../../src/database/index.js';

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

export const handle = async (req: Request, { query }: { query: Record<string, string> }) => {
  const startTime = Date.now();
  
  try {
    const db = getDatabase();
    // Validate query parameters
    const params = SQLUsersParamsSchema.parse(query);
    
    // Build dynamic SQL query
    let sqlQuery = 'SELECT id, username, email, role, created_at, last_login, status FROM users WHERE 1=1';
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
    const countQuery = sqlQuery.replace('SELECT id, username, email, role, created_at, last_login, status', 'SELECT COUNT(*) as total');
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
          is_active: user.status === 'active' // Map status to is_active for backward compatibility
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
