// [GOV][ANALYTICS][BETTING-API-DISCOVERY][BETTING-API-DISCOVERY-001][v3.0][LIVE]
// Grepable: [gov-analytics-betting-api-discovery-betting-api-discovery-001-v3.0-live]
// scripts/betting-api-discovery.js - Discovers betting API endpoints and data structures
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][ANALYTICS][BETTING-API-DISCOVERY][JAVASCRIPT]
// 📊 **Coverage**: Active discovery of betting APIs and data formats

import fs from 'fs';
import path from 'path';

/**
 * Discovers betting API endpoints by analyzing HAR and making test requests
 */
async function discoverBettingAPIs(harFilePath) {
  console.log('🔍 Starting Betting API Discovery...\n');

  try {
    // Read HAR if available
    let harData = null;
    if (fs.existsSync(harFilePath)) {
      const harContent = fs.readFileSync(harFilePath, 'utf8');
      harData = JSON.parse(harContent);
      console.log('📁 Loaded HAR file for analysis\n');
    }

    // Known API endpoints from our implementation
    const knownEndpoints = [
      {
        url: 'https://plive.sportswidgets.pro/live/data?countries=true&leagues=true&sports=true',
        method: 'GET',
        description: 'Live sports data endpoint (already implemented)'
      }
    ];

    console.log('🎯 Known Endpoints:');
    knownEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint.method} ${endpoint.url}`);
      console.log(`      ${endpoint.description}`);
    });
    console.log('');

    // Test the live data endpoint
    console.log('🧪 Testing Live Data Endpoint:');
    try {
      const response = await fetch('https://plive.sportswidgets.pro/live/data?countries=true&leagues=true&sports=true', {
        headers: {
          'accept': 'application/json, gzip, deflate, br',
          'accept-language': 'en-US,en;q=0.9',
          'priority': 'u=1, i',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-gs-session': '56b3436e3267577bbc8979fa',
          'cookie': 'GSID=bm291su14adrubhguum84j5qll; _gid=GA1.2.431380059.1761739106; _ga_ZG771CWJR1=GS2.1.s1761756832$o5$g1$t1761758194$j58$l0$h0; _ga=GA1.1.1745949441.1761633376',
          'Referer': 'https://plive.sportswidgets.pro/manager-tools/'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Response received');
        console.log(`   📊 Countries: ${data.countries?.length || 0}`);
        console.log(`   📊 Leagues: ${data.leagues?.length || 0}`);
        console.log(`   📊 Sports: ${data.sports?.length || 0}`);
      } else {
        console.log('   ❌ Request failed');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');

    // Analyze JavaScript bundles for API patterns
    if (harData) {
      const jsEntries = harData.log.entries.filter(entry =>
        entry.request.url.includes('.js') &&
        entry.response.content?.text
      );

      console.log('🔧 JavaScript Bundle Analysis:');
      console.log(`   Found ${jsEntries.length} JavaScript files to analyze`);

      let apiCallsFound = 0;
      let bettingTermsFound = 0;

      for (const entry of jsEntries) {
        const content = entry.response.content.text;
        const filename = entry.request.url.split('/').pop();

        const hasFetch = content.includes('fetch(');
        const hasXHR = content.includes('XMLHttpRequest');
        const hasWebSocket = content.includes('WebSocket') || content.includes('ws://');
        const hasBettingTerms = /\b(odds|market|wager|bet|stake|payout)\b/i.test(content);
        const hasLiveData = content.includes('/live/data') || content.includes('sportswidgets.pro');

        if (hasFetch || hasXHR || hasWebSocket || hasBettingTerms || hasLiveData) {
          console.log(`   📄 ${filename}:`);
          if (hasFetch) console.log('      • Uses fetch() API');
          if (hasXHR) console.log('      • Uses XMLHttpRequest');
          if (hasWebSocket) console.log('      • Uses WebSocket connections');
          if (hasBettingTerms) console.log('      • Contains betting terminology');
          if (hasLiveData) console.log('      • References live data endpoints');

          apiCallsFound++;
          if (hasBettingTerms) bettingTermsFound++;
        }
      }

      console.log(`\n📈 Analysis Results:`);
      console.log(`   API-related bundles: ${apiCallsFound}`);
      console.log(`   Betting-related bundles: ${bettingTermsFound}`);
      console.log('');
    }

    // Provide recommendations for HAR capture
    console.log('📋 Recommendations for Complete API Discovery:');
    console.log('');
    console.log('1. 🎯 Capture HAR During Active Betting:');
    console.log('   • Load manager tools interface');
    console.log('   • Click on "Live Events" or "Lines" sections');
    console.log('   • Wait for odds to load');
    console.log('   • Place a test bet (if possible)');
    console.log('   • Refresh live data multiple times');
    console.log('');

    console.log('2. 🔍 Look for These API Patterns:');
    console.log('   • GET /live/data?* (sports, leagues, countries)');
    console.log('   • POST /manager-tools/ajax.php?action=*');
    console.log('   • WebSocket connections (ws:// or wss://)');
    console.log('   • Requests with x-gs-session headers');
    console.log('   • Responses containing odds, markets, or wager data');
    console.log('');

    console.log('3. 📊 Data Structures to Capture:');
    console.log('   • Market definitions and templates');
    console.log('   • Live odds and pricing data');
    console.log('   • Event and contest information');
    console.log('   • User session and authentication data');
    console.log('');

    console.log('4. 🛠️ Browser DevTools Setup:');
    console.log('   • Network tab: Preserve log enabled');
    console.log('   • Filter: XHR/Fetch, WS, Other');
    console.log('   • Record until you have live betting data');
    console.log('');

    console.log('✅ API Discovery complete!');

  } catch (error) {
    console.error('❌ Error in betting API discovery:', error.message);
    throw error;
  }
}

// CLI execution
if (import.meta.main) {
  const harFilePath = process.argv[2] || path.join(process.cwd(), 'config', 'HAR.js');

  console.log(`🔍 Betting API Discovery`);
  console.log(`📁 HAR File: ${harFilePath}\n`);

  discoverBettingAPIs(harFilePath);
}
