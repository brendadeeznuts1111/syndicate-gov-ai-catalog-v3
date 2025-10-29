// [GOV][UTIL][MARKET-FORMATTER][MARKET-FORMATTER-001][v3.0][LIVE]
// Grepable: [gov-util-market-formatter-market-formatter-001-v3.0-live]
// src/utils/marketFormatter.ts - Market formatting utilities
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][UTIL][MARKET-FORMATTER][TYPESCRIPT]
// 📊 **Coverage**: Pure functions for market formatting and data extraction

/**
 * Formats a betting market for display
 * Ported from reference implementation's formatMarket function
 */
export function formatMarket(market: {
  id: string;
  type: string;
  name: string;
  odds?: number;
  handicap?: number;
  total?: number;
}): string {
  const { id, type, name, odds, handicap, total } = market;

  // Format based on market type
  switch (type.toLowerCase()) {
    case 'moneyline':
    case 'match_winner':
      return name;

    case 'spread':
    case 'handicap':
    case 'asian_handicap':
    case 'european_handicap':
      if (handicap !== undefined) {
        const sign = handicap > 0 ? '+' : '';
        return `${name} (${sign}${handicap})`;
      }
      return name;

    case 'total':
    case 'over_under':
      if (total !== undefined) {
        return `${name} (${total})`;
      }
      return name;

    case 'prop':
    case 'player_prop':
      return name; // Props usually have descriptive names already

    default:
      return name;
  }
}

/**
 * Extracts a binary stored figure (likely for odds/prices)
 * Ported from reference implementation's extractBinaryStoredFigure function
 * Assumes figures are stored as integers representing decimal * 100
 */
export function extractBinaryStoredFigure(binaryValue: number | string): number {
  // If string, try to parse as int
  const value = typeof binaryValue === 'string' ? parseInt(binaryValue, 10) : binaryValue;

  if (isNaN(value)) {
    throw new Error('Invalid binary value for figure extraction');
  }

  // Assuming stored as integer representing decimal * 100 (e.g., 185 = 1.85)
  return value / 100;
}

/**
 * Formats odds for display
 * Utility function to complement formatMarket
 */
export function formatOdds(odds: number, format: 'decimal' | 'fractional' | 'american' = 'decimal'): string {
  switch (format) {
    case 'decimal':
      return odds.toFixed(2);

    case 'fractional':
      const fraction = decimalToFraction(odds);
      return fraction;

    case 'american':
      return decimalToAmerican(odds);

    default:
      return odds.toFixed(2);
  }
}

/**
 * Converts decimal odds to fractional
 */
function decimalToFraction(decimal: number): string {
  const numerator = Math.round(decimal * 100) - 100;
  const denominator = 100;
  const gcd = greatestCommonDivisor(numerator, denominator);
  return `${numerator / gcd}/${denominator / gcd}`;
}

/**
 * Converts decimal odds to American
 */
function decimalToAmerican(decimal: number): string {
  if (decimal >= 2.0) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `-${Math.round(100 / (decimal - 1))}`;
  }
}

/**
 * Greatest common divisor utility
 */
function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * Validates market data structure
 */
export function validateMarketData(data: any): boolean {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.type === 'string' &&
    typeof data.name === 'string'
  );
}

/**
 * Normalizes market data from scraper output
 */
export function normalizeMarketData(rawData: any): {
  id: string;
  type: string;
  name: string;
  odds?: number;
  handicap?: number;
  total?: number;
} {
  // Assuming scraper returns data in a specific shape
  // Adjust based on actual scraper output
  return {
    id: rawData.marketId || rawData.id,
    type: rawData.marketType || rawData.type,
    name: rawData.marketName || rawData.name,
    odds: rawData.odds ? extractBinaryStoredFigure(rawData.odds) : undefined,
    handicap: rawData.handicap ? extractBinaryStoredFigure(rawData.handicap) : undefined,
    total: rawData.total ? extractBinaryStoredFigure(rawData.total) : undefined
  };
}
