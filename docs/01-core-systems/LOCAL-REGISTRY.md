# 🗄️ **SYNDICATE LOCAL REGISTRY**

> **Local private package registry with SQLite, Redis, and S3 integration**

## 🎯 **Overview**

The **SYNDICATE Local Registry** is a comprehensive local package registry system that provides:

- **📦 Package Management** - Store, version, and distribute packages
- **🔐 Secret Vault** - Secure storage for API keys, passwords, and tokens
- **💾 Multi-Tier Caching** - Redis, SQLite, and file-based caching
- **🌐 Cloud Integration** - S3 backup and distribution
- **🗄️ SQLite Database** - Persistent storage with full schema support
- **⚡ Performance Optimization** - Compression and encryption
- **📊 Analytics** - Detailed statistics and monitoring

## 🚀 **Quick Start**

### **Initialize Registry**
```bash
# The registry is automatically initialized on first use
bun run citadel local:stats
```

### **Publish a Package**
```bash
# From file
bun run citadel local:publish my-package 1.0.0 myscope -f ./package.js

# From stdin
echo "console.log('Hello World');" | bun run citadel local:publish hello 1.0.0 demo

# With metadata
bun run citadel local:publish utils 2.1.0 syndicate -f ./utils.ts -m ./metadata.json
```

### **Store a Secret**
```bash
# Store API key
bun run citadel local:secret-store api-key "sk-1234567890abcdef" api-key

# Store database connection
bun run citadel local:secret-store db-url "postgresql://localhost:5432/mydb" connection -s production

# Store JWT secret
bun run citadel local:secret-store jwt-secret "super-secret-key" jwt -s auth
```

### **Resolve and Use**
```bash
# Get package info
bun run citadel local:resolve my-package 1.0.0 myscope

# Download package
bun run citadel local:resolve my-package 1.0.0 myscope -o ./downloaded-package.js

# Get secret
bun run citadel local:secret-get api-key
```

## 📋 **CLI Commands**

### **Package Management**
```bash
# Publish package
bun run citadel local:publish <name> <version> <scope> [options]

# Resolve package
bun run citadel local:resolve <name> <version> <scope> [options]

# List packages
bun run citadel local:list-packages [options]

# List packages in specific scope
bun run citadel local:list-packages -s syndicate
```

### **Secret Management**
```bash
# Store secret
bun run citadel local:secret-store <name> <value> <type> [options]

# Retrieve secret
bun run citadel local:secret-get <name>

# List secrets
bun run citadel local:list-secrets [options]

# List secrets in scope
bun run citadel local:list-secrets -s production
```

### **Statistics and Monitoring**
```bash
# Show comprehensive statistics
bun run citadel local:stats

# Show database schema
bun run citadel local:db-schema
```

### **Maintenance**
```bash
# Clear cache
bun run citadel local:clear-cache

# Clean up expired entries
bun run citadel local:cleanup

# Export registry data
bun run citadel local:export <path>

# Import registry data
bun run citadel local:import <path>
```

## 🗄️ **Database Schema**

The registry uses SQLite with the following schema:

### **Packages Table**
```sql
CREATE TABLE packages (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  scope TEXT NOT NULL,
  metadata TEXT,
  integrity TEXT,
  compressed BOOLEAN,
  encrypted BOOLEAN,
  created_at TEXT,
  updated_at TEXT
);
```

### **Secrets Table**
```sql
CREATE TABLE secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  expires_at TEXT
);
```

### **Cache Table**
```sql
CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  size INTEGER,
  integrity TEXT,
  timestamp INTEGER,
  ttl INTEGER,
  access_count INTEGER,
  last_accessed INTEGER
);
```

## 🔧 **Configuration**

### **Default Configuration**
```typescript
{
  registryPath: "~/.syndicate/registry",
  cachePath: "~/.bun/cache",
  vaultPath: "secrets",
  s3Endpoint: "localhost:9000",
  s3Bucket: "syndicate-registry",
  s3Region: "us-east-1",
  redisUrl: undefined,
  dbPath: "~/.syndicate/registry.db",
  enableCompression: true,
  enableEncryption: true,
  cacheSize: 1000,
  enableRedis: true,
  enableSQLite: true,
  enableS3: true
}
```

