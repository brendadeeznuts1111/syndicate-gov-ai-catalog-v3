#!/usr/bin/env bun
// [PRELOAD][SETUP][PRELOAD-SETUP-001][v3.0][LIVE]
// Grepable: [preload-setup-preload-setup-001-v3.0-live]

/**
 * Citadel Preload Setup Script
 * Runs before main application to initialize systems
 */

import { dns, fetch } from 'bun';

console.log('🏰 Citadel Preload Setup v3.0');
console.log('================================');

// DNS Prefetching for critical hosts
async function prefetchCriticalDNS() {
  console.log('🌐 Prefetching critical DNS entries...');
  
  const criticalHosts = [
    'localhost',
    '127.0.0.1',
    'accounts.google.com',
    'oauth2.googleapis.com',
    'www.googleapis.com',
    'api.github.com',
    'registry.npmjs.org'
  ];
  
  for (const host of criticalHosts) {
    try {
      dns.prefetch(host);
      console.log(`  ✅ Prefetched: ${host}`);
    } catch (error) {
      console.log(`  ❌ Failed to prefetch: ${host}`);
    }
  }
}

// Preconnect to critical services
async function preconnectServices() {
  console.log('🔗 Preconnecting to critical services...');
  
  const services = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ];
  
  for (const service of services) {
    try {
      await fetch.preconnect(service);
      console.log(`  ✅ Preconnected: ${service}`);
    } catch (error) {
      console.log(`  ⚠️ Could not preconnect: ${service}`);
    }
  }
}

// Initialize environment
function initializeEnvironment() {
  console.log('🔧 Initializing environment...');
  
  // Set default User-Agent
  process.env.BUN_USER_AGENT = `Citadel/3.0.0 (Bun-${process.version})`;
  
  // Set default options
  process.env.BUN_OPTIONS = '--watch --hot';
  
  // Configure performance settings
  process.env.BUN_MAX_THREADS = '4';
  
  console.log('  ✅ Environment initialized');
}

// Validate configuration
function validateConfiguration() {
  console.log('🔍 Validating configuration...');
  
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'HOST'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`  ⚠️ Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('  ✅ All required environment variables set');
  }
}

// Main preload execution
async function main() {
  try {
    initializeEnvironment();
    validateConfiguration();
    await prefetchCriticalDNS();
    await preconnectServices();
    
    console.log('🎉 Preload setup completed successfully');
    console.log('================================');
  } catch (error) {
    console.error('❌ Preload setup failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main();
}

export { prefetchCriticalDNS, preconnectServices, initializeEnvironment, validateConfiguration };
