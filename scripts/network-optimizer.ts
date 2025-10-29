#!/usr/bin/env bun
// [PERF][SCRIPT][NETWORK-OPT-001][v3.0][LIVE]
// Grepable: [perf-script-network-opt-001-v3.0-live]

import { dns, fetch } from 'bun';
import { readFile, writeFile } from 'fs/promises';

/**
 * Citadel Network Optimization Script
 * Implements DNS prefetching, preconnect, and fetch optimizations
 */

interface NetworkConfig {
  dns: {
    prefetch: {
      enabled: boolean;
      hosts: string[];
      ttl: number;
    };
    cache: {
      enabled: boolean;
      ttl: number;
      maxSize: number;
    };
  };
  connections: {
    keepAlive: boolean;
    maxSimultaneous: number;
    timeout: number;
    reuse: boolean;
  };
  preconnect: {
    enabled: boolean;
    hosts: string[];
    startup: boolean;
  };
  fetch: {
    dataUrls: {
      enabled: boolean;
      maxSize: string;
      allowedTypes: string[];
    };
    blobUrls: {
      enabled: boolean;
      maxSize: string;
      cleanupInterval: number;
    };
    verbose: boolean;
    errorHandling: {
      rejectUnauthorized: boolean;
      timeout: number;
      retries: number;
      retryDelay: number;
    };
  };
}

class NetworkOptimizer {
  private config: NetworkConfig;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  // DNS Prefetching Implementation
  async prefetchDNS(): Promise<void> {
    if (!this.config.dns.prefetch.enabled) {
      console.log('⚠️ DNS prefetching is disabled');
      return;
    }

    console.log('🌐 Prefetching DNS entries...');
    
    for (const host of this.config.dns.prefetch.hosts) {
      try {
        console.log(`  🔄 Prefetching ${host}...`);
        dns.prefetch(host);
        console.log(`  ✅ Prefetched ${host}`);
      } catch (error) {
        console.error(`  ❌ Failed to prefetch ${host}:`, error);
      }
    }
    
    console.log('🎉 DNS prefetching completed');
  }

  // Preconnect Implementation
  async preconnectHosts(): Promise<void> {
    if (!this.config.preconnect.enabled) {
      console.log('⚠️ Preconnect is disabled');
      return;
    }

    console.log('🔗 Preconnecting to hosts...');
    
    for (const host of this.config.preconnect.hosts) {
      try {
        console.log(`  🔗 Preconnecting to ${host}...`);
        await fetch.preconnect(host);
        console.log(`  ✅ Preconnected to ${host}`);
      } catch (error) {
        console.error(`  ❌ Failed to preconnect to ${host}:`, error);
      }
    }
    
    console.log('🎉 Host preconnection completed');
  }

  // DNS Cache Statistics
  getDNSCacheStats(): void {
    console.log('📊 DNS Cache Statistics:');
    
    try {
      const stats = dns.getCacheStats();
      console.log(`  📈 Cache entries: ${stats.size || 'N/A'}`);
      console.log(`  ⏱️ Cache TTL: ${this.config.dns.cache.ttl}ms`);
      console.log(`  📦 Max size: ${this.config.dns.cache.maxSize}`);
    } catch (error) {
      console.log('  ⚠️ DNS cache stats not available');
    }
  }

  // Data URL Fetch Implementation
  async fetchDataUrl(dataUrl: string): Promise<string> {
    if (!this.config.fetch.dataUrls.enabled) {
      throw new Error('Data URLs are disabled');
    }

    try {
      console.log(`📄 Fetching data URL: ${dataUrl.substring(0, 50)}...`);
      
      const response = await fetch(dataUrl, {
        verbose: this.config.fetch.verbose,
      });
      
      if (!response.ok) {
        throw new Error(`Data URL fetch failed: ${response.status}`);
      }
      
      const text = await response.text();
      console.log(`✅ Data URL fetched successfully (${text.length} characters)`);
      
      return text;
    } catch (error) {
      console.error('❌ Data URL fetch failed:', error);
      throw error;
    }
  }

