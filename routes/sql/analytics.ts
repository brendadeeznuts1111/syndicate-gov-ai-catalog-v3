import { z } from 'zod';
import { getDatabase } from '../../src/database/index.js';

// Query parameters schema
const SQLAnalyticsParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventType: z.string().optional(),
  userId: z.coerce.number().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'event_type', 'user']).optional().default('day'),
  limit: z.coerce.number().optional().default(100)
});

// Response schema
const SQLAnalyticsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    analytics: z.array(z.record(z.any())),
    summary: z.object({
      totalEvents: z.number(),
      dateRange: z.object({
        start: z.string(),
        end: z.string()
      }),
      topEventTypes: z.array(z.object({
        type: z.string(),
        count: z.number()
      })),
      activeUsers: z.number()
    })
  }),
  metadata: z.object({
    query: z.string(),
    executionTime: z.number(),
    timestamp: z.string().datetime()
  })
});

type SQLAnalyticsParams = z.infer<typeof SQLAnalyticsParamsSchema>;
type SQLAnalyticsResponse = z.infer<typeof SQLAnalyticsResponseSchema>;

export const handle = async (req: Request, { query }: { query: Record<string, string> }) => {
  const startTime = Date.now();
  
  try {
    const db = getDatabase();
    // Validate query parameters
    const params = SQLAnalyticsParamsSchema.parse(query);
    
    // Build base query
    let baseQuery = 'SELECT a.*, u.username FROM analytics a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1';
    const queryParams: any[] = [];
    
    // Add date filters
    if (params.startDate) {
      baseQuery += ' AND a.created_at >= ?';
      queryParams.push(params.startDate);
    }
    
    if (params.endDate) {
      baseQuery += ' AND a.created_at <= ?';
      queryParams.push(params.endDate);
    }
    
    // Add event type filter
    if (params.eventType) {
      baseQuery += ' AND a.event_type = ?';
      queryParams.push(params.eventType);
    }
    
    // Add user filter
    if (params.userId) {
      baseQuery += ' AND a.user_id = ?';
      queryParams.push(params.userId);
    }
    
    // Get summary statistics
    const summaryQuery = baseQuery.replace('SELECT a.*, u.username', 'SELECT COUNT(*) as totalEvents, COUNT(DISTINCT a.user_id) as activeUsers');
    const summary = db.query(summaryQuery).get(queryParams) as { totalEvents: number; activeUsers: number };
    
    // Get top event types
    const topEventsQuery = baseQuery.replace('SELECT a.*, u.username', 'SELECT a.event_type as type, COUNT(*) as count').replace('WHERE 1=1', 'WHERE 1=1 GROUP BY a.event_type ORDER BY count DESC LIMIT 5');
    const topEventTypes = db.query(topEventsQuery).all(queryParams);
    
    // Build analytics query based on grouping
    let analyticsQuery: string;
    
    switch (params.groupBy) {
      case 'day':
        analyticsQuery = baseQuery.replace('SELECT a.*, u.username', "SELECT DATE(a.created_at) as date, COUNT(*) as events, COUNT(DISTINCT a.user_id) as uniqueUsers").replace('WHERE 1=1', 'WHERE 1=1 GROUP BY DATE(a.created_at) ORDER BY date DESC');
        break;
      case 'week':
        analyticsQuery = baseQuery.replace('SELECT a.*, u.username', "SELECT strftime('%Y-W%W', a.created_at) as week, COUNT(*) as events, COUNT(DISTINCT a.user_id) as uniqueUsers").replace('WHERE 1=1', 'WHERE 1=1 GROUP BY strftime('%Y-W%W', a.created_at) ORDER BY week DESC');
        break;
      case 'month':
        analyticsQuery = baseQuery.replace('SELECT a.*, u.username', "SELECT strftime('%Y-%m', a.created_at) as month, COUNT(*) as events, COUNT(DISTINCT a.user_id) as uniqueUsers").replace('WHERE 1=1', 'WHERE 1=1 GROUP BY strftime('%Y-%m', a.created_at) ORDER BY month DESC');
        break;
      case 'event_type':
        analyticsQuery = baseQuery.replace('SELECT a.*, u.username', 'SELECT a.event_type, COUNT(*) as events, COUNT(DISTINCT a.user_id) as uniqueUsers').replace('WHERE 1=1', 'WHERE 1=1 GROUP BY a.event_type ORDER BY events DESC');
        break;
      case 'user':
        analyticsQuery = baseQuery.replace('SELECT a.*, u.username', 'SELECT u.username, COUNT(*) as events, a.event_type').replace('WHERE 1=1', 'WHERE 1=1 GROUP BY u.username, a.event_type ORDER BY events DESC');
        break;
      default:
        analyticsQuery = baseQuery;
    }
    
    // Add limit
    analyticsQuery += ` LIMIT ${params.limit}`;
    
    // Execute analytics query
    const analytics = db.query(analyticsQuery).all(queryParams);
    
    const executionTime = Date.now() - startTime;
    
    const response: SQLAnalyticsResponse = {
      success: true,
      data: {
        analytics,
        summary: {
          totalEvents: summary.totalEvents,
          dateRange: {
            start: params.startDate || 'all time',
            end: params.endDate || 'now'
          },
          topEventTypes: topEventTypes.map((event: any) => ({
            type: event.type,
            count: event.count
          })),
          activeUsers: summary.activeUsers
        }
      },
      metadata: {
        query: analyticsQuery,
        executionTime,
        timestamp: new Date().toISOString()
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-SQL-Execution-Time': executionTime.toString(),
        'X-Total-Events': summary.totalEvents.toString(),
        'X-Active-Users': summary.activeUsers.toString(),
        'X-Group-By': params.groupBy,
        'Cache-Control': 'private, max-age=300' // 5 minutes cache
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'SQL_ANALYTICS_ERROR',
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
