// [GOV][ANALYTICS][HAR-REVIEW][HAR-REVIEW-001][v3.0][LIVE]
// Grepable: [gov-analytics-har-review-har-review-001-v3.0-live]
// scripts/review-har.js - HAR file analyzer for sports betting API discovery
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][ANALYTICS][HAR-REVIEW][JAVASCRIPT]
// 📊 **Coverage**: Network traffic analysis for API endpoint discovery

import fs from 'fs';
import path from 'path';

/**
 * Reviews HAR.js file to extract API endpoints, headers, and betting data structures
 */
function reviewHAR(harFilePath) {
  console.log('🔍 Starting HAR file review...\n');

  try {
    // Read and parse HAR file
    const harContent = fs.readFileSync(harFilePath, 'utf8');
    const harData = JSON.parse(harContent);

    console.log('📊 HAR File Statistics:');
    console.log(`   Total Entries: ${harData.log?.entries?.length || 0}`);
    console.log(`   Creator: ${harData.log?.creator?.name || 'Unknown'} v${harData.log?.creator?.version || 'Unknown'}\n`);

    const entries = harData.log?.entries || [];

    // Categorize requests
    const categories = {
      api: [],
      assets: [],
      html: [],
      other: []
    };

    const apiEndpoints = new Map();
    const headers = new Map();
    const responseSizes = [];
    const sportsData = [];

    entries.forEach((entry, index) => {
      const url = entry.request.url;
      const method = entry.request.method;
      const status = entry.response.status;
      const contentType = entry.response.content?.mimeType || '';

      // Categorize by URL patterns
      if (url.includes('/live/data') || url.includes('/api/') || url.includes('/ajax.php')) {
        categories.api.push({ index, url, method, status, contentType });
      } else if (url.includes('.js') || url.includes('.css') || url.includes('assets/')) {
        categories.assets.push({ index, url, method, status });
      } else if (contentType.includes('text/html')) {
        categories.html.push({ index, url, method, status });
      } else {
        categories.other.push({ index, url, method, status, contentType });
      }

      // Extract API endpoints
      if (url.includes('sportswidgets.pro') && (method === 'GET' || method === 'POST')) {
        const endpoint = url.replace(/^https?:\/\/[^\/]+/, '');
        if (!apiEndpoints.has(endpoint)) {
          apiEndpoints.set(endpoint, {
            method,
            count: 0,
            responses: new Set(),
            samples: []
          });
        }
        const endpointData = apiEndpoints.get(endpoint);
        endpointData.count++;
        endpointData.responses.add(status);

        // Sample first few requests for each endpoint
        if (endpointData.samples.length < 3) {
          endpointData.samples.push({
            index,
            status,
            requestHeaders: entry.request.headers,
            responseHeaders: entry.response.headers,
            requestBody: entry.request.postData?.text || null
          });
        }
      }

      // Collect header patterns
      entry.request.headers.forEach(header => {
        const key = header.name.toLowerCase();
        if (!headers.has(key)) {
          headers.set(key, new Set());
        }
        headers.get(key).add(header.value);
      });

      // Track response sizes
      const size = entry.response.content?.size || 0;
      responseSizes.push({ url, size, status });

      // Look for sports/betting data in responses
      if (entry.response.content?.text) {
        try {
          const text = entry.response.content.text;
          // Check for JSON responses with sports data
          if (text.includes('"sports"') || text.includes('"leagues"') || text.includes('"countries"')) {
            sportsData.push({
              index,
              url,
              contentLength: text.length,
              hasSports: text.includes('"sports"'),
              hasLeagues: text.includes('"leagues"'),
              hasCountries: text.includes('"countries"'),
              hasMarkets: text.includes('"markets"') || text.includes('marketId')
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Print analysis results
    console.log('🌐 Request Categories:');
    Object.entries(categories).forEach(([category, requests]) => {
      console.log(`   ${category.toUpperCase()}: ${requests.length} requests`);
    });
    console.log('');

    console.log('🎯 API Endpoints Found:');
    for (const [endpoint, data] of apiEndpoints) {
      console.log(`   ${data.method} ${endpoint}`);
      console.log(`      Calls: ${data.count}, Status Codes: [${Array.from(data.responses).join(', ')}]`);
      console.log('');
    }

    console.log('🔑 Interesting Headers Found:');
    const interestingHeaders = ['x-gs-session', 'cookie', 'authorization', 'x-api-key'];
    interestingHeaders.forEach(headerName => {
      if (headers.has(headerName)) {
        const values = Array.from(headers.get(headerName));
        console.log(`   ${headerName}: ${values.length} unique values`);
        if (values.length <= 3) {
          values.forEach(val => console.log(`      "${val}"`));
        }
      }
    });
    console.log('');

    console.log('📊 Sports Data Responses:');
    sportsData.forEach(data => {
      console.log(`   Entry ${data.index}: ${data.url}`);
      console.log(`      Sports: ${data.hasSports}, Leagues: ${data.hasLeagues}, Countries: ${data.hasCountries}, Markets: ${data.hasMarkets}`);
    });
    console.log('');

    console.log('📈 Response Size Analysis:');
    const sortedSizes = responseSizes.sort((a, b) => b.size - a.size);
    console.log('   Largest responses:');
    sortedSizes.slice(0, 5).forEach(item => {
      console.log(`      ${item.size} bytes - ${item.url.split('/').pop()}`);
    });

    // Look for specific patterns we care about
    console.log('\n🎲 Betting-Specific Analysis:');

    // Check for market data patterns
    const marketEntries = entries.filter(entry =>
      entry.response.content?.text &&
      (entry.response.content.text.includes('marketId') ||
       entry.response.content.text.includes('"markets"') ||
       entry.response.content.text.includes('wagertype'))
    );

    console.log(`   Market data entries: ${marketEntries.length}`);
    marketEntries.forEach(entry => {
      console.log(`      Entry ${entries.indexOf(entry)}: ${entry.request.url}`);
    });

    // Check for odds/price data
    const oddsEntries = entries.filter(entry =>
      entry.response.content?.text &&
      (entry.response.content.text.includes('"odds"') ||
       entry.response.content.text.includes('decimal') ||
       entry.response.content.text.includes('price'))
    );

    console.log(`   Odds/price data entries: ${oddsEntries.length}`);
    oddsEntries.forEach(entry => {
      console.log(`      Entry ${entries.indexOf(entry)}: ${entry.request.url}`);
    });

    console.log('\n✅ HAR review complete!');

    return {
      categories,
      apiEndpoints,
      headers,
      responseSizes,
      sportsData,
      marketEntries,
      oddsEntries
    };

  } catch (error) {
    console.error('❌ Error reviewing HAR file:', error.message);
    throw error;
  }
}

// CLI execution
if (import.meta.main) {
  const harFilePath = process.argv[2] || path.join(process.cwd(), 'config', 'HAR.js');

  console.log(`📁 Reviewing HAR file: ${harFilePath}\n`);

  if (!fs.existsSync(harFilePath)) {
    console.error(`❌ HAR file not found: ${harFilePath}`);
    process.exit(1);
  }

  reviewHAR(harFilePath);
}