  // Blob URL Fetch Implementation
  async fetchBlobUrl(blob: Blob): Promise<string> {
    if (!this.config.fetch.blobUrls.enabled) {
      throw new Error('Blob URLs are disabled');
    }

    try {
      console.log(`🔵 Creating blob URL...`);
      const url = URL.createObjectURL(blob);
      
      console.log(`📄 Fetching blob URL...`);
      const response = await fetch(url, {
        verbose: this.config.fetch.verbose,
      });
      
      if (!response.ok) {
        throw new Error(`Blob URL fetch failed: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Cleanup blob URL
      URL.revokeObjectURL(url);
      console.log(`🧹 Blob URL cleaned up`);
      
      console.log(`✅ Blob URL fetched successfully (${text.length} characters)`);
      
      return text;
    } catch (error) {
      console.error('❌ Blob URL fetch failed:', error);
      throw error;
    }
  }

  // Optimized Fetch with Error Handling
  async optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const maxRetries = this.config.fetch.errorHandling.retries;
    const retryDelay = this.config.fetch.errorHandling.retryDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Fetching ${url} (attempt ${attempt}/${maxRetries})...`);
        
        const response = await fetch(url, {
          ...options,
          verbose: this.config.fetch.verbose,
          // Add connection optimization
          keepalive: this.config.connections.keepAlive,
        });
        
        if (response.ok) {
          console.log(`✅ Fetch successful: ${response.status} ${response.statusText}`);
          return response;
        }
        
        // If not OK and not last attempt, retry
        if (attempt < maxRetries) {
          console.log(`⚠️ Fetch failed with ${response.status}, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
      } catch (error) {
        console.error(`❌ Fetch attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error(`Fetch failed after ${maxRetries} attempts`);
  }

  // Response Buffering Optimization
  async optimizedBuffering(response: Response): Promise<{
    text: string;
    json: any;
    bytes: Uint8Array;
    arrayBuffer: ArrayBuffer;
    blob: Blob;
  }> {
    console.log('📦 Optimizing response buffering...');
    
    const results = await Promise.all([
      response.text(),
      response.json().catch(() => null),
      response.bytes(),
      response.arrayBuffer(),
      response.blob(),
    ]);
    
    console.log('✅ Response buffering completed');
    
    return {
      text: results[0],
      json: results[1],
      bytes: results[2],
      arrayBuffer: results[3],
      blob: results[4],
    };
  }

  // Connection Pool Statistics
  getConnectionStats(): void {
    console.log('🔗 Connection Pool Statistics:');
    console.log(`  🔄 Keep-alive: ${this.config.connections.keepAlive ? 'enabled' : 'disabled'}`);
    console.log(`  📊 Max simultaneous: ${this.config.connections.maxSimultaneous}`);
    console.log(`  ⏱️ Timeout: ${this.config.connections.timeout}ms`);
    console.log(`  🔄 Connection reuse: ${this.config.connections.reuse ? 'enabled' : 'disabled'}`);
  }

  // Performance Benchmark
  async benchmarkFetch(url: string, iterations: number = 10): Promise<void> {
    console.log(`🏃 Running fetch benchmark (${iterations} iterations)...`);
    
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.optimizedFetch(url);
        const end = performance.now();
        const duration = end - start;
        times.push(duration);
        
        console.log(`  📊 Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.error(`  ❌ Iteration ${i + 1} failed:`, error);
      }
    }
    
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log('📈 Benchmark Results:');
      console.log(`  ⚡ Average: ${avg.toFixed(2)}ms`);
      console.log(`  🚀 Min: ${min.toFixed(2)}ms`);
      console.log(`  🐌 Max: ${max.toFixed(2)}ms`);
      console.log(`  📊 Success rate: ${(times.length / iterations * 100).toFixed(1)}%`);
    }
  }
}

// Load configuration
async function loadConfig(): Promise<NetworkConfig> {
  try {
    const bunConfig = await readFile('config/bun.yaml', 'utf-8');
    // Parse YAML (simplified - in real implementation use YAML parser)
    return {
      dns: {
        prefetch: {
          enabled: true,
          hosts: ['localhost', 'accounts.google.com', 'oauth2.googleapis.com'],
          ttl: 30000,
        },
        cache: {
          enabled: true,
          ttl: 30000,
          maxSize: 1000,
        },
      },
      connections: {
        keepAlive: true,
        maxSimultaneous: 256,
        timeout: 30000,
        reuse: true,
      },
      preconnect: {
        enabled: true,
        hosts: ['http://localhost:8080', 'https://accounts.google.com'],
        startup: true,
      },
      fetch: {
        dataUrls: {
          enabled: true,
          maxSize: '1MB',
          allowedTypes: ['text/plain', 'application/json', 'image/*'],
        },
        blobUrls: {
          enabled: true,
          maxSize: '5MB',
          cleanupInterval: 300000,
        },
        verbose: false,
        errorHandling: {
          rejectUnauthorized: true,
          timeout: 30000,
          retries: 3,
          retryDelay: 1000,
        },
      },
    };
  } catch (error) {
    console.error('❌ Failed to load configuration:', error);
    process.exit(1);
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const config = await loadConfig();
  const optimizer = new NetworkOptimizer(config);
  
  switch (command) {
    case 'prefetch':
      await optimizer.prefetchDNS();
      break;
      
    case 'preconnect':
      await optimizer.preconnectHosts();
      break;
      
    case 'stats':
      optimizer.getDNSCacheStats();
      optimizer.getConnectionStats();
      break;
      
    case 'data-url':
      const dataUrl = process.argv[3] || 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      await optimizer.fetchDataUrl(dataUrl);
      break;
      
    case 'blob-url':
      const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
      await optimizer.fetchBlobUrl(blob);
      break;
      
    case 'fetch':
      const url = process.argv[3] || 'http://localhost:8080';
      await optimizer.optimizedFetch(url);
      break;
      
    case 'benchmark':
      const benchmarkUrl = process.argv[3] || 'http://localhost:8080';
      const iterations = parseInt(process.argv[4]) || 10;
      await optimizer.benchmarkFetch(benchmarkUrl, iterations);
      break;
      
    case 'optimize-all':
      console.log('🚀 Running full network optimization...');
      await optimizer.prefetchDNS();
      await optimizer.preconnectHosts();
      optimizer.getDNSCacheStats();
      optimizer.getConnectionStats();
      console.log('🎉 Full optimization completed');
      break;
      
    default:
      console.log('🌐 Citadel Network Optimization v3.0');
      console.log('');
      console.log('Usage: bun run network:optimize <command>');
      console.log('');
      console.log('Commands:');
      console.log('  prefetch      - Prefetch DNS entries');
      console.log('  preconnect    - Preconnect to configured hosts');
      console.log('  stats         - Show DNS cache and connection stats');
      console.log('  data-url      - Test data URL fetching');
      console.log('  blob-url      - Test blob URL fetching');
      console.log('  fetch         - Test optimized fetch');
      console.log('  benchmark     - Run fetch performance benchmark');
      console.log('  optimize-all  - Run full optimization suite');
      break;
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
