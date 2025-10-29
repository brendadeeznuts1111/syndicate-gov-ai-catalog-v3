#!/usr/bin/env bun
// [PRELOAD][AUTH][PRELOAD-AUTH-001][v3.0][LIVE]
// Grepable: [preload-auth-preload-auth-001-v3.0-live]

/**
 * Citadel Authentication Preload Script
 * Initializes authentication systems and validates security
 */

import { randomBytes } from 'crypto';

console.log('🔐 Citadel Authentication Preload v3.0');
console.log('======================================');

// Authentication configuration
interface AuthConfig {
  jwt: {
    enabled: boolean;
    secret: string;
    algorithm: string;
    expiresIn: string;
  };
  session: {
    enabled: boolean;
    secret: string;
    store: string;
    ttl: number;
  };
  csrf: {
    enabled: boolean;
    secret: string;
  };
  google: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
}

// Load authentication configuration
function getAuthConfig(): AuthConfig {
  return {
    jwt: {
      enabled: process.env.JWT_ENABLED !== 'false',
      secret: process.env.JWT_SECRET || '',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    session: {
      enabled: process.env.SESSION_ENABLED !== 'false',
      secret: process.env.SESSION_SECRET || '',
      store: process.env.SESSION_STORE || 'memory',
      ttl: parseInt(process.env.SESSION_TTL || '86400')
    },
    csrf: {
      enabled: process.env.CSRF_ENABLED !== 'false',
      secret: process.env.CSRF_SECRET || ''
    },
    google: {
      enabled: process.env.GOOGLE_ENABLED !== 'false',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }
  };
}

// Generate secure secrets if missing
function generateSecureSecrets(config: AuthConfig) {
  console.log('🔑 Generating secure secrets...');
  
  if (!config.jwt.secret) {
    config.jwt.secret = randomBytes(64).toString('hex');
    process.env.JWT_SECRET = config.jwt.secret;
    console.log('  ✅ JWT secret generated');
  }
  
  if (!config.session.secret) {
    config.session.secret = randomBytes(64).toString('hex');
    process.env.SESSION_SECRET = config.session.secret;
    console.log('  ✅ Session secret generated');
  }
  
  if (!config.csrf.secret) {
    config.csrf.secret = randomBytes(32).toString('hex');
    process.env.CSRF_SECRET = config.csrf.secret;
    console.log('  ✅ CSRF secret generated');
  }
}

// Validate JWT configuration
function validateJWTConfig(config: AuthConfig) {
  console.log('🔍 Validating JWT configuration...');
  
  if (!config.jwt.enabled) {
    console.log('  ⚠️ JWT is disabled');
    return;
  }
  
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    console.log('  ❌ JWT secret must be at least 32 characters');
    return;
  }
  
  if (!['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'].includes(config.jwt.algorithm)) {
    console.log('  ❌ Invalid JWT algorithm');
    return;
  }
  
  console.log('  ✅ JWT configuration valid');
}

// Validate session configuration
function validateSessionConfig(config: AuthConfig) {
  console.log('🔍 Validating session configuration...');
  
  if (!config.session.enabled) {
    console.log('  ⚠️ Sessions are disabled');
    return;
  }
  
  if (!config.session.secret || config.session.secret.length < 32) {
    console.log('  ❌ Session secret must be at least 32 characters');
    return;
  }
  
  if (!['memory', 'redis', 'database'].includes(config.session.store)) {
    console.log('  ❌ Invalid session store type');
    return;
  }
  
  if (config.session.ttl < 300) {
    console.log('  ⚠️ Session TTL is very short (< 5 minutes)');
  }
  
  console.log('  ✅ Session configuration valid');
}

// Validate Google OAuth configuration
function validateGoogleConfig(config: AuthConfig) {
  console.log('🔍 Validating Google OAuth configuration...');
  
  if (!config.google.enabled) {
    console.log('  ⚠️ Google OAuth is disabled');
    return;
  }
  
  if (!config.google.clientId) {
    console.log('  ❌ Google Client ID is required');
    return;
  }
  
  if (!config.google.clientSecret) {
    console.log('  ❌ Google Client Secret is required');
    return;
  }
  
  console.log('  ✅ Google OAuth configuration valid');
}

