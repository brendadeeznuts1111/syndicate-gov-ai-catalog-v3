# 🔐 Authentication Configuration Guide

## Overview

Citadel now includes comprehensive JWT cookie authentication and Google OAuth session management with enterprise-grade security features.

## 🚀 Quick Setup

### 1. Generate Secure Configuration
```bash
bun run auth:setup
```
This generates a `.env` file with cryptographically secure secrets.

### 2. Configure Google OAuth
```bash
bun run auth:google
```
Follow the instructions to set up Google OAuth2 credentials.

### 3. Validate Configuration
```bash
bun run auth:validate
```

### 4. Test Authentication
```bash
bun run auth:test
```

## 📁 Configuration Files

### `config/bun.yaml`
Enhanced with comprehensive authentication configuration:
- JWT token settings
- Secure cookie configuration  
- Google OAuth2 setup
- Session management
- Multi-provider auth support
- CORS configuration
- Rate limiting

### `config/auth-config.yaml`
Dedicated authentication configuration with:
- Detailed JWT token management
- Cookie security settings
- Google OAuth2 flow configuration
- Session storage options
- Security headers
- CSRF protection
- Maintenance and cleanup settings

### `.env.example`
Template for required environment variables:
- JWT secrets (access, refresh, ID tokens)
- Session and CSRF secrets
- Google OAuth credentials
- Cookie and CORS settings
- Database and Redis configuration

## 🔧 Authentication Features

### JWT Cookie Authentication
- **Access Tokens**: 15-minute expiry, secure cookies
- **Refresh Tokens**: 7-day expiry, automatic rotation
- **ID Tokens**: 1-hour expiry for user identification
- **Secure Cookies**: httpOnly, secure, sameSite=strict

### Google OAuth Session Management
- **OAuth2 Flow**: Authorization code with PKCE
- **Scope Management**: OpenID, profile, email access
- **Session Storage**: Redis-based with fallback options
- **Token Refresh**: Automatic token renewal

### Multi-Provider Support
- **Priority System**: JWT (1), Google (2), Basic (3)
- **Flexible Endpoints**: Configurable per provider
- **Fallback Options**: Graceful degradation
- **Unified Interface**: Consistent API across providers

## 🛡️ Security Features

### Secure Cookie Configuration
```yaml
cookies:
  accessToken:
    secure: true
    httpOnly: true
    sameSite: "strict"
    maxAge: 900  # 15 minutes
```

### JWT Token Management
```yaml
jwt:
  algorithm: "HS256"
  expiresIn: "24h"
  refreshExpiresIn: "7d"
  issuer: "citadel.syndicate.gov"
```

### CORS Configuration
```yaml
cors:
  origins: ["http://localhost:3000", "http://localhost:3001"]
  credentials: true
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
```

### Rate Limiting
```yaml
rateLimit:
  general:
    windowMs: 900000  # 15 minutes
    max: 100
  auth:
    login:
      windowMs: 900000
      max: 5  # 5 login attempts per 15 minutes
```

## 📡 Authentication Endpoints

### JWT Authentication
- `POST /api/auth/login` - JWT login with credentials
- `POST /api/auth/refresh` - Refresh JWT tokens
- `POST /api/auth/logout` - JWT logout (clears cookies)
- `GET /api/auth/verify` - Verify JWT token validity

### Google OAuth
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/logout` - Google OAuth logout

### User Management
- `GET /api/auth/status` - Current authentication status
- `GET /api/auth/profile` - User profile information
- `POST /api/auth/change-password` - Change user password

## 🔒 Security Headers

Comprehensive security header configuration:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- Cross-Origin Resource Policy
- X-Frame-Options
- X-Content-Type-Options

## 🧪 Testing & Validation

### Available Scripts
```bash
# Generate secure secrets and .env file
bun run auth:setup

# Validate authentication configuration
bun run auth:validate

# Show Google OAuth setup instructions
bun run auth:google

# Test authentication setup
bun run auth:test

# Show available endpoints
bun run auth:endpoints

# Full setup and validation
bun run auth:full-setup

# Comprehensive security check
bun run auth:check
```

### Configuration Validation
The setup script validates:
- ✅ Required configuration files exist
- ✅ JWT and Google OAuth settings present
- ✅ Environment variables configured
- ✅ Security headers properly set
- ✅ CORS and rate limiting enabled

## 🔧 Environment Variables

### Required Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_ID_SECRET=your-id-token-secret

# Session Configuration
SESSION_SECRET=your-super-secret-session-key
CSRF_SECRET=your-super-secret-csrf-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Variables
```bash
# Cookie Configuration
COOKIE_SECURE=true
COOKIE_DOMAIN=yourdomain.com

# Application URLs
FRONTEND_URL=https://yourapp.com
DASHBOARD_URL=https://dashboard.yourapp.com
API_URL=https://api.yourapp.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## 🚀 Deployment Considerations

### Production Environment
1. Set `COOKIE_SECURE=true` for HTTPS
2. Use strong, randomly generated secrets
3. Configure proper domain names
4. Enable all security features
5. Set up Redis for session storage
6. Configure proper CORS origins

### Security Best Practices
1. Rotate secrets regularly
2. Monitor authentication logs
3. Implement account lockout policies
4. Use HTTPS in production
5. Enable security headers
6. Configure proper rate limiting

## 🔍 Monitoring & Maintenance

### Session Cleanup
- Automatic session cleanup every hour
- Token cleanup every 24 hours
- Configurable batch sizes
- Audit logging for security events

### Audit Events
- Login/logout attempts
- Token refresh operations
- Password changes
- Account lockouts
- Security violations

## 📚 Integration Examples

### Frontend Integration
```javascript
// JWT Authentication
const login = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Google OAuth
const googleLogin = () => {
  window.location.href = '/api/auth/google';
};
```

### Backend Middleware
```javascript
// JWT Verification Middleware
const verifyJWT = (req, res, next) => {
  const token = req.cookies.citadel_access_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};
```

## 🎯 Next Steps

1. **Run Setup**: `bun run auth:setup`
2. **Configure Google OAuth**: `bun run auth:google`
3. **Test Configuration**: `bun run auth:test`
4. **Deploy with Production Settings**: Update environment variables
5. **Monitor Authentication**: Check logs and audit trails

Your Citadel platform now has enterprise-grade authentication with JWT cookies and Google OAuth session management! 🚀
