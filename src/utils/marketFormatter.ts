// [GOV][UTIL][MARKET-FORMATTER][MARKET-FORMATTER-001][v3.0][LIVE]
// Grepable: [gov-util-market-formatter-market-formatter-001-v3.0-live]
// src/utils/marketFormatter.ts - Market formatting utilities
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][UTIL][MARKET-FORMATTER][TYPESCRIPT]
// 📊 **Coverage**: Pure functions for market formatting and data extraction

/**
 * Formats a betting market for display
 * Ported from reference implementation's formatMarket function in price-display module
 * Handles complex market formatting with team names, figures, and market-specific logic
 */
export function formatMarket(market: {
  id: string | number;
  type?: string;
  name?: string;
  team1?: string;
  team2?: string;
  figure?: number;
  contestant?: string;
  period?: string;
  sportId?: number;
  leagueId?: number;
}): string {
  const marketId = Number(market.id);
  const team1 = market.team1 || 'Team 1';
  const team2 = market.team2 || 'Team 2';
  const figure = market.figure || 0;

  // Get market template from our lookup
  const marketTemplate = getMarketTemplate(marketId);
  if (!marketTemplate) {
    return market.name || `Market ${marketId}`;
  }

  let formatted = marketTemplate.label || market.name || '';

  // Handle market-specific formatting based on reference bundle logic
  if (marketTemplate.isMoney) {
    // Moneyline markets
    formatted = formatted.replace('{team1}', team1).replace('{team2}', team2);
  } else if (marketTemplate.isSpread) {
    // Spread/handicap markets
    if (figure === 0) {
      formatted = `${formatted} PK`;
    } else {
      const sign = figure > 0 ? '+' : '';
      formatted = `${formatted} ${sign}${figure}`;
    }
  } else if (marketTemplate.isTotal) {
    // Total/over-under markets
    formatted = `${formatted} ${figure}`;
  } else if (marketTemplate.isContest) {
    // Contest markets (player props, outright winners, etc.)
    if (market.contestant) {
      formatted = formatted.replace('{player}', market.contestant);
    }
    if (marketTemplate.withFigure && figure > 0) {
      formatted = formatted.replace('{ordinal}', ordinal(figure));
    }
  } else if (marketTemplate.isBinaryStore) {
    // Binary stored markets (correct score, etc.)
    const extracted = extractBinaryStoredFigure(figure, marketId);
    if (Array.isArray(extracted)) {
      if (marketId === 16) { // Correct Score
        const [score1, score2] = extracted;
        const leadingTeam = score1 > score2 ? team1 : score1 < score2 ? team2 : 'Draw';
        formatted = `${leadingTeam} ${score1} - ${score2}`;
      } else if (marketId === 21) { // Point Winner
        formatted = `Game ${extracted[0]}, Point ${extracted[1]}`;
      } else {
        formatted = extracted.join(' - ');
      }
    }
  }

  // Handle period descriptions if present
  if (market.period && marketTemplate.periodDescriptions) {
    const periodDesc = marketTemplate.periodDescriptions[market.period] ||
                      marketTemplate.periodDescriptions.default ||
                      market.period;
    formatted = formatted.replace('{periodDescription}', periodDesc);
  }

  return formatted;
}

/**
 * Extracts a binary stored figure (likely for odds/prices)
 * Ported from reference implementation's extractBinaryStoredFigure function
 * Uses bit manipulation to extract two figures from a single binary value
 */
export function extractBinaryStoredFigure(binaryValue: number | string, marketId?: number): number | number[] {
  if (!binaryValue) return [0, 0];

  let value = typeof binaryValue === 'string' ? parseInt(binaryValue, 10) : binaryValue;

  if (isNaN(value)) {
    throw new Error('Invalid binary value for figure extraction');
  }

  // Handle sign for some markets
  const sign = Math.sign(value);
  value = Math.abs(value);

  // Get binary store factors from market template (defaulting to [1, 1])
  const marketTemplate = marketId ? getMarketTemplate(marketId) : null;
  let factors = [1, 1];
  if (marketTemplate && marketTemplate.binaryStoreFactor) {
    factors = Array.isArray(marketTemplate.binaryStoreFactor)
      ? marketTemplate.binaryStoreFactor
      : [marketTemplate.binaryStoreFactor, marketTemplate.binaryStoreFactor];
  }

  // Extract using bit manipulation (same as reference bundle)
  const figure1 = ((value & 0xFFFF0000) >> 16) / factors[0] * sign;
  const figure2 = (value & 0x0000FFFF) / factors[1] * sign;

  return [figure1, figure2];
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
 * Gets market template by ID from our lookup table
 */
function getMarketTemplate(marketId: number): any {
  // This would ideally fetch from the market-templates endpoint
  // For now, return a basic template based on common market types
  const templates: Record<number, any> = {
    1: { label: '3 way', isMoney: true, isThreeWay: true, isPopularMarket: true },
    2: { label: 'Double chance', isMoney: true, isThreeWay: true },
    3: { label: '2 way', isMoney: true, isPopularMarket: true },
    4: { label: 'Draw no bet', isMoney: true },
    5: { label: 'Total', isTotal: true, isPopularMarket: true },
    6: { label: 'Spread', isSpread: true, isPopularMarket: true },
    7: { label: 'Team 1 total', isTotal: true },
    8: { label: 'Team 2 total', isTotal: true },
    16: { label: 'Correct Score', isBinaryStore: true },
    21: { label: 'Point Winner', isBinaryStore: true },
    // Add more as needed based on the reference bundle's `r` object
  };

  return templates[marketId] || null;
}

/**
 * Converts number to ordinal (1st, 2nd, 3rd, etc.)
 */
function ordinal(num: number): string {
  const n = Math.abs(num);
  const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st' :
                 n % 10 === 2 && n % 100 !== 12 ? 'nd' :
                 n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return num + suffix;
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
