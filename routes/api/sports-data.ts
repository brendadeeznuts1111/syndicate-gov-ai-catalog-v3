// [GOV][API][SPORTS-DATA][SPORTS-DATA-001][v3.0][LIVE]
// Grepable: [gov-api-sports-data-sports-data-001-v3.0-live]
// routes/api/sports-data.ts - Live sports betting data API endpoint
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][API][SPORTS-DATA][TYPESCRIPT]
// 📊 **Coverage**: Live sports data endpoint with market formatting integration

import { z } from 'zod';
import { scrapeSportsData } from '../../scripts/scrape-sports-data';
import { formatMarket, normalizeMarketData } from '../../src/utils/marketFormatter';

// Request schema
const SportsDataRequestSchema = z.object({
  includeCountries: z.boolean().default(true),
  includeLeagues: z.boolean().default(true),
  includeSports: z.boolean().default(true),
  formatMarkets: z.boolean().default(false)
});

// Response schema
const SportsDataAPIResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    countries: z.array(z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      formattedName: z.string().optional()
    })),
    leagues: z.array(z.object({
      id: z.string(),
      name: z.string(),
      country_id: z.string(),
      sport_id: z.string(),
      formattedName: z.string().optional()
    })),
    sports: z.array(z.object({
      id: z.string(),
      name: z.string(),
      formattedName: z.string().optional()
    }))
  }),
  metadata: z.object({
    totalCountries: z.number(),
    totalLeagues: z.number(),
    totalSports: z.number(),
    lastUpdated: z.string().datetime()
  }),
  timestamp: z.string().datetime()
});

type SportsDataAPIResponse = z.infer<typeof SportsDataAPIResponseSchema>;

export const handle = async (req: Request) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const includeCountries = url.searchParams.get('countries') !== 'false';
    const includeLeagues = url.searchParams.get('leagues') !== 'false';
    const includeSports = url.searchParams.get('sports') !== 'false';
    const formatMarkets = url.searchParams.get('format') === 'true';

    // Validate request
    const requestData = {
      includeCountries,
      includeLeagues,
      includeSports,
      formatMarkets
    };

    const validation = SportsDataRequestSchema.safeParse(requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid request parameters',
        errors: validation.error.errors,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Scrape live data
    const rawData = await scrapeSportsData();

    // Process and format data
    const processedData = {
      countries: includeCountries ? rawData.countries.map(country => ({
        ...country,
        formattedName: formatMarkets ? formatMarket({
          id: country.id,
          type: 'country',
          name: country.name
        }) : undefined
      })) : [],
      leagues: includeLeagues ? rawData.leagues.map(league => ({
        ...league,
        formattedName: formatMarkets ? formatMarket({
          id: league.id,
          type: 'league',
          name: league.name
        }) : undefined
      })) : [],
      sports: includeSports ? rawData.sports.map(sport => ({
        ...sport,
        formattedName: formatMarkets ? formatMarket({
          id: sport.id,
          type: 'sport',
          name: sport.name
        }) : undefined
      })) : []
    };

    const response: SportsDataAPIResponse = {
      success: true,
      data: processedData,
      metadata: {
        totalCountries: processedData.countries.length,
        totalLeagues: processedData.leagues.length,
        totalSports: processedData.sports.length,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Sports-Data-Countries': processedData.countries.length.toString(),
        'X-Sports-Data-Leagues': processedData.leagues.length.toString(),
        'X-Sports-Data-Sports': processedData.sports.length.toString(),
        'X-Last-Updated': new Date().toISOString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Sports data API error:', error);

    const errorResponse = {
      success: false,
      message: 'Failed to fetch sports data',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Sports-Data-Error': 'true'
      }
    });
  }
};
