# 📖 **API Reference**

Complete API documentation for Enterprise Supreme AI-Catalog v3.0, including REST endpoints, WebSocket APIs, CLI commands, and SDK interfaces for seamless integration with enterprise systems.

---

## 🚀 **API Overview**

### **📡 REST API Endpoints**
- **Package Management** - Install, publish, and manage packages
- **Governance Rules** - Create, validate, and enforce rules
- **AI Operations** - Generate, validate, and optimize AI content
- **Security Operations** - Quantum-safe security and validation
- **Analytics** - Business intelligence and reporting

### **🔌 WebSocket APIs**
- **Real-time Updates** - Live configuration changes
- **Monitoring Streams** - Performance and security metrics
- **Dashboard Events** - Interactive dashboard updates
- **Alert Notifications** - Real-time alert system

### **⚙️ CLI Commands**
- **Citadel Core** - Package management and governance
- **AI Operations** - AI-powered generation and validation
- **Security Tools** - Quantum-safe security operations
- **BI Tools** - Analytics and reporting commands

---

## 📦 **Package Management API**

### **🎯 Core Endpoints**

#### **Install Package**
```bash
POST /api/packages/install
Content-Type: application/json

{
  "name": "@syndicate/package",
  "version": "^1.0.0",
  "scope": "governance",
  "compression": "zstd",
  "quantumSafe": true
}

Response:
{
  "success": true,
  "package": {
    "name": "@syndicate/package",
    "version": "1.2.3",
    "installed": true,
    "location": "/.citadel/registry/governance/",
    "checksum": "sha256:abc123...",
    "quantumSafe": true
  },
  "performance": {
    "installTime": "45ms",
    "compressionRatio": "0.3",
    "cacheHit": true
  }
}
```

#### **Publish Package**
```bash
POST /api/packages/publish
Content-Type: application/json

{
  "packagePath": "./dist/my-package.tgz",
  "scope": "syndicate",
  "quantumSafe": true,
  "signPackage": true,
  "blockchainVerify": true
}

Response:
{
  "success": true,
  "published": {
    "name": "@syndicate/my-package",
    "version": "1.0.0",
    "url": "https://registry.syndicate.ai/@syndicate/my-package",
    "signature": " quantum-signature-abc123...",
    "blockchainTx": "0x1234...abcd"
  }
}
```

#### **Search Packages**
```bash
GET /api/packages/search?q=governance&scope=all&limit=10

Response:
{
  "results": [
    {
      "name": "@syndicate/gov-rules",
      "version": "3.0.1",
      "description": "AI-powered governance rules",
      "downloads": 15000,
      "rating": 4.9,
      "quantumSafe": true,
      "aiEnhanced": true
    }
  ],
  "total": 25,
  "performance": {
    "searchTime": "5ms",
    "cacheHit": true
  }
}
```

---

## 🤖 **AI Operations API**

### **🧠 AI Generation Endpoints**

#### **Generate Header**
```bash
POST /api/ai/generate/header
Content-Type: application/json

{
  "scope": "SECURITY",
  "type": "RULES",
  "variant": "EXPANDED",
  "context": {
    "priority": "high",
    "compliance": "soc2",
    "environment": "production"
  }
}

Response:
{
  "success": true,
  "header": {
    "content": "[SEC][RULES][EXPANDED][SEC-RUL-725][v2.9][REQUIRED]\n# Grepable: [sec-rules-expanded-sec-rul-725-v2.9-required]",
    "metadata": {
      "generated": "2025-10-29T09:08:36.854Z",
      "accuracy": 0.978,
      "inferenceTime": "1.8ms",
      "model": "wasm-tensorflow-lite-v3.0"
    },
    "grepable": "[sec-rules-expanded-sec-rul-725-v2.9-required]"
  },
  "performance": {
    "generationTime": "0.01ms",
    "accuracy": 0.978,
    "confidence": 0.987
  }
}
```

#### **Generate YAML Configuration**
```bash
POST /api/ai/generate/yaml
Content-Type: application/json

{
  "type": "dashboard",
  "environment": "production",
  "security": "quantum-safe",
  "features": ["analytics", "monitoring", "alerts"]
}

Response:
{
  "success": true,
  "yaml": {
    "content": "dashboard:\n  title: Production Dashboard\n  version: \"2.1.0\"\n  security:\n    quantumSafe: true\n    encryption: \"AES-256-GCM\"",
    "metadata": {
      "generated": "2025-10-29T09:08:36.854Z",
      "accuracy": 0.976,
      "inferenceTime": "0.05ms"
    }
  }
}
```

