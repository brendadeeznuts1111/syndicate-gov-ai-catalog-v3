// [GOV][ANALYTICS][HAR-ENHANCED-REVIEW][HAR-ENHANCED-REVIEW-001][v3.0][LIVE]
// Grepable: [gov-analytics-har-enhanced-review-har-enhanced-review-001-v3.0-live]
// scripts/enhanced-har-review.js - Enhanced HAR analyzer with betting data extraction
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][ANALYTICS][HAR-ENHANCED-REVIEW][JAVASCRIPT]
// 📊 **Coverage**: Deep network analysis for betting API discovery and data extraction

import fs from 'fs';
import path from 'path';

/**
 * Enhanced HAR review with betting-specific analysis
 */
function enhancedReviewHAR(harFilePath) {
  console.log('🔬 Starting Enhanced HAR Analysis...\n');

  try {
    const harContent = fs.readFileSync(harFilePath, 'utf8');
    const harData = JSON.parse(harContent);

    const entries = harData.log?.entries || [];

    console.log('📊 HAR Analysis Summary:');
    console.log(`   Total Network Requests: ${entries.length}`);
    console.log(`   HAR Creator: ${harData.log?.creator?.name || 'Unknown'}\n`);

    // Analyze timing
    const timings = entries.map(entry => ({
      url: entry.request.url,
      duration: entry.time,
      status: entry.response.status
    })).sort((a, b) => b.duration - a.duration);

    console.log('⏱️  Slowest Requests:');
    timings.slice(0, 5).forEach((timing, i) => {
      console.log(`   ${i + 1}. ${(timing.duration / 1000).toFixed(2)}s - ${timing.url.split('/').pop()}`);
    });
    console.log('');

    // Look for WebSocket connections
    const wsEntries = entries.filter(entry =>
      entry.request.url.startsWith('ws://') || entry.request.url.startsWith('wss://')
    );

    if (wsEntries.length > 0) {
      console.log('🔌 WebSocket Connections Found:');
      wsEntries.forEach(entry => {
        console.log(`   ${entry.request.url}`);
      });
      console.log('');
    }

    // Analyze JavaScript bundles for API patterns
    const jsBundles = entries.filter(entry =>
      entry.request.url.includes('.js') &&
      entry.response.content?.text &&
      entry.response.content.size > 100000 // Large JS files
    );

    console.log('📦 Large JavaScript Bundles:');
    jsBundles.forEach(entry => {
      const size = (entry.response.content.size / 1024 / 1024).toFixed(2);
      const url = entry.request.url.split('/').pop();
      console.log(`   ${size}MB - ${url}`);

      // Quick analysis of bundle content
      const content = entry.response.content.text;
      const hasAPICalls = content.includes('fetch(') || content.includes('XMLHttpRequest');
      const hasWebSocket = content.includes('WebSocket') || content.includes('ws://') || content.includes('wss://');
      const hasBettingTerms = content.includes('odds') || content.includes('market') || content.includes('wager');

      console.log(`      API Calls: ${hasAPICalls}, WebSocket: ${hasWebSocket}, Betting Terms: ${hasBettingTerms}`);
    });
    console.log('');

    // Extract authentication patterns
    const authHeaders = new Map();
    entries.forEach(entry => {
      entry.request.headers.forEach(header => {
        const name = header.name.toLowerCase();
        if (['authorization', 'x-api-key', 'x-gs-session', 'cookie'].includes(name)) {
          if (!authHeaders.has(name)) {
            authHeaders.set(name, new Set());
          }
          // Don't log full values for security
          authHeaders.get(name).add(header.value.length > 20 ? header.value.substring(0, 20) + '...' : header.value);
        }
      });
    });

    if (authHeaders.size > 0) {
      console.log('🔐 Authentication Headers Found:');
      authHeaders.forEach((values, header) => {
        console.log(`   ${header}: ${values.size} patterns`);
      });
      console.log('');
    }

    // Look for API-like patterns in URLs
    const apiPatterns = entries.filter(entry => {
      const url = entry.request.url;
      return url.includes('/api/') ||
             url.includes('/ajax') ||
             url.includes('/live/') ||
             url.includes('sportswidgets.pro') ||
             url.includes('?countries=') ||
             url.includes('?leagues=') ||
             url.includes('?sports=');
    });

    if (apiPatterns.length > 0) {
      console.log('🎯 Potential API Endpoints:');
      apiPatterns.forEach(entry => {
        const url = new URL(entry.request.url);
        const endpoint = url.pathname + url.search;
        console.log(`   ${entry.request.method} ${endpoint} (${entry.response.status})`);
      });
      console.log('');
    }

    // Analyze response content types
    const contentTypes = {};
    entries.forEach(entry => {
      const type = entry.response.content?.mimeType || 'unknown';
      contentTypes[type] = (contentTypes[type] || 0) + 1;
    });

    console.log('📄 Content Type Distribution:');
    Object.entries(contentTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} responses`);
      });
    console.log('');

    // Check for potential data endpoints that might be missed
    const dataEndpoints = entries.filter(entry => {
      const url = entry.request.url;
      const response = entry.response.content?.text || '';
      return (url.includes('data') || url.includes('api')) &&
             (response.includes('{') || response.includes('[')) &&
             response.length > 100;
    });

    if (dataEndpoints.length > 0) {
      console.log('💾 Potential Data Endpoints:');
      dataEndpoints.forEach(entry => {
        const url = entry.request.url;
        const size = entry.response.content?.size || 0;
        console.log(`   ${url.split('/').pop()} (${size} bytes)`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 Recommendations for Better HAR Capture:');
    console.log('   1. Capture HAR during active betting operations, not just page load');
    console.log('   2. Include network traffic when clicking "Live Data" or refreshing odds');
    console.log('   3. Look for WebSocket connections for real-time updates');
    console.log('   4. Capture POST requests to betting APIs');
    console.log('   5. Include authentication flows and session establishment');
    console.log('');

    console.log('✅ Enhanced HAR analysis complete!');

    return {
      timings,
      jsBundles,
      authHeaders,
      apiPatterns,
      contentTypes,
      dataEndpoints
    };

  } catch (error) {
    console.error('❌ Error in enhanced HAR review:', error.message);
    throw error;
  }
}

// CLI execution
if (import.meta.main) {
  const harFilePath = process.argv[2] || path.join(process.cwd(), 'config', 'HAR.js');

  console.log(`📁 Enhanced review of HAR file: ${harFilePath}\n`);

  if (!fs.existsSync(harFilePath)) {
    console.error(`❌ HAR file not found: ${harFilePath}`);
    process.exit(1);
  }

  enhancedReviewHAR(harFilePath);
}
