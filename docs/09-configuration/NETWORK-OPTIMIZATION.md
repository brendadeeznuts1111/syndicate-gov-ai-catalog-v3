# 🌐 Network Optimization & Performance Guide

## Overview

Citadel includes comprehensive network optimization features leveraging Bun's high-performance fetch implementation, including DNS prefetching, connection pooling, Data URL/Blob URL support, and advanced performance optimizations.

## 🚀 Quick Start

### 1. Full Network Optimization
```bash
bun run network:optimize
```
Runs complete optimization suite: DNS prefetching, preconnection, and stats.

### 2. DNS Prefetching
```bash
bun run network:prefetch
```
Prefetches DNS entries for configured hosts to eliminate lookup latency.

### 3. Host Preconnection
```bash
bun run network:preconnect
```
Establishes early connections to frequently accessed hosts.

### 4. Performance Benchmarking
```bash
bun run network:benchmark http://localhost:8080 20
```
Tests fetch performance with 20 iterations.

## 🔧 Configuration

### `config/bun.yaml` Network Section

```yaml
network:
  # DNS Prefetching
  dns:
    prefetch:
      enabled: true
      hosts:
        - "${API_HOST:localhost}"
        - "${REDIS_HOST:localhost}"
        - "accounts.google.com"
        - "oauth2.googleapis.com"
      ttl: 30000  # 30 seconds
      
    # DNS Caching
    cache:
      enabled: true
      ttl: 30000
      maxSize: 1000
      
  # Connection Pooling
  connections:
    keepAlive: true
    maxSimultaneous: "${BUN_CONFIG_MAX_HTTP_REQUESTS:256}"
    timeout: 30000
    reuse: true
    
  # Preconnect Configuration
  preconnect:
    enabled: true
    hosts:
      - "${API_URL:http://localhost:8080}"
      - "https://accounts.google.com"
    startup: true
    
  # Fetch Optimization
  fetch:
    dataUrls:
      enabled: true
      maxSize: "1MB"
      allowedTypes: ["text/plain", "application/json", "image/*"]
      
    blobUrls:
      enabled: true
      maxSize: "5MB"
      cleanupInterval: 300000
      
    verbose: "${FETCH_VERBOSE:false}"
    
    errorHandling:
      rejectUnauthorized: true
      timeout: 30000
      retries: 3
      retryDelay: 1000
```

## 🌐 DNS Optimization

### DNS Prefetching
Eliminate DNS lookup latency by prefetching entries for hosts you'll need soon:

```typescript
import { dns } from 'bun';

// Prefetch individual host
dns.prefetch('api.example.com');

// Prefetch multiple hosts
const hosts = ['api.example.com', 'cdn.example.com', 'auth.example.com'];
hosts.forEach(host => dns.prefetch(host));
```

### DNS Caching
Bun automatically caches DNS queries for 30 seconds with deduplication:

```typescript
// Get cache statistics
const stats = dns.getCacheStats();
console.log(`DNS cache entries: ${stats.size}`);
```

### Configuration
```yaml
dns:
  prefetch:
    enabled: true
    hosts:
      - "localhost"
      - "accounts.google.com"
      - "oauth2.googleapis.com"
    ttl: 30000
    
  cache:
    enabled: true
    ttl: 30000
    maxSize: 1000
```

## 🔗 Connection Optimization

### Preconnect
Start DNS lookup, TCP connection, and TLS handshake early:

```typescript
import { fetch } from 'bun';

// Preconnect to a host
await fetch.preconnect('https://api.example.com');

// Preconnect to multiple hosts
const hosts = [
  'https://api.example.com',
  'https://cdn.example.com',
  'https://auth.example.com'
];

for (const host of hosts) {
  await fetch.preconnect(host);
}
```

### Connection Pooling
Bun automatically reuses connections with HTTP Keep-Alive:

```typescript
// Automatic connection pooling
const response1 = await fetch('https://api.example.com/data');
const response2 = await fetch('https://api.example.com/users');
// Reuses same connection

// Configure simultaneous connections
process.env.BUN_CONFIG_MAX_HTTP_REQUESTS = '512';
```

### Configuration
```yaml
connections:
  keepAlive: true
  maxSimultaneous: 256
  timeout: 30000
  reuse: true
```

## 📄 Data URL Support

Fetch data encoded directly in URLs using the `data:` scheme:

```typescript
// Base64 encoded text
const response = await fetch('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==');
const text = await response.text(); // "Hello, World!"

// JSON data
const jsonResponse = await fetch('data:application/json,{"hello":"world"}');
const json = await jsonResponse.json(); // { hello: "world" }

// Image data
const imageResponse = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
const imageBlob = await imageResponse.blob();
```

### Configuration
```yaml
fetch:
  dataUrls:
    enabled: true
    maxSize: "1MB"
    allowedTypes: ["text/plain", "application/json", "image/*"]
```

## 🔵 Blob URL Support

Fetch blobs using URLs created with `URL.createObjectURL()`:

```typescript
// Create blob
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
const url = URL.createObjectURL(blob);

// Fetch blob
const response = await fetch(url);
const text = await response.text();

// Cleanup
URL.revokeObjectURL(url);
```

### Configuration
```yaml
fetch:
  blobUrls:
    enabled: true
    maxSize: "5MB"
    cleanupInterval: 300000  # 5 minutes
```

## 🛡️ Error Handling & Debugging