#### **Validate AI Content**
```bash
POST /api/ai/validate
Content-Type: application/json

{
  "content": "[SEC][RULES][EXPANDED][SEC-RUL-725][v2.9][REQUIRED]",
  "type": "header",
  "strict": true
}

Response:
{
  "valid": true,
  "score": 0.987,
  "issues": [],
  "suggestions": [
    "Consider adding compliance tag for SOC2"
  ],
  "performance": {
    "validationTime": "0.00ms",
    "accuracy": 1.0
  }
}
```

---

## 🔐 **Security Operations API**

### **🛡️ Security Endpoints**

#### **Quantum Security Scan**
```bash
POST /api/security/quantum-scan
Content-Type: application/json

{
  "target": "./src/",
  "algorithms": ["CRYSTALS-Kyber", "CRYSTALS-Dilithium"],
  "strict": true
}

Response:
{
  "secure": true,
  "scanResults": {
    "filesScanned": 150,
    "threatsDetected": 0,
    "quantumSafe": true,
    "algorithms": ["CRYSTALS-Kyber-1024", "CRYSTALS-Dilithium-3"],
    "scanTime": "18ms"
  },
  "recommendations": [
    "Enable post-quantum key rotation for maximum security"
  ]
}
```

#### **Blockchain Integrity Check**
```bash
POST /api/security/blockchain-verify
Content-Type: application/json

{
  "hash": "0x1234...abcd",
  "verifySignatures": true,
  "checkTimestamps": true
}

Response:
{
  "valid": true,
  "integrity": {
    "hashValid": true,
    "signaturesValid": true,
    "timestampsValid": true,
    "blockchainVerified": true,
    "verificationTime": "2.47ms"
  },
  "auditTrail": [
    {
      "timestamp": "2025-10-29T09:08:36.854Z",
      "action": "verify",
      "result": "valid"
    }
  ]
}
```

---

## 📊 **Business Intelligence API**

### **📈 Analytics Endpoints**

#### **Get Dashboard Data**
```bash
GET /api/bi/dashboard?timeRange=24h&metrics=all&format=json

Response:
{
  "dashboard": {
    "title": "Enterprise Supreme Dashboard",
    "lastUpdated": "2025-10-29T09:08:36.854Z",
    "metrics": {
      "performance": {
        "responseTime": "45ms",
        "throughput": "1000 req/s",
        "availability": "99.999%"
      },
      "security": {
        "threatScore": "A+",
        "quantumSafe": true,
        "compliance": "SOC2, ISO27001"
      },
      "ai": {
        "accuracy": "97.8%",
        "inferenceTime": "1.8ms",
        "modelsActive": 15
      }
    },
    "alerts": [
      {
        "level": "info",
        "message": "AI model accuracy improved by 0.2%",
        "timestamp": "2025-10-29T09:08:36.854Z"
      }
    ]
  }
}
```

#### **Generate Report**
```bash
POST /api/bi/reports/generate
Content-Type: application/json

{
  "type": "executive",
  "timeRange": "30d",
  "format": "pdf",
  "sections": ["performance", "security", "ai", "business"],
  "recipients": ["executives@company.com"]
}

Response:
{
  "reportId": "report-123456",
  "status": "generating",
  "estimatedTime": "120s",
  "downloadUrl": "/api/bi/reports/download/report-123456"
}
```

---

## 🔌 **WebSocket APIs**

### **📡 Real-time Connections**

#### **Configuration Updates**
```javascript
// Connect to configuration updates
const ws = new WebSocket('ws://localhost:3003/ws/config-updates');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Configuration update:', data);
  // Response format:
  // {
  //   type: "config-update",
  //   scope: "governance",
  //   config: { ... },
  //   timestamp: "2025-10-29T09:08:36.854Z"
  // }
};
```

