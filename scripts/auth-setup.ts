#!/usr/bin/env bun
// [AUTH][SCRIPT][AUTH-SETUP-001][v3.0][LIVE]
// Grepable: [auth-script-auth-setup-001-v3.0-live]

import { spawn } from 'bun';
import { readFile, writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';

/**
 * Citadel Authentication Setup Script
 * Generates secure secrets and configures authentication
 */

class AuthSetup {
  static generateSecureSecret(length: number = 64): string {
    return randomBytes(length).toString('hex');
  }

  static async generateEnvFile(): Promise<void> {
    console.log('🔐 Generating secure environment configuration...');
    
    const envContent = `# Citadel Environment Configuration
# Generated on ${new Date().toISOString()}
# [AUTH][ENV][GENERATED][ENV-GEN-001][v3.0][LIVE]

# JWT Configuration
JWT_SECRET=${this.generateSecureSecret()}
JWT_ACCESS_SECRET=${this.generateSecureSecret(32)}
JWT_REFRESH_SECRET=${this.generateSecureSecret(48)}
JWT_ID_SECRET=${this.generateSecureSecret(32)}

# Session Configuration
SESSION_SECRET=${this.generateSecureSecret()}
CSRF_SECRET=${this.generateSecureSecret(32)}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Cookie Configuration
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost

# Application URLs
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3001
API_URL=http://localhost:8080

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database Configuration
DATABASE_URL=./.citadel/catalog.db

# Application Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Security Configuration
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true
CSRF_PROTECTION_ENABLED=true

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Citadel Configuration
CITADEL_REGISTRY_PATH=./.citadel/registry
CITADEL_VAULT_PATH=./.citadel/vault
CITADEL_LOGS_PATH=./.citadel/logs
`;

    await writeFile('.env', envContent, 'utf-8');
    console.log('✅ .env file generated with secure secrets');
  }

  static async validateAuthConfig(): Promise<boolean> {
    console.log('🔍 Validating authentication configuration...');
    
    try {
      // Check if auth-config.yaml exists
      await readFile('config/auth-config.yaml', 'utf-8');
      console.log('✅ auth-config.yaml found');
      
      // Check if bun.yaml has auth config
      const bunConfig = await readFile('config/bun.yaml', 'utf-8');
      if (bunConfig.includes('jwt:') && bunConfig.includes('google:')) {
        console.log('✅ bun.yaml has authentication configuration');
      } else {
        console.log('❌ bun.yaml missing authentication configuration');
        return false;
      }
      
      // Check if .env exists
      try {
        await readFile('.env', 'utf-8');
        console.log('✅ .env file found');
      } catch {
        console.log('⚠️ .env file not found, run setup to generate');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Authentication configuration validation failed:', error);
      return false;
    }
  }

  static async setupGoogleOAuth(): Promise<void> {
    console.log('🔗 Google OAuth Setup Instructions:');
    console.log('');
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing project');
    console.log('3. Enable Google+ API and Google OAuth2 API');
    console.log('4. Create OAuth2 Client ID credentials');
    console.log('5. Add authorized redirect URI: http://localhost:3000/auth/google/callback');
    console.log('6. Copy Client ID and Client Secret to your .env file');
    console.log('');
    console.log('📝 Required environment variables:');
    console.log('- GOOGLE_CLIENT_ID');
    console.log('- GOOGLE_CLIENT_SECRET');
  }

  static async testAuthSetup(): Promise<void> {
    console.log('🧪 Testing authentication setup...');
    
    try {
      // Test JWT secret generation
      const testSecret = this.generateSecureSecret(32);
      if (testSecret.length === 64) {
        console.log('✅ JWT secret generation working');
      }
      
      // Test configuration loading
      const authConfig = await readFile('config/auth-config.yaml', 'utf-8');
      if (authConfig.includes('jwt:') && authConfig.includes('google:')) {
        console.log('✅ Authentication configuration loaded');
      }
      
      console.log('🎉 Authentication setup test completed');
    } catch (error) {
      console.error('❌ Authentication setup test failed:', error);
    }
  }

  static async showAuthEndpoints(): Promise<void> {
    console.log('🔗 Available Authentication Endpoints:');
    console.log('');
    console.log('🔐 JWT Authentication:');
    console.log('  POST /api/auth/login          - JWT login');
    console.log('  POST /api/auth/refresh        - Refresh JWT token');
    console.log('  POST /api/auth/logout         - JWT logout');
    console.log('  GET  /api/auth/verify         - Verify JWT token');
    console.log('');
    console.log('🔗 Google OAuth:');
    console.log('  GET  /api/auth/google         - Initiate Google OAuth');
    console.log('  GET  /api/auth/google/callback - Google OAuth callback');
    console.log('  POST /api/auth/google/logout  - Google OAuth logout');
    console.log('');
    console.log('🔒 Basic Authentication (if enabled):');
    console.log('  POST /api/auth/basic/login    - Basic auth login');
    console.log('  POST /api/auth/basic/logout   - Basic auth logout');
    console.log('');
    console.log('📊 Authentication Status:');
    console.log('  GET  /api/auth/status         - Current auth status');
    console.log('  GET  /api/auth/profile        - User profile');
    console.log('  POST /api/auth/change-password - Change password');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await AuthSetup.generateEnvFile();
      break;
      
    case 'validate':
      const isValid = await AuthSetup.validateAuthConfig();
      process.exit(isValid ? 0 : 1);
      break;
      
    case 'google':
      await AuthSetup.setupGoogleOAuth();
      break;
      
    case 'test':
      await AuthSetup.testAuthSetup();
      break;
      
    case 'endpoints':
      await AuthSetup.showAuthEndpoints();
      break;
      
    default:
      console.log('🔐 Citadel Authentication Setup v3.0');
      console.log('');
      console.log('Usage: bun run auth:setup <command>');
      console.log('');
      console.log('Commands:');
      console.log('  setup      - Generate .env file with secure secrets');
      console.log('  validate   - Validate authentication configuration');
      console.log('  google     - Show Google OAuth setup instructions');
      console.log('  test       - Test authentication setup');
      console.log('  endpoints  - Show available authentication endpoints');
      break;
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