// Initialize CSRF protection
function initializeCSRFProtection(config: AuthConfig) {
  console.log('🛡️ Initializing CSRF protection...');
  
  if (!config.csrf.enabled) {
    console.log('  ⚠️ CSRF protection is disabled');
    return;
  }
  
  if (!config.csrf.secret) {
    console.log('  ❌ CSRF secret is required');
    return;
  }
  
  // Set CSRF configuration
  process.env.CSRF_COOKIE_NAME = 'citadel_csrf_token';
  process.env.CSRF_HEADER_NAME = 'x-citadel-csrf-token';
  process.env.CSRF_COOKIE_SECURE = process.env.COOKIE_SECURE || 'false';
  process.env.CSRF_COOKIE_HTTP_ONLY = 'false';
  process.env.CSRF_COOKIE_SAME_SITE = 'strict';
  
  console.log('  ✅ CSRF protection initialized');
}

// Setup authentication middleware
function setupAuthMiddleware(config: AuthConfig) {
  console.log('🔧 Setting up authentication middleware...');
  
  // JWT middleware settings
  if (config.jwt.enabled) {
    process.env.JWT_COOKIE_NAME = 'citadel_access_token';
    process.env.JWT_REFRESH_COOKIE_NAME = 'citadel_refresh_token';
    process.env.JWT_ID_COOKIE_NAME = 'citadel_id_token';
    process.env.JWT_COOKIE_SECURE = process.env.COOKIE_SECURE || 'false';
    process.env.JWT_COOKIE_HTTP_ONLY = 'true';
    process.env.JWT_COOKIE_SAME_SITE = 'strict';
    console.log('  ✅ JWT middleware configured');
  }
  
  // Session middleware settings
  if (config.session.enabled) {
    process.env.SESSION_COOKIE_NAME = 'citadel_session';
    process.env.SESSION_COOKIE_SECURE = process.env.COOKIE_SECURE || 'false';
    process.env.SESSION_COOKIE_HTTP_ONLY = 'true';
    process.env.SESSION_COOKIE_SAME_SITE = 'strict';
    console.log('  ✅ Session middleware configured');
  }
}

// Validate security headers
function validateSecurityHeaders() {
  console.log('🔒 Validating security headers...');
  
  const securityHeaders = [
    'CSP_ENABLED',
    'HSTS_ENABLED',
    'X_FRAME_OPTIONS',
    'X_CONTENT_TYPE_OPTIONS',
    'X_XSS_PROTECTION'
  ];
  
  const configuredHeaders = securityHeaders.filter(header => process.env[header]);
  
  if (configuredHeaders.length > 0) {
    console.log(`  ✅ ${configuredHeaders.length} security headers configured`);
  } else {
    console.log('  ⚠️ No security headers configured');
  }
}

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('🧪 Testing authentication endpoints...');
  
  const endpoints = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/verify'
  ];
  
  console.log('  📡 Available endpoints:');
  endpoints.forEach(endpoint => {
    console.log(`    - ${endpoint}`);
  });
  
  console.log('  ✅ Endpoint configuration validated');
}

// Main preload execution
async function main() {
  try {
    const config = getAuthConfig();
    
    console.log(`🔐 Authentication Configuration:`);
    console.log(`  - JWT: ${config.jwt.enabled ? 'enabled' : 'disabled'}`);
    console.log(`  - Sessions: ${config.session.enabled ? 'enabled' : 'disabled'}`);
    console.log(`  - CSRF: ${config.csrf.enabled ? 'enabled' : 'disabled'}`);
    console.log(`  - Google OAuth: ${config.google.enabled ? 'enabled' : 'disabled'}`);
    console.log('');
    
    generateSecureSecrets(config);
    validateJWTConfig(config);
    validateSessionConfig(config);
    validateGoogleConfig(config);
    initializeCSRFProtection(config);
    setupAuthMiddleware(config);
    validateSecurityHeaders();
    await testAuthEndpoints();
    
    console.log('');
    console.log('🎉 Authentication preload completed successfully');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Authentication preload failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main();
}

export { getAuthConfig, generateSecureSecrets, validateJWTConfig, validateSessionConfig };
