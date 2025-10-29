#!/bin/bash
# API Registry Demo Script
[DEMO][API-REGISTRY][SCRIPT][API-REG-001][v1.0][LIVE]
# Grepable: [demo-api-registry-script-api-reg-001-v1.0-live]

echo "🚀 SYNDICATE UNIFIED CITADEL - API Registry Demo"
echo "=================================================="
echo ""

echo "📋 Available API Registry Commands:"
echo "   citadel registry:start          - Start API server"
echo "   citadel registry:add-rule       - Add new rule"
echo "   citadel registry:remove-rule    - Remove rule"
echo "   citadel registry:api-stats      - Show API stats"
echo "   citadel registry:test-api       - Test endpoints"
echo ""

echo "🔍 Current Registry Status:"
bun run citadel registry:stats
echo ""

echo "📊 Detailed API Statistics:"
bun run citadel registry:api-stats
echo ""

echo "🧪 Testing API Registry (requires server to be running):"
echo "   Note: Start the API server in another terminal with:"
echo "   bun run citadel registry:start"
echo ""

# Check if API server is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ API Server is running! Testing endpoints..."
    bun run citadel registry:test-api
    echo ""
    
    echo "📝 Adding example security rule..."
    bun run citadel registry:add-rule --file examples/headers/security-rule.json
    echo ""
    
    echo "📝 Adding example performance rule..."
    bun run citadel registry:add-rule --file examples/headers/performance-rule.json
    echo ""
    
    echo "📊 Updated API Statistics:"
    bun run citadel registry:api-stats
    echo ""
    
    echo "🔍 Testing API endpoints again..."
    bun run citadel registry:test-api
    echo ""
    
    echo "🗑️  Cleaning up demo rules..."
    bun run citadel registry:remove-rule SEC-ETL-001
    bun run citadel registry:remove-rule PERF-SYS-002
    echo ""
    
    echo "📊 Final API Statistics:"
    bun run citadel registry:api-stats
    
else
    echo "⚠️  API Server is not running"
    echo "   Start it with: bun run citadel registry:start"
    echo "   Then run this demo again to test the API endpoints"
fi

echo ""
echo "🌐 API Registry Features:"
echo "   ✅ RESTful API with full CRUD operations"
echo "   ✅ Real-time WebSocket updates"
echo "   ✅ Rate limiting and security"
echo "   ✅ Compression and caching"
echo "   ✅ Health monitoring and metrics"
echo "   ✅ Search and filtering capabilities"
echo ""

echo "📡 API Endpoints:"
echo "   GET  http://localhost:3001/api/rules          - List all rules"
echo "   POST http://localhost:3001/api/rules          - Create new rule"
echo "   GET  http://localhost:3001/api/rules/:id      - Get specific rule"
echo "   PUT  http://localhost:3001/api/rules/:id      - Update rule"
echo "   DELETE http://localhost:3001/api/rules/:id    - Delete rule"
echo "   POST http://localhost:3001/api/rules/search   - Search rules"
echo "   GET  http://localhost:3001/api/packages       - List all packages"
echo "   GET  http://localhost:3001/api/stats           - Registry statistics"
echo "   GET  http://localhost:3001/api/health          - Health check"
echo ""

echo "🔌 WebSocket:"
echo "   ws://localhost:3002 - Real-time updates for rule/package changes"
echo ""

echo "🎆 API Registry Demo Complete!"
echo "   Start the server: bun run citadel registry:start"
echo "   Test the API: bun run citadel registry:test-api"
echo "   View stats: bun run citadel registry:api-stats"