### Advanced Error Handling
```typescript
const response = await fetch('https://api.example.com', {
  verbose: true,  // Enable debugging output
  // Error handling options
  rejectUnauthorized: true,
  timeout: 30000,
});

// Handle specific errors
try {
  const response = await fetch('https://api.example.com');
} catch (error) {
  if (error.message.includes('TLS certificate validation failed')) {
    console.error('Certificate error:', error);
  } else if (error.message.includes('timeout')) {
    console.error('Request timeout:', error);
  }
}
```

### Retry Logic
```typescript
async function fetchWithRetry(url: string, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Debugging with Verbose Output
```typescript
// Enable verbose debugging
const response = await fetch('https://api.example.com', {
  verbose: true,
});

// Console output:
// [fetch] > HTTP/1.1 GET https://api.example.com/
// [fetch] > Connection: keep-alive
// [fetch] > User-Agent: Bun/1.3.1
// [fetch] > Accept: */*
// [fetch] > Host: api.example.com
// [fetch] < 200 OK
// [fetch] < Content-Type: application/json
// [fetch] < Content-Length: 1234
```

## 📊 Performance Optimization

### Response Buffering
Use the fastest methods for reading response bodies:

```typescript
const response = await fetch('https://api.example.com/data');

// Fastest methods
const text = await response.text();
const json = await response.json();
const bytes = await response.bytes();
const arrayBuffer = await response.arrayBuffer();
const blob = await response.blob();

// Write directly to file
import { write } from 'bun';
await write('output.txt', response);
```

### Content-Type Handling
Bun automatically sets Content-Type for request bodies:

```typescript
// Blob objects
const blob = new Blob(['data'], { type: 'application/json' });
await fetch('https://api.example.com', { 
  method: 'POST', 
  body: blob 
  // Content-Type automatically set to "application/json"
});

// FormData
const formData = new FormData();
formData.append('file', file);
await fetch('https://api.example.com', {
  method: 'POST',
  body: formData
  // Content-Type automatically set with multipart boundary
});
```

### Large File Uploads
Bun optimizes large file uploads using `sendfile` syscall:

```typescript
// Automatic optimization for files > 32KB
const file = Bun.file('large-file.zip');
await fetch('https://api.example.com/upload', {
  method: 'POST',
  body: file,
  // Uses sendfile syscall for optimal performance
});
```

## 🧪 Available Scripts

```bash
# Full optimization suite
bun run network:optimize

# Individual optimizations
bun run network:prefetch          # DNS prefetching
bun run network:preconnect        # Host preconnection
bun run network:stats             # Cache and connection stats

# Testing and debugging
bun run network:data-url          # Test data URL fetching
bun run network:blob-url          # Test blob URL fetching
bun run network:fetch             # Test optimized fetch
bun run network:benchmark         # Performance benchmark
bun run network:performance       # Quick performance test
```

## 📈 Performance Metrics

### Benchmark Results
```bash
bun run network:benchmark https://api.example.com 20
```

Output:
```
🏃 Running fetch benchmark (20 iterations)...
  📊 Iteration 1: 45.23ms
  📊 Iteration 2: 42.18ms
  📊 Iteration 3: 43.67ms
  ...
📈 Benchmark Results:
  ⚡ Average: 43.45ms
  🚀 Min: 41.23ms
  🐌 Max: 47.89ms
  📊 Success rate: 100%
```

### Connection Statistics
```bash
bun run network:stats
```

Output:
```
📊 DNS Cache Statistics:
  📈 Cache entries: 15
  ⏱️ Cache TTL: 30000ms
  📦 Max size: 1000

🔗 Connection Pool Statistics:
  🔄 Keep-alive: enabled
  📊 Max simultaneous: 256
  ⏱️ Timeout: 30000ms
  🔄 Connection reuse: enabled
```

## 🔧 Environment Variables

```bash
# Connection limits
BUN_CONFIG_MAX_HTTP_REQUESTS=512

# Debugging
FETCH_VERBOSE=true

# Network timeouts
NETWORK_TIMEOUT=30000

# DNS settings
DNS_CACHE_TTL=30000
DNS_CACHE_SIZE=1000
```

## 🚀 Production Deployment

### Preconnect at Startup
```bash
# Preconnect to critical hosts at application startup
bun --fetch-preconnect https://api.example.com ./app.ts
```

### Optimize for Production
```yaml
# Production configuration
network:
  dns:
    prefetch:
      enabled: true
      hosts: ["api.example.com", "cdn.example.com", "auth.example.com"]
      
  connections:
    maxSimultaneous: 512
    timeout: 15000
    
  fetch:
    verbose: false
    errorHandling:
      timeout: 15000
      retries: 5
```

### Monitoring
- Monitor DNS cache hit rates
- Track connection reuse statistics
- Measure fetch performance metrics
- Watch for timeout and retry patterns

## 🎯 Best Practices

1. **Prefetch DNS** for known hosts at startup
2. **Preconnect** to critical APIs before first request
3. **Use connection pooling** for repeated requests
4. **Enable compression** for text-based responses
5. **Implement retry logic** for network failures
6. **Monitor performance** with regular benchmarks
7. **Configure timeouts** appropriately for your use case
8. **Use Data URLs** for small embedded content
9. **Optimize large uploads** with proper chunking
10. **Enable verbose debugging** during development

Your Citadel platform now has enterprise-grade network optimization with Bun's high-performance fetch implementation! 🚀
