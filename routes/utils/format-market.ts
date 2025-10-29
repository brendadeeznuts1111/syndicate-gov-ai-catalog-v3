// [GOV][UTIL][FORMAT-MARKET][FORMAT-MARKET-001][v3.0][LIVE]
// Grepable: [gov-util-format-market-format-market-001-v3.0-live]
// routes/utils/format-market.ts - Market formatting API endpoint
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][UTIL][FORMAT-MARKET][TYPESCRIPT]
// 📊 **Coverage**: API endpoint for client-side market formatting

import { z } from 'zod';
import { formatMarket, normalizeMarketData, validateMarketData } from '../../src/utils/marketFormatter';

// Request schema
const FormatMarketRequestSchema = z.object({
  market: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    odds: z.number().optional(),
    handicap: z.number().optional(),
    total: z.number().optional()
  }).optional(),
  rawData: z.any().optional(), // For normalization from scraper data
  format: z.enum(['display', 'normalized']).default('display')
});

// Response schema
const FormatMarketResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    formatted: z.string().optional(),
    normalized: z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      odds: z.number().optional(),
      handicap: z.number().optional(),
      total: z.number().optional()
    }).optional()
  }),
  timestamp: z.string().datetime()
});

type FormatMarketResponse = z.infer<typeof FormatMarketResponseSchema>;

export const handle = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = FormatMarketRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { market, rawData, format } = validation.data;

    let normalizedMarket;
    let formattedMarket;

    if (rawData) {
      // Normalize from raw scraper data
      normalizedMarket = normalizeMarketData(rawData);
      if (!validateMarketData(normalizedMarket)) {
        throw new Error('Invalid market data after normalization');
      }
    } else if (market) {
      normalizedMarket = market;
    } else {
      throw new Error('Either market or rawData must be provided');
    }

    if (format === 'display' || format === 'normalized') {
      formattedMarket = formatMarket(normalizedMarket);
    }

    const response: FormatMarketResponse = {
      success: true,
      data: {
        formatted: formattedMarket,
        normalized: normalizedMarket
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Formatted-Market': formattedMarket ? 'true' : 'false',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    const errorResponse = {
      success: false,
      message: 'Failed to format market',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Format-Error': 'true'
      }
    });
  }
};
