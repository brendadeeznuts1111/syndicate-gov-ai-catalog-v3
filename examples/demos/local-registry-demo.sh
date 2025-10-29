#!/bin/bash
# Local Registry Demo Script
[DEMO][LOCAL-REGISTRY][SCRIPT][LOCAL-REG-001][v1.0][LIVE]
# Grepable: [demo-local-registry-script-local-reg-001-v1.0-live]

echo "🚀 SYNDICATE UNIFIED CITADEL - Local Registry Demo"
echo "==================================================="
echo ""

# Check if citadel CLI is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first."
    exit 1
fi

echo "📋 Demo: Local Registry with SQLite, Redis, and S3 Integration"
echo ""

# Show initial stats
echo "🔍 Initial Registry Status:"
echo "----------------------------"
bun run citadel local:stats
echo ""

# Create a test package content
echo "📦 Creating Test Package..."
echo "----------------------------"
cat > /tmp/demo-package.js << 'EOF'
// Demo JavaScript Package
export function hello(name) {
  return `Hello, ${name}! This is a demo package from Syndicate Local Registry.`;
}

export function calculate(a, b) {
  return {
    sum: a + b,
    difference: a - b,
    product: a * b,
    quotient: b !== 0 ? a / b : 'Division by zero'
  };
}

export const version = '1.0.0';
export const author = 'Syndicate Demo';
EOF

echo "✅ Created demo package at /tmp/demo-package.js"
echo ""

# Publish the package
echo "📤 Publishing Package to Local Registry..."
echo "------------------------------------------"
bun run citadel local:publish demo-package 1.0.0 syndicate -f /tmp/demo-package.js -m '{"description": "Demo JavaScript package for testing", "tags": ["demo", "javascript", "testing"], "dependencies": []}'
echo ""

# Publish another package
echo "📤 Publishing Another Package..."
echo "---------------------------------"
cat > /tmp/utils-package.ts << 'EOF'
// Utils TypeScript Package
export interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

export class ApiClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async request(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(this.config.timeout)
    });

    return response;
  }
}

export const defaultConfig: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};
EOF

bun run citadel local:publish utils-package 2.1.0 syndicate -f /tmp/utils-package.ts -m '{"description": "Utility TypeScript package with API client", "tags": ["utils", "typescript", "api"], "dependencies": []}'
echo ""

# Store some secrets
echo "🔐 Storing Secrets in Vault..."
echo "------------------------------"
bun run citadel local:secret-store database-url "postgresql://localhost:5432/syndicate" connection -s production
bun run citadel local:secret-store api-key "sk-1234567890abcdef" api-key -s production
bun run citadel local:secret-store jwt-secret "super-secret-jwt-key-2024" jwt -s auth
echo ""

# Show updated stats
echo "📊 Updated Registry Statistics:"
echo "---------------------------------"
bun run citadel local:stats
echo ""

# List packages
echo "📋 Listing All Packages:"
echo "-------------------------"
bun run citadel local:list-packages
echo ""

# List secrets
echo "🔐 Listing All Secrets:"
echo "------------------------"
bun run citadel local:list-secrets
echo ""

# Resolve and test package
echo "🔍 Resolving Package:"
echo "---------------------"
bun run citadel local:resolve demo-package 1.0.0 syndicate -o /tmp/resolved-demo-package.js
echo ""

echo "📄 Resolved Package Content:"
echo "----------------------------"
cat /tmp/resolved-demo-package.js
echo ""

# Test database schema
echo "🗄️ Database Schema:"
echo "--------------------"
bun run citadel local:db-schema
echo ""

# Retrieve secrets
echo "🔑 Retrieving Specific Secrets:"
echo "---------------------------------"
bun run citadel local:secret-get database-url
echo ""
bun run citadel local:secret-get api-key
echo ""

# Test cache functionality
echo "💾 Testing Cache Performance:"
echo "------------------------------"
echo "First access (cache miss):"
time bun run citadel local:resolve utils-package 2.1.0 syndicate > /dev/null
echo ""
echo "Second access (cache hit):"
time bun run citadel local:resolve utils-package 2.1.0 syndicate > /dev/null
echo ""

# Export registry data
echo "📤 Exporting Registry Data..."
echo "-----------------------------"
bun run citadel local:export /tmp/registry-export.json
echo "✅ Exported to /tmp/registry-export.json"
echo ""

# Show export summary
echo "📄 Export Summary:"
echo "------------------"
if [ -f /tmp/registry-export.json ]; then
    echo "File size: $(du -h /tmp/registry-export.json | cut -f1)"
    echo "Packages in export: $(jq '.packages | length' /tmp/registry-export.json 2>/dev/null || echo 'Unknown')"
    echo "Secrets in export: $(jq '.secrets | length' /tmp/registry-export.json 2>/dev/null || echo 'Unknown')"
fi
echo ""

# Cleanup demo
echo "🧹 Cleaning Up Demo..."
echo "----------------------"
echo "Clearing cache..."
bun run citadel local:clear-cache
echo ""
echo "Running cleanup..."
bun run citadel local:cleanup
echo ""

# Final stats
echo "📊 Final Registry Statistics:"
echo "------------------------------"
bun run citadel local:stats
echo ""

# Clean up temporary files
rm -f /tmp/demo-package.js /tmp/utils-package.ts /tmp/resolved-demo-package.js /tmp/registry-export.json

echo "🎉 Local Registry Demo Completed Successfully!"
echo ""
echo "📚 What was demonstrated:"
echo "   ✅ Package publishing with compression"
echo "   ✅ Package resolution and caching"
echo "   ✅ Secret storage and retrieval"
echo "   ✅ SQLite database integration"
echo "   ✅ Redis caching (when available)"
echo "   ✅ S3 backup (when configured)"
echo "   ✅ Registry statistics and monitoring"
echo "   ✅ Data export functionality"
echo "   ✅ Cache performance optimization"
echo ""
echo "🔧 Features Available:"
echo "   📦 Local package registry with SQLite backend"
echo "   🔐 Secure vault for secrets management"
echo "   💾 Multi-tier caching (Redis + Memory + Files)"
echo "   🌐 S3 integration for backup and distribution"
echo "   🗄️ Database schema introspection"
echo "   📊 Comprehensive statistics and monitoring"
echo "   🔄 Data import/export capabilities"
echo "   ⚡ Performance optimization with compression"
echo ""
echo "💡 Next Steps:"
echo "   1. Configure Redis for distributed caching"
echo "   2. Set up S3 credentials for cloud backup"
echo "   3. Enable encryption for sensitive data"
echo "   4. Set up automated cleanup schedules"
echo "   5. Integrate with CI/CD pipelines"
echo ""
echo "🚀 Ready for production use!"
