const fs = require('fs');

console.log('🔍 Analyzing HAR file...\n');

try {
  const harContent = fs.readFileSync('config/HAR.js', 'utf8');
  const harData = JSON.parse(harContent);

  const entries = harData.log?.entries || [];
  console.log(`Total entries: ${entries.length}\n`);

  // Count different types of requests
  const urlCounts = {};
  entries.forEach(entry => {
    const url = entry.request.url;
    // Extract endpoint
    const endpoint = url.replace(/^https?:\/\/[^\/]+/, '').split('?')[0];
    urlCounts[endpoint] = (urlCounts[endpoint] || 0) + 1;
  });

  console.log('Top endpoints:');
  Object.entries(urlCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([endpoint, count]) => {
      console.log(`  ${endpoint}: ${count}`);
    });

  // Find AJAX calls
  const ajaxCalls = entries.filter(e =>
    e.request.url.includes('ajax.php') &&
    e.request.postData?.text
  );

  console.log(`\nAJAX calls: ${ajaxCalls.length}`);

  ajaxCalls.slice(0, 3).forEach((call, i) => {
    try {
      const data = JSON.parse(call.request.postData.text);
      console.log(`  ${i+1}. Action: ${data.action || 'unknown'}`);
    } catch (e) {
      console.log(`  ${i+1}. Parse error`);
    }
  });

  // Find live events
  const liveEvents = entries.filter(e => e.request.url.includes('liveEvents'));
  console.log(`\nLive Events calls: ${liveEvents.length}`);

  if (liveEvents.length > 0) {
    const size = liveEvents[0].response.content?.size || 0;
    console.log(`Response size: ${(size / 1024 / 1024).toFixed(2)}MB`);
  }

} catch (error) {
  console.error('Error:', error.message);
}