### **Environment Variables**
```bash
# Redis configuration
REDIS_URL=redis://localhost:6379

# S3 configuration
S3_ENDPOINT=localhost:9000
S3_BUCKET=syndicate-registry
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Database configuration
DB_PATH=/custom/path/registry.db
```

## 📊 **Statistics**

The registry provides comprehensive statistics:

### **Package Statistics**
- Total packages count
- Packages by scope
- Total storage size
- Compression ratio

### **Secret Statistics**
- Total secrets count
- Secrets by scope
- Expired secrets

### **Cache Statistics**
- Cache size and hit rate
- Memory usage
- Access patterns

### **Storage Backend Status**
- SQLite connection status
- Redis connection status
- S3 connection status
- File system status

### **Performance Metrics**
- Compression enabled status
- Encryption enabled status
- Cache hit rate
- Average response time

## 🔐 **Security Features**

### **Encryption**
- AES-256 encryption for sensitive data
- Configurable encryption keys
- Secure key derivation

### **Integrity Verification**
- SHA-512 checksums for all packages
- Content validation on retrieval
- Tamper detection

### **Access Control**
- Scope-based isolation
- Secret type classification
- Expiration-based cleanup

## 🌐 **Cloud Integration**

### **S3 Backup**
- Automatic package synchronization
- Configurable storage class
- Version history preservation

### **S3 Configuration**
```bash
# Set up S3 credentials
export S3_ACCESS_KEY_ID=your-access-key
export S3_SECRET_ACCESS_KEY=your-secret-key
export S3_BUCKET=your-bucket-name
export S3_ENDPOINT=your-endpoint
```

### **S3 Operations**
- Package upload on publish
- Package download on resolve
- List objects in bucket
- Delete obsolete versions

## 💾 **Caching Strategy**

### **Multi-Tier Caching**
1. **Memory Cache** - Fastest access, limited size
2. **Redis Cache** - Distributed caching, persistence
3. **SQLite Cache** - Local persistence, complex queries
4. **File Cache** - Fallback storage, large objects

### **Cache Policies**
- LRU eviction for memory cache
- TTL-based expiration
- Access frequency tracking
- Automatic cleanup

## 📦 **Package Format**

### **Package Metadata**
```json
{
  "name": "package-name",
  "version": "1.0.0",
  "scope": "organization",
  "uuid": "generated-uuid",
  "metadata": {
    "description": "Package description",
    "author": "Author name",
    "license": "MIT",
    "tags": ["tag1", "tag2"],
    "dependencies": []
  },
  "integrity": "sha512-checksum",
  "compressed": true,
  "encrypted": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **Supported Content Types**
- JavaScript (.js)
- TypeScript (.ts)
- JSON (.json)
- Binary files
- Text files
- Any arbitrary content

## 🔐 **Secret Types**

### **Supported Types**
- `password` - Passwords and passphrases
- `api-key` - API keys and tokens
- `certificate` - SSL/TLS certificates
- `jwt` - JWT secrets
- `connection` - Database connection strings
- `custom` - User-defined types

### **Secret Metadata**
```json
{
  "name": "secret-name",
  "value": "secret-value",
  "type": "api-key",
  "scope": "production",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-12-31T23:59:59.999Z"
}
```

## 🚀 **Performance Optimization**

### **Compression**
- Gzip compression for package content
- Configurable compression levels
- Automatic decompression on resolve

### **Caching**
- Intelligent cache warming
- Prefetching strategies
- Cache invalidation

### **Database Optimization**
- Indexed queries
- Prepared statements
- Connection pooling

## 🔄 **Data Import/Export**

### **Export Format**
```json
{
  "version": "1.0.0",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "packages": [...],
  "secrets": [...],
  "cache": [...],
  "config": {...}
}
```

### **Export Operations**
```bash
# Export all data
bun run citadel local:export backup.json

# Export includes:
# - All packages (with base64-encoded content)
# - All secrets
# - Cache entries
# - Configuration snapshot
```

### **Import Operations**
```bash
# Import data
bun run citadel local:import backup.json

# Import validates:
# - Version compatibility
# - Data integrity
# - Schema consistency
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check database file permissions
ls -la ~/.syndicate/registry.db

# Recreate database
rm ~/.syndicate/registry.db
bun run citadel local:stats
```

#### **Redis Connection Failed**
```bash
# Check Redis server
redis-cli ping

# Check configuration
echo $REDIS_URL
```

#### **S3 Connection Failed**
```bash
# Check credentials
env | grep S3_

