// [GOV][LIVE][DATA-FEED][LIVE-DATA-001][v3.0][LIVE]
// Grepable: [gov-live-data-feed-live-data-001-v3.0-live]
// routes/live/data.ts - Real-time sports data feed
// 🛡️ **Maintainers**: @syndicate-gov/live-team
// 🎯 **Semantic Tag**: 🟢 [GOV][LIVE][DATA-FEED][TYPESCRIPT]
// 📊 **Coverage**: Real-time sports data with country, league, and sport information

import { z } from 'zod';

// Request parameters schema
const LiveDataParamsSchema = z.object({
  countries: z.coerce.boolean().optional().default(true),
  leagues: z.coerce.boolean().optional().default(true),
  sports: z.coerce.boolean().optional().default(true)
});

// Response schema for live data
const LiveDataResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: z.object({
    countries: z.array(z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      activeEvents: z.number()
    })).optional(),
    leagues: z.array(z.object({
      id: z.string(),
      name: z.string(),
      sport: z.string(),
      country: z.string(),
      activeEvents: z.number(),
      status: z.string()
    })).optional(),
    sports: z.array(z.object({
      id: z.string(),
      name: z.string(),
      activeEvents: z.number(),
      popular: z.boolean()
    })).optional()
  }),
  metadata: z.object({
    totalEvents: z.number(),
    lastUpdated: z.string().datetime(),
    refreshInterval: z.number()
  })
});

type LiveDataParams = z.infer<typeof LiveDataParamsSchema>;
type LiveDataResponse = z.infer<typeof LiveDataResponseSchema>;

export const handle = async (req: Request, { query }: { query: Record<string, string> }) => {
  try {
    // Validate query parameters
    const params = LiveDataParamsSchema.parse(query);
    
    // Mock live data generation
    const mockData = {
      countries: params.countries ? [
        { id: 'us', name: 'United States', code: 'US', activeEvents: 45 },
        { id: 'uk', name: 'United Kingdom', code: 'GB', activeEvents: 23 },
        { id: 'ca', name: 'Canada', code: 'CA', activeEvents: 18 }
      ] : undefined,
      
      leagues: params.leagues ? [
        { id: 'nfl', name: 'National Football League', sport: 'football', country: 'US', activeEvents: 12, status: 'live' },
        { id: 'premier', name: 'Premier League', sport: 'soccer', country: 'UK', activeEvents: 8, status: 'live' },
        { id: 'nba', name: 'National Basketball Association', sport: 'basketball', country: 'US', activeEvents: 6, status: 'live' }
      ] : undefined,
      
      sports: params.sports ? [
        { id: 'football', name: 'Football', activeEvents: 15, popular: true },
        { id: 'soccer', name: 'Soccer', activeEvents: 28, popular: true },
        { id: 'basketball', name: 'Basketball', activeEvents: 12, popular: true },
        { id: 'baseball', name: 'Baseball', activeEvents: 8, popular: false },
        { id: 'hockey', name: 'Hockey', activeEvents: 6, popular: false }
      ] : undefined
    };
    
    const response: LiveDataResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      data: mockData,
      metadata: {
        totalEvents: 86,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 30 // seconds
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Live-Data': 'true',
        'X-Refresh-Interval': '30',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      message: 'Failed to fetch live data',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Live-Data-Error': 'true'
      }
    });
  }
};