#### **Performance Monitoring**
```javascript
// Connect to performance monitoring
const ws = new WebSocket('ws://localhost:3003/ws/performance');

ws.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  updatePerformanceDashboard(metrics);
  // Response format:
  // {
  //   type: "metrics",
  //   responseTime: 45,
  //   throughput: 1000,
  //   memoryUsage: 28,
  //   timestamp: "2025-10-29T09:08:36.854Z"
  // }
};
```

---

## ⚙️ **CLI Command Reference**

### **🏰 Citadel Core Commands**

#### **Package Management**
```bash
# Install packages
citadel install <package> [options]
  --scope <scope>        # Package scope (governance, security, etc.)
  --compression <type>   # Compression type (zstd, gzip, none)
  --quantum-safe         # Enable quantum-safe security
  --force               # Force reinstall

# Publish packages
citadel publish <path> [options]
  --scope <scope>        # Publish scope
  --sign                # Sign package with quantum keys
  --blockchain          # Verify on blockchain

# Search packages
citadel search <query> [options]
  --scope <scope>        # Search scope
  --limit <number>       # Result limit
  --ai-enhanced         # Use AI-enhanced search
```

#### **Governance Operations**
```bash
# Create governance rule
citadel gov:rule <definition> [options]
  --file <path>          # Rule definition file
  --scope <scope>        # Rule scope
  --validate             # Validate before creation

# Generate dashboard
citadel gov:dashboard [options]
  --port <port>          # Dashboard port
  --output <format>      # Output format (json, yaml, html)
  --real-time           # Enable real-time updates
```

### **🤖 AI Operations Commands**

#### **AI Generation**
```bash
# Train AI models
bun run citadel:ai train <models> [options]
  --models <type>        # Model types (all, header, yaml, validator)
  --data <path>          # Training data path
  --epochs <number>      # Training epochs
  --enterprise-data      # Use enterprise data

# Generate AI content
bun run citadel:ai generate <type> [options]
  --type <type>          # Content type (header, yaml, config)
  --scope <scope>        # Content scope
  --context <json>       # Generation context
  --store                # Store generated content

# Validate AI content
bun run citadel:ai validate [options]
  --glob <pattern>       # File pattern to validate
  --strict               # Strict validation mode
  --report               # Generate validation report
```

---

## 📚 **SDK Documentation**

### **🔧 JavaScript/TypeScript SDK**

#### **Installation**
```bash
npm install @enterprise-supreme/ai-catalog-sdk
# or
bun add @enterprise-supreme/ai-catalog-sdk
```

#### **Usage Examples**
```typescript
import { EnterpriseSupremeSDK } from '@enterprise-supreme/ai-catalog-sdk';

// Initialize SDK
const sdk = new EnterpriseSupremeSDK({
  endpoint: 'https://api.enterprise-supreme.ai',
  apiKey: process.env.ENTERPRISE_API_KEY,
  quantumSafe: true
});

// Generate AI header
const header = await sdk.ai.generateHeader({
  scope: 'SECURITY',
  type: 'RULES',
  variant: 'EXPANDED'
});

// Install package
const result = await sdk.packages.install({
  name: '@syndicate/gov-rules',
  version: '^3.0.0',
  quantumSafe: true
});

// Get dashboard data
const dashboard = await sdk.bi.getDashboard({
  timeRange: '24h',
  metrics: ['performance', 'security', 'ai']
});
```

---

## 🔮 **API Roadmap**

### **🚀 Future Enhancements**
- [ ] **GraphQL API** for complex queries
- [ ] **gRPC API** for high-performance communication
- [ ] **AsyncAPI** for event-driven architectures
- [ ] **OpenAPI 3.1** with advanced schemas
- [ ] **API versioning** with backward compatibility

### **📊 Advanced Features**
- [ ] **Rate limiting** and throttling
- [ ] **API analytics** and usage tracking
- [ ] **Custom webhooks** for event notifications
- [ ] **Batch operations** for bulk processing
- [ ] **Streaming APIs** for real-time data

---

## 📞 **API Support**

### **🏆 Developer Support**
- **API documentation** with interactive examples
- **SDK libraries** for multiple languages
- **Sample applications** and integration guides
- **Developer community** and forums
- **Technical support** with SLA guarantees

### **📚 Resources**
- **API reference** with complete endpoint documentation
- **Integration guides** for different platforms
- **Best practices** for API usage
- **Troubleshooting guides** for common issues
- **Video tutorials** for complex integrations