# Test connection
aws s3 ls --endpoint-url $S3_ENDPOINT
```

#### **Package Not Found**
```bash
# List all packages
bun run citadel local:list-packages

# Check specific scope
bun run citadel local:list-packages -s your-scope
```

### **Debug Mode**
```bash
# Enable verbose logging
DEBUG=registry:* bun run citadel local:stats
```

## 📚 **Examples**

### **Complete Workflow**
```bash
# 1. Initialize registry
bun run citadel local:stats

# 2. Publish package
bun run citadel local:publish my-app 1.0.0 org -f ./app.js

# 3. Store secrets
bun run citadel local:secret-store db-url "postgres://..." connection
bun run citadel local:secret-store api-key "sk-..." api-key

# 4. Verify publication
bun run citadel local:list-packages
bun run citadel local:list-secrets

# 5. Resolve package
bun run citadel local:resolve my-app 1.0.0 org -o ./downloaded-app.js

# 6. Get secret
bun run citadel local:secret-get db-url

# 7. Export backup
bun run citadel local:export backup.json
```

### **Production Setup**
```bash
# 1. Configure environment
export REDIS_URL=redis://prod-redis:6379
export S3_ENDPOINT=s3.amazonaws.com
export S3_BUCKET=company-registry
export S3_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export S3_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

# 2. Initialize production registry
bun run citadel local:stats

# 3. Set up automated backup
bun run citadel local:export /backups/registry-$(date +%Y%m%d).json

# 4. Monitor performance
bun run citadel local:stats
```

## 🎯 **Best Practices**

### **Package Management**
- Use semantic versioning
- Include comprehensive metadata
- Test packages before publishing
- Use appropriate scopes

### **Secret Management**
- Use descriptive names
- Set appropriate expiration dates
- Use scope-based organization
- Rotate secrets regularly

### **Performance**
- Enable compression for large packages
- Use Redis for distributed caching
- Monitor cache hit rates
- Clean up expired entries

### **Security**
- Enable encryption for sensitive data
- Use environment variables for credentials
- Regular backup of registry data
- Monitor access patterns

## 🚀 **Production Deployment**

### **Requirements**
- Bun 1.3+
- SQLite 3.x
- Redis 6.x+ (optional)
- S3-compatible storage (optional)

### **Scaling Considerations**
- Use Redis for multi-instance deployments
- Configure S3 for disaster recovery
- Monitor database size and performance
- Implement backup strategies

### **Monitoring**
- Track package publish/resolve rates
- Monitor cache performance
- Alert on storage capacity
- Log access patterns

## 📖 **API Reference**

### **LocalRegistry Class**

#### **Constructor**
```typescript
new LocalRegistry(config?: Partial<LocalRegistryConfig>)
```

#### **Package Methods**
```typescript
async publishPackage(name: string, version: string, scope: string, content: Buffer, metadata?: any): Promise<RegistryPackage>
async resolvePackage(scope: string, name: string, version: string): Promise<RegistryPackage | null>
async listPackages(scope?: string): Promise<RegistryPackage[]>
```

#### **Secret Methods**
```typescript
async storeSecret(name: string, value: string, type: SecretType, scope: string = 'default'): Promise<VaultSecret>
async getSecret(name: string): Promise<VaultSecret | null>
async listSecrets(scope?: string): Promise<VaultSecret[]>
```

#### **Utility Methods**
```typescript
async getRegistryStats(): Promise<RegistryStats>
async clearCache(): Promise<void>
async cleanup(): Promise<void>
async exportData(path: string): Promise<void>
async importData(path: string): Promise<void>
getDatabaseSchema(): DatabaseSchema | null>
```

## 🎉 **Conclusion**

The **SYNDICATE Local Registry** provides a comprehensive solution for local package and secret management with enterprise-grade features:

- ✅ **Multi-backend storage** (SQLite, Redis, S3, Files)
- ✅ **Security** (Encryption, Integrity, Access Control)
- ✅ **Performance** (Compression, Caching, Optimization)
- ✅ **Monitoring** (Statistics, Analytics, Health Checks)
- ✅ **Reliability** (Backup, Recovery, Cleanup)
- ✅ **Scalability** (Distributed caching, Cloud integration)

Perfect for development teams, CI/CD pipelines, and production deployments requiring local package registry capabilities.
