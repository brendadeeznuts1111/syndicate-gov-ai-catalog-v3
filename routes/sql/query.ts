import { z } from 'zod';
import { getDatabase } from '../../src/database/index.js';

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

export const handle = async (req: Request) => {
  const startTime = Date.now();
  
  try {
    const db = getDatabase();
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
