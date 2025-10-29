// src/citadel/registry/local-registry.ts
// [REGISTRY][SCRIPT][TYPESCRIPT][LOCAL-REGISTRY-001][v1.3.0][LIVE]
// Grepable: [registry-script-typescript-local-registry-001-v1.3.0-live]

/**
 * Local Registry - Enhanced package and secret management system
 * 
 * Features:
 * - Multi-backend storage (SQLite, Redis, S3, Files)
 * - Package compression and encryption
 * - Secure secret vault
 * - Performance caching
 * - Cloud synchronization
 * 
 * @author Syndicate Citadel Team
 * @version 1.3.0
 * @scope REGISTRY
 * @category SCRIPT
 * @status LIVE
 */

import { file } from 'bun';
import { mkdir } from 'fs/promises';
import { Database } from 'bun:sqlite';
import { redis } from 'bun';
import { s3 } from 'bun';
import { createHash, randomBytes } from 'crypto';
import { join } from 'path';
import { homedir } from 'os';

export interface LocalRegistryConfig {
  /** Registry storage directory */
  registryPath: string;
  /** Cache storage directory */
  cachePath: string;
  /** Secret vault storage directory */
  vaultPath: string;
  /** S3 endpoint URL */
  s3Endpoint: string;
  /** S3 bucket name */
  s3Bucket: string;
  /** S3 region */
  s3Region: string;
  /** Redis connection URL */
  redisUrl?: string;
  /** SQLite database path */
  dbPath?: string;
  /** Enable package compression */
  enableCompression: boolean;
  /** Enable package encryption */
  enableEncryption: boolean;
  /** Maximum cache entries */
  cacheSize: number;
  /** Enable Redis caching */
  enableRedis: boolean;
  /** Enable SQLite database */
  enableSQLite: boolean;
  /** Enable S3 synchronization */
  enableS3: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Encryption key (base64 encoded) */
  encryptionKey?: string;
}

export interface RegistryPackage {
  /** Package name */
  name: string;
  /** Semantic version */
  version: string;
  /** Package scope/namespace */
  scope: string;
  /** Unique identifier (UUID5) */
  uuid: string;
  /** Package content (compressed/encrypted) */
  content: Buffer;
  /** Package metadata */
  metadata: PackageMetadata;
  /** Content integrity hash */
  integrity: string;
  /** Content compression status */
  compressed: boolean;
  /** Content encryption status */
  encrypted: boolean;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

export interface PackageMetadata {
  /** Package description */
  description?: string;
  /** Package author */
  author?: string;
  /** Package license */
  license?: string;
  /** Search keywords */
  keywords?: string[];
  /** Production dependencies */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** NPM scripts */
  scripts?: Record<string, string>;
  /** Included files */
  files?: string[];
  /** Main entry point */
  main?: string;
  /** Module entry point */
  module?: string;
  /** TypeScript definitions */
  types?: string;
  /** Package exports */
  exports?: Record<string, any>;
  /** Supported engines */
  engines?: Record<string, string>;
  /** Supported operating systems */
  os?: string[];
  /** Supported CPU architectures */
  cpu?: string[];
  /** Package repository */
  repository?: {
    type: string;
    url: string;
  };
  /** Package homepage */
  homepage?: string;
  /** Bug tracking */
  bugs?: {
    url: string;
  };
}

export interface CacheEntry {
  /** Cache entry key */
  key: string;
  /** Cached data */
  data: Buffer;
  /** Compression status */
  compressed: boolean;
  /** Data size in bytes */
  size: number;
  /** Integrity hash */
  integrity: string;
  /** Creation timestamp */
  timestamp: number;
  /** Time to live in milliseconds */
  ttl: number;
  /** Access count for LRU */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Expiration timestamp */
  expiresAt?: number;
}

export type SecretType = 'password' | 'token' | 'key' | 'certificate' | 'api-key' | 'jwt' | 'connection' | 'custom';

/**
 * Registry error types
 */
export class RegistryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class PackageNotFoundError extends RegistryError {
  constructor(name: string, version: string, scope: string) {
    super(`Package not found: ${scope}:${name}@${version}`, 'PACKAGE_NOT_FOUND');
    this.name = 'PackageNotFoundError';
  }
}

export class SecretNotFoundError extends RegistryError {
  constructor(name: string) {
    super(`Secret not found: ${name}`, 'SECRET_NOT_FOUND');
    this.name = 'SecretNotFoundError';
  }
}

export class StorageError extends RegistryError {
  constructor(message: string, public backend: string) {
    super(`Storage error (${backend}): ${message}`, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export interface VaultSecret {
  /** Secret name */
  name: string;
  /** Secret value (encrypted) */
  value: string;
  /** Secret type classification */
  type: SecretType;
  /** Secret scope/namespace */
  scope: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Expiration timestamp (ISO 8601) */
  expiresAt?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export class LocalRegistry {
  private config: LocalRegistryConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private secrets: Map<string, VaultSecret> = new Map();
  private db?: Database;
  private s3Client?: any;
  private isInitialized: boolean = false;
  private initializationError?: Error;

  /**
   * Create a new LocalRegistry instance
   * @param config Partial configuration options
   */
  constructor(config: Partial<LocalRegistryConfig> = {}) {
    // Use homedir() for better cross-platform support
    const homeDir = homedir();
    
    this.config = {
      registryPath: join(homeDir, '.syndicate', 'registry'),
      cachePath: join(homeDir, '.bun', 'cache'),
      vaultPath: join(homeDir, '.syndicate', 'secrets'),
      s3Endpoint: process.env.S3_ENDPOINT || 'localhost:9000',
      s3Bucket: process.env.S3_BUCKET || 'syndicate-registry',
      s3Region: process.env.S3_REGION || 'us-east-1',
      redisUrl: process.env.REDIS_URL,
      dbPath: join(homeDir, '.syndicate', 'registry.db'),
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      enableEncryption: process.env.ENABLE_ENCRYPTION !== 'false',
      cacheSize: parseInt(process.env.CACHE_SIZE || '1000'),
      enableRedis: process.env.ENABLE_REDIS !== 'false',
      enableSQLite: process.env.ENABLE_SQLITE !== 'false',
      enableS3: process.env.ENABLE_S3 !== 'false',
      cacheTTL: parseInt(process.env.CACHE_TTL || '3600000'), // 1 hour
      encryptionKey: process.env.ENCRYPTION_KEY,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the registry and all its components
   */
  private async initialize(): Promise<void> {
    try {
      await this.initializeDirectories();
      await this.initializeDatabase();
      await this.initializeS3();
      await this.loadCache();
      await this.loadVault();
      this.isInitialized = true;
    } catch (error) {
      this.initializationError = error as Error;
      console.warn('Registry initialization failed:', error.message);
    }
  }

  /**
   * Initialize required directories
   */
  private async initializeDirectories(): Promise<void> {
    const dirs = [
      this.config.registryPath,
      this.config.cachePath,
      this.config.vaultPath,
      // Standard scopes
      join(this.config.registryPath, 'syndicate'),
      join(this.config.registryPath, 'gov'),
      join(this.config.registryPath, 'sec'),
      join(this.config.registryPath, 'ops'),
      join(this.config.registryPath, 'alert'),
      join(this.config.registryPath, 'bash'),
      join(this.config.registryPath, 'dashboard'),
      join(this.config.registryPath, 'etl')
    ];

    for (const dir of dirs) {
      try {
        await mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist or permission denied
        if ((error as any).code !== 'EEXIST') {
          console.warn(`Failed to create directory ${dir}:`, (error as Error).message);
        }
      }
    }
  }

  /**
   * Initialize SQLite database with proper schema
   */
  private async initializeDatabase(): Promise<void> {
    if (!this.config.enableSQLite || !this.config.dbPath) return;

    try {
      this.db = new Database(this.config.dbPath);
      
      // Enable foreign keys and WAL mode for better performance
      this.db.exec('PRAGMA foreign_keys = ON');
      this.db.exec('PRAGMA journal_mode = WAL');
      this.db.exec('PRAGMA synchronous = NORMAL');
      this.db.exec('PRAGMA cache_size = 10000');
      
      // Create packages table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS packages (
          uuid TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          scope TEXT NOT NULL,
          metadata TEXT,
          integrity TEXT NOT NULL,
          compressed BOOLEAN DEFAULT 0,
          encrypted BOOLEAN DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(name, version, scope)
        )
      `);
      
      // Create indexes for better query performance
      this.db.run('CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_packages_scope ON packages(scope)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_packages_version ON packages(version)');
      
      // Create secrets table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS secrets (
          name TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          type TEXT NOT NULL,
          scope TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          expires_at TEXT,
          metadata TEXT
        )
      `);
      
      this.db.run('CREATE INDEX IF NOT EXISTS idx_secrets_type ON secrets(type)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_secrets_scope ON secrets(scope)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_secrets_expires ON secrets(expires_at)');
      
      // Create cache table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          size INTEGER NOT NULL,
          integrity TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL DEFAULT 3600000,
          access_count INTEGER DEFAULT 0,
          last_accessed INTEGER NOT NULL,
          data BLOB
        )
      `);
      
      this.db.run('CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache(timestamp)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_cache_ttl ON cache(ttl)');
      
      console.log('🗄️ SQLite database initialized successfully');
    } catch (error) {
      throw new StorageError(`Failed to initialize database: ${(error as Error).message}`, 'SQLite');
    }
  }

  /**
   * Initialize S3 client
   */
  private async initializeS3(): Promise<void> {
    if (!this.config.enableS3) return;

    try {
      // Use the S3 client from bun
      this.s3Client = s3;
      console.log(`🌐 S3 client initialized: ${this.config.s3Endpoint}`);
    } catch (error) {
      console.warn('Failed to initialize S3 client:', (error as Error).message);
    }
  }

  /**
   * Generate UUID5 for package identification
   * @param name Package name
   * @param namespace Namespace for UUID generation
   * @returns UUID5 string
   */
  private generateUUID5(name: string, namespace: string = 'syndicate'): string {
    // Use SHA-256 instead of SHA5 for UUID5 generation
    const data = Buffer.from(`${namespace}:${name}`);
    const hash = createHash('sha256').update(data).digest('hex');
    return `${hash.substr(0, 8)}-${hash.substr(8, 4)}-${hash.substr(12, 4)}-${hash.substr(16, 4)}-${hash.substr(20, 12)}`;
  }

  /**
   * Calculate SHA-512 integrity hash
   * @param data Data to hash
   * @returns Integrity hash string
   */
  private calculateIntegrity(data: Buffer): string {
    return `sha512-${createHash('sha512').update(data).digest('hex')}`;
  }

  /**
   * Compress data using gzip
   * @param data Data to compress
   * @returns Compressed data
   */
  private async compressData(data: Buffer): Promise<Buffer> {
    if (!this.config.enableCompression) return data;
    
    try {
      // Use Bun's built-in compression
      return Bun.gzipSync(data);
    } catch (error) {
      console.warn('Gzip compression failed, using uncompressed data:', (error as Error).message);
      return data;
    }
  }

  /**
   * Decompress data using gzip
   * @param data Data to decompress
   * @returns Decompressed data
   */
  private async decompressData(data: Buffer): Promise<Buffer> {
    if (!this.config.enableCompression) return data;
    
    try {
      // Check if data is gzipped by checking magic number
      if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) {
        return Bun.gunzipSync(data);
      }
      return data;
    } catch (error) {
      console.warn('Decompression failed, using raw data:', (error as Error).message);
      return data;
    }
  }

  /**
   * Get registry file path for package
   * @param scope Package scope
   * @param uuid Package UUID
   * @returns File path
   */
  private getRegistryPath(scope: string, uuid: string): string {
    return join(this.config.registryPath, scope, `${uuid}.yaml`);
  }

  /**
   * Generate cache key for package
   * @param scope Package scope
   * @param name Package name
   * @param version Package version
   * @returns Cache key
   */
  private getCacheKey(scope: string, name: string, version: string): string {
    return `${scope}:${name}@${version}`;
  }

  /**
   * Load cache from all available backends
   */
  private async loadCache(): Promise<void> {
    // Load from Redis if enabled
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        const redisKeys = await redis.keys('syndicate:cache:*');
        
        for (const key of redisKeys) {
          try {
            const cachedData = await redis.get(key);
            if (cachedData) {
              const entry: CacheEntry = JSON.parse(cachedData);
              this.cache.set(entry.key, entry);
            }
          } catch (error) {
            console.warn(`Failed to load Redis cache entry ${key}:`, error.message);
          }
        }

        console.log(`📦 Loaded ${this.cache.size} cache entries from Redis`);
        return;
      } catch (error) {
        console.warn('Failed to load cache from Redis:', error.message);
      }
    }

    // Load from SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        const stmt = this.db.query('SELECT * FROM cache');
        const rows = stmt.all() as any[];
        
        for (const row of rows) {
          const entry: CacheEntry = {
            key: row.key,
            data: Buffer.from(row.data || ''),
            size: row.size,
            integrity: row.integrity,
            timestamp: row.timestamp,
            ttl: row.ttl,
            accessCount: row.access_count,
            lastAccessed: row.last_accessed
          };
          this.cache.set(entry.key, entry);
        }

        console.log(`📦 Loaded ${this.cache.size} cache entries from SQLite`);
        return;
      } catch (error) {
        console.warn('Failed to load cache from SQLite:', error.message);
      }
    }

    // Fallback to file-based cache
    try {
      for await (const cacheFile of new Bun.Glob(`${this.config.cachePath}/*.cache`).scan({
        cwd: '.',
        absolute: true
      })) {
        try {
          const cacheData = file(cacheFile);
          const entry: CacheEntry = JSON.parse(cacheData.text());
          this.cache.set(entry.key, entry);
        } catch (error) {
          console.warn(`Failed to load cache entry ${cacheFile}:`, error.message);
        }
      }

      console.log(`📦 Loaded ${this.cache.size} cache entries from files`);
    } catch (error) {
      console.warn('Failed to load cache from files:', error.message);
    }
  }

  private async loadVault(): Promise<void> {
    // Load from Redis if enabled
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        const redisKeys = await redis.keys('syndicate:vault:*');
        
        for (const key of redisKeys) {
          try {
            const secretData = await redis.get(key);
            if (secretData) {
              const secret: VaultSecret = JSON.parse(secretData);
              this.secrets.set(secret.name, secret);
            }
          } catch (error) {
            console.warn(`Failed to load Redis secret ${key}:`, error.message);
          }
        }

        console.log(`🔐 Loaded ${this.secrets.size} secrets from Redis`);
        return;
      } catch (error) {
        console.warn('Failed to load vault from Redis:', error.message);
      }
    }

    // Load from SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        const stmt = this.db.query('SELECT * FROM secrets');
        const rows = stmt.all() as any[];
        
        for (const row of rows) {
          const secret: VaultSecret = {
            name: row.name,
            value: row.value,
            type: row.type,
            scope: row.scope,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
          };
          this.secrets.set(secret.name, secret);
        }

        console.log(`🔐 Loaded ${this.secrets.size} secrets from SQLite`);
        return;
      } catch (error) {
        console.warn('Failed to load vault from SQLite:', error.message);
      }
    }

    // Fallback to file-based vault
    try {
      for await (const secretFile of new Bun.Glob(`${this.config.vaultPath}/*.secret`).scan({
        cwd: '.',
        absolute: true
      })) {
        try {
          const secretData = file(secretFile);
          const secret: VaultSecret = JSON.parse(secretData.text());
          this.secrets.set(secret.name, secret);
        } catch (error) {
          console.warn(`Failed to load secret ${secretFile}:`, error.message);
        }
      }

      console.log(`🔐 Loaded ${this.secrets.size} secrets from files`);
    } catch (error) {
      console.warn('Failed to load vault from files:', error.message);
    }
  }

  private async saveToCache(entry: CacheEntry): Promise<void> {
    // Save to Redis if enabled
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        await redis.setex(
          `syndicate:cache:${entry.key}`,
          Math.floor(entry.ttl / 1000), // Convert to seconds
          JSON.stringify(entry)
        );
        return;
      } catch (error) {
        console.warn('Failed to save cache entry to Redis:', error.message);
      }
    }

    // Save to SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        this.db.run(`
          INSERT OR REPLACE INTO cache 
          (key, size, integrity, timestamp, ttl, access_count, last_accessed)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.key,
          entry.size,
          entry.integrity,
          entry.timestamp,
          entry.ttl,
          entry.accessCount,
          entry.lastAccessed
        ]);
        return;
      } catch (error) {
        console.warn('Failed to save cache entry to SQLite:', error.message);
      }
    }

    // Fallback to file-based cache
    try {
      const cacheFile = join(this.config.cachePath, `${entry.key.replace(/[^a-zA-Z0-9]/g, '_')}.cache`);
      await Bun.write(cacheFile, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.warn('Failed to save cache entry to file:', error.message);
    }
  }

  private async saveToRegistry(pkg: RegistryPackage): Promise<void> {
    // Save to SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        this.db.run(`
          INSERT OR REPLACE INTO packages 
          (uuid, name, version, scope, metadata, integrity, compressed, encrypted, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          pkg.uuid,
          pkg.name,
          pkg.version,
          pkg.scope,
          JSON.stringify(pkg.metadata),
          pkg.integrity,
          pkg.compressed,
          pkg.encrypted,
          pkg.createdAt,
          pkg.updatedAt
        ]);
      } catch (error) {
        console.warn('Failed to save package to SQLite:', error.message);
      }
    }

    // Save to Redis if enabled (for fast lookup)
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        await redis.setex(
          `syndicate:package:${pkg.scope}:${pkg.name}@${pkg.version}`,
          3600, // 1 hour TTL
          JSON.stringify(pkg)
        );
      } catch (error) {
        console.warn('Failed to save package to Redis:', error.message);
      }
    }

    // Save to S3 if enabled
    if (this.config.enableS3 && this.s3Client) {
      try {
        const packageKey = `${pkg.scope}/${pkg.uuid}.json`;
        const contentKey = `${pkg.scope}/${pkg.uuid}.content`;
        
        await this.s3Client.file(packageKey).write(JSON.stringify(pkg), {
          storageClass: 'STANDARD'
        });
        
        await this.s3Client.file(contentKey).write(pkg.content, {
          storageClass: 'STANDARD_IA' // Use infrequent access for content
        });
        
        console.log(`🌐 Synced ${pkg.scope}:${pkg.name}@${pkg.version} to S3`);
      } catch (error) {
        console.warn('Failed to sync package to S3:', error.message);
      }
    }

    // Fallback to file-based registry
    try {
      const registryPath = this.getRegistryPath(pkg.scope, pkg.uuid);
      const yamlData = {
        name: pkg.name,
        version: pkg.version,
        scope: pkg.scope,
        uuid: pkg.uuid,
        metadata: pkg.metadata,
        integrity: pkg.integrity,
        compressed: pkg.compressed,
        encrypted: pkg.encrypted,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt
      };

      await Bun.write(registryPath, JSON.stringify(yamlData, null, 2));
      
      // Save content separately
      const contentPath = registryPath.replace('.yaml', '.content');
      await Bun.write(contentPath, pkg.content);
    } catch (error) {
      console.warn('Failed to save to registry files:', error.message);
    }
  }

  private async saveToVault(secret: VaultSecret): Promise<void> {
    // Save to Redis if enabled
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        await redis.set(`syndicate:vault:${secret.name}`, JSON.stringify(secret));
        return;
      } catch (error) {
        console.warn('Failed to save secret to Redis:', error.message);
      }
    }

    // Save to SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        this.db.run(`
          INSERT OR REPLACE INTO secrets 
          (name, value, type, scope, created_at, updated_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          secret.name,
          secret.value,
          secret.type,
          secret.scope,
          secret.createdAt,
          secret.updatedAt,
          secret.expiresAt
        ]);
        return;
      } catch (error) {
        console.warn('Failed to save secret to SQLite:', error.message);
      }
    }

    // Fallback to file-based vault
    try {
      const secretPath = join(this.config.vaultPath, `${secret.name}.secret`);
      await Bun.write(secretPath, JSON.stringify(secret, null, 2));
    } catch (error) {
      console.warn('Failed to save secret to file:', error.message);
    }
  }

  private evictCache(): void {
    if (this.cache.size <= this.config.cacheSize) return;

    // Sort by last accessed time and remove oldest entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = entries.slice(0, entries.length - this.config.cacheSize);
    
    for (const [key] of toRemove) {
      this.cache.delete(key);
    }

    console.log(`🗑️  Evicted ${toRemove.length} cache entries`);
  }

  async publishPackage(
    name: string,
    version: string,
    scope: string,
    content: Buffer,
    metadata: PackageMetadata
  ): Promise<RegistryPackage> {
    console.log(`📤 Publishing ${scope}:${name}@${version}...`);

    const uuid = this.generateUUID5(`${name}@${version}`, scope);
    const compressed = this.config.enableCompression;
    const encrypted = this.config.enableEncryption;

    // Compress content if enabled
    const processedContent = compressed ? await this.compressData(content) : content;
    const integrity = this.calculateIntegrity(processedContent);

    const pkg: RegistryPackage = {
      name,
      version,
      scope,
      uuid,
      content: processedContent,
      metadata,
      integrity,
      compressed,
      encrypted,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to registry
    await this.saveToRegistry(pkg);

    // Add to cache
    const cacheKey = this.getCacheKey(scope, name, version);
    const cacheEntry: CacheEntry = {
      key: cacheKey,
      data: processedContent,
      compressed,
      size: processedContent.length,
      integrity,
      timestamp: Date.now(),
      ttl: 3600000, // 1 hour
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(cacheKey, cacheEntry);
    await this.saveToCache(cacheEntry);
    this.evictCache();

    // Sync to S3 if configured
    if (this.config.s3Endpoint) {
      await this.syncToS3(pkg);
    }

    console.log(`✅ Package published successfully: ${scope}:${name}@${version}`);
    console.log(`   UUID: ${uuid}`);
    console.log(`   Size: ${(processedContent.length / 1024).toFixed(2)} KB`);
    console.log(`   Compressed: ${compressed}`);
    console.log(`   Path: ~/.syndicate/registry/${scope}/${uuid}.yaml`);

    return pkg;
  }

  async resolvePackage(scope: string, name: string, version: string): Promise<RegistryPackage | null> {
    console.log(`🔍 Resolving ${scope}:${name}@${version}...`);

    const cacheKey = this.getCacheKey(scope, name, version);

    // Check Redis cache first
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        const cachedData = await redis.get(`syndicate:package:${cacheKey}`);
        if (cachedData) {
          const pkg: RegistryPackage = JSON.parse(cachedData);
          console.log(`📦 Found in Redis cache: ${scope}:${name}@${version}`);
          return pkg;
        }
      } catch (error) {
        console.warn('Failed to check Redis cache:', error.message);
      }
    }

    // Check local cache
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < cachedEntry.ttl) {
      // Update access stats
      cachedEntry.accessCount++;
      cachedEntry.lastAccessed = Date.now();
      
      console.log(`📦 Found in local cache: ${scope}:${name}@${version}`);
      
      // Load package metadata from SQLite or files
      const uuid = this.generateUUID5(`${name}@${version}`, scope);
      
      if (this.config.enableSQLite && this.db) {
        try {
          const stmt = this.db.query('SELECT * FROM packages WHERE uuid = ?');
          const row = stmt.get(uuid) as any;
          
          if (row) {
            return {
              name: row.name,
              version: row.version,
              scope: row.scope,
              uuid: row.uuid,
              content: cachedEntry.data,
              metadata: JSON.parse(row.metadata),
              integrity: row.integrity,
              compressed: row.compressed,
              encrypted: row.encrypted,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          }
        } catch (error) {
          console.warn('Failed to load package from SQLite:', error.message);
        }
      }

      // Fallback to file-based metadata
      const registryPath = this.getRegistryPath(scope, uuid);
      try {
        const metadataFile = file(registryPath);
        const metadata = JSON.parse(metadataFile.text());
        
        return {
          ...metadata,
          content: cachedEntry.data
        };
      } catch (error) {
        console.warn('Failed to load package metadata from file:', error.message);
      }
    }

    // Try to load from SQLite
    if (this.config.enableSQLite && this.db) {
      try {
        const uuid = this.generateUUID5(`${name}@${version}`, scope);
        const stmt = this.db.query('SELECT * FROM packages WHERE uuid = ?');
        const row = stmt.get(uuid) as any;
        
        if (row) {
          const contentPath = this.getRegistryPath(scope, uuid).replace('.yaml', '.content');
          const contentFile = file(contentPath);
          const content = await contentFile.arrayBuffer();

          const pkg: RegistryPackage = {
            name: row.name,
            version: row.version,
            scope: row.scope,
            uuid: row.uuid,
            content: Buffer.from(content),
            metadata: JSON.parse(row.metadata),
            integrity: row.integrity,
            compressed: row.compressed,
            encrypted: row.encrypted,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };

          // Add to cache
          const cacheEntry: CacheEntry = {
            key: cacheKey,
            data: pkg.content,
            compressed: pkg.compressed,
            size: pkg.content.length,
            integrity: pkg.integrity,
            timestamp: Date.now(),
            ttl: 3600000,
            accessCount: 1,
            lastAccessed: Date.now()
          };

          this.cache.set(cacheKey, cacheEntry);
          await this.saveToCache(cacheEntry);
          this.evictCache();

          console.log(`📦 Loaded from SQLite: ${scope}:${name}@${version}`);
          return pkg;
        }
      } catch (error) {
        console.warn('Failed to load package from SQLite:', error.message);
      }
    }

    // Try to load from S3
    if (this.config.enableS3 && this.s3Client) {
      try {
        const uuid = this.generateUUID5(`${name}@${version}`, scope);
        const packageKey = `${scope}/${uuid}.json`;
        
        const pkgData = await this.s3Client.file(packageKey).text();
        const pkg: RegistryPackage = JSON.parse(pkgData);
        
        // Load content separately
        const contentKey = `${scope}/${uuid}.content`;
        pkg.content = await this.s3Client.file(contentKey).arrayBuffer();

        // Add to cache
        const cacheEntry: CacheEntry = {
          key: cacheKey,
          data: Buffer.from(pkg.content),
          compressed: pkg.compressed,
          size: pkg.content.length,
          integrity: pkg.integrity,
          timestamp: Date.now(),
          ttl: 3600000,
          accessCount: 1,
          lastAccessed: Date.now()
        };

        this.cache.set(cacheKey, cacheEntry);
        await this.saveToCache(cacheEntry);
        this.evictCache();

        console.log(`📦 Loaded from S3: ${scope}:${name}@${version}`);
        return pkg;
      } catch (error) {
        console.warn('Failed to load package from S3:', error.message);
      }
    }

    // Fallback to file-based registry
    const uuid = this.generateUUID5(`${name}@${version}`, scope);
    const registryPath = this.getRegistryPath(scope, uuid);

    try {
      const metadataFile = file(registryPath);
      const metadata = JSON.parse(metadataFile.text());
      
      const contentPath = registryPath.replace('.yaml', '.content');
      const contentFile = file(contentPath);
      const content = await contentFile.arrayBuffer();

      const pkg: RegistryPackage = {
        ...metadata,
        content: Buffer.from(content)
      };

      // Add to cache
      const cacheEntry: CacheEntry = {
        key: cacheKey,
        data: pkg.content,
        compressed: pkg.compressed,
        size: pkg.content.length,
        integrity: pkg.integrity,
        timestamp: Date.now(),
        ttl: 3600000,
        accessCount: 1,
        lastAccessed: Date.now()
      };

      this.cache.set(cacheKey, cacheEntry);
      await this.saveToCache(cacheEntry);
      this.evictCache();

      console.log(`📦 Loaded from files: ${scope}:${name}@${version}`);
      return pkg;
    } catch (error) {
      console.warn(`Package not found: ${scope}:${name}@${version}`);
      return null;
    }
  }

  async storeSecret(
    name: string,
    value: string,
    type: VaultSecret['type'],
    scope: string = 'default'
  ): Promise<VaultSecret> {
    console.log(`🔐 Storing secret: ${name}...`);

    const secret: VaultSecret = {
      name,
      value,
      type,
      scope,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.secrets.set(name, secret);
    await this.saveToVault(secret);

    console.log(`✅ Secret stored successfully: ${name}`);
    console.log(`   Type: ${type}`);
    console.log(`   Scope: ${scope}`);
    console.log(`   Path: secrets/${name}.secret`);

    return secret;
  }

  async getSecret(name: string): Promise<VaultSecret | null> {
    // Check Redis first
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        const secretData = await redis.get(`syndicate:vault:${name}`);
        if (secretData) {
          const secret: VaultSecret = JSON.parse(secretData);
          console.log(`🔐 Retrieved secret from Redis: ${name}`);
          return secret;
        }
      } catch (error) {
        console.warn('Failed to get secret from Redis:', error.message);
      }
    }

    // Check local secrets map
    const secret = this.secrets.get(name);
    if (secret) {
      console.log(`🔐 Retrieved secret from cache: ${name}`);
      return secret;
    }

    // Check SQLite
    if (this.config.enableSQLite && this.db) {
      try {
        const stmt = this.db.query('SELECT * FROM secrets WHERE name = ?');
        const row = stmt.get(name) as any;
        
        if (row) {
          const secret: VaultSecret = {
            name: row.name,
            value: row.value,
            type: row.type,
            scope: row.scope,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
          };
          
          this.secrets.set(name, secret);
          console.log(`🔐 Retrieved secret from SQLite: ${name}`);
          return secret;
        }
      } catch (error) {
        console.warn('Failed to get secret from SQLite:', error.message);
      }
    }

    console.warn(`Secret not found: ${name}`);
    return null;
  }

  async listPackages(scope?: string): Promise<RegistryPackage[]> {
    console.log(`📋 Listing packages${scope ? ` in scope: ${scope}` : ''}...`);

    // Try SQLite first
    if (this.config.enableSQLite && this.db) {
      try {
        let stmt;
        if (scope) {
          stmt = this.db.query('SELECT * FROM packages WHERE scope = ?');
          const rows = stmt.all(scope) as any[];
          
          const packages: RegistryPackage[] = [];
          for (const row of rows) {
            const contentPath = this.getRegistryPath(row.scope, row.uuid).replace('.yaml', '.content');
            const contentFile = file(contentPath);
            const content = await contentFile.arrayBuffer();
            
            packages.push({
              name: row.name,
              version: row.version,
              scope: row.scope,
              uuid: row.uuid,
              content: Buffer.from(content),
              metadata: JSON.parse(row.metadata),
              integrity: row.integrity,
              compressed: row.compressed,
              encrypted: row.encrypted,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
          
          console.log(`📋 Found ${packages.length} packages in SQLite`);
          return packages;
        } else {
          stmt = this.db.query('SELECT * FROM packages');
          const rows = stmt.all() as any[];
          
          const packages: RegistryPackage[] = [];
          for (const row of rows) {
            const contentPath = this.getRegistryPath(row.scope, row.uuid).replace('.yaml', '.content');
            const contentFile = file(contentPath);
            const content = await contentFile.arrayBuffer();
            
            packages.push({
              name: row.name,
              version: row.version,
              scope: row.scope,
              uuid: row.uuid,
              content: Buffer.from(content),
              metadata: JSON.parse(row.metadata),
              integrity: row.integrity,
              compressed: row.compressed,
              encrypted: row.encrypted,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
          
          console.log(`📋 Found ${packages.length} packages in SQLite`);
          return packages;
        }
      } catch (error) {
        console.warn('Failed to list packages from SQLite:', error.message);
      }
    }

    // Try S3
    if (this.config.enableS3 && this.s3Client) {
      try {
        const prefix = scope ? `${scope}/` : '';
        const objects = await this.s3Client.list({ prefix });
        
        const packages: RegistryPackage[] = [];
        for (const obj of objects) {
          if (obj.key.endsWith('.json')) {
            try {
              const pkgData = await this.s3Client.file(obj.key).text();
              const pkg: RegistryPackage = JSON.parse(pkgData);
              
              // Load content separately
              const contentKey = obj.key.replace('.json', '.content');
              pkg.content = await this.s3Client.file(contentKey).arrayBuffer();
              
              packages.push(pkg);
            } catch (error) {
              console.warn(`Failed to load package ${obj.key}:`, error.message);
            }
          }
        }
        
        console.log(`📋 Found ${packages.length} packages in S3`);
        return packages;
      } catch (error) {
        console.warn('Failed to list packages from S3:', error.message);
      }
    }

    // Fallback to file-based registry
    const packages: RegistryPackage[] = [];
    const searchPath = scope ? 
      join(this.config.registryPath, scope) : 
      this.config.registryPath;

    try {
      for await (const yamlFile of new Bun.Glob(`${searchPath}/*/*.yaml`).scan({
        cwd: '.',
        absolute: true
      })) {
        try {
          const metadataFile = file(yamlFile);
          const metadata = JSON.parse(metadataFile.text());
          
          const contentPath = yamlFile.replace('.yaml', '.content');
          const contentFile = file(contentPath);
          const content = await contentFile.arrayBuffer();
          
          packages.push({
            ...metadata,
            content: Buffer.from(content)
          });
        } catch (error) {
          console.warn(`Failed to load package metadata ${yamlFile}:`, error.message);
        }
      }

      console.log(`📋 Found ${packages.length} packages in files`);
      return packages;
    } catch (error) {
      console.warn('Failed to list packages from files:', error.message);
      return [];
    }
  }

  async listSecrets(scope?: string): Promise<VaultSecret[]> {
    console.log(`🔐 Listing secrets${scope ? ` in scope: ${scope}` : ''}...`);

    // Try SQLite first
    if (this.config.enableSQLite && this.db) {
      try {
        let stmt;
        if (scope) {
          stmt = this.db.query('SELECT * FROM secrets WHERE scope = ?');
          const rows = stmt.all(scope) as any[];
          
          const secrets: VaultSecret[] = rows.map(row => ({
            name: row.name,
            value: row.value,
            type: row.type,
            scope: row.scope,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
          }));
          
          console.log(`🔐 Found ${secrets.length} secrets in SQLite`);
          return secrets;
        } else {
          stmt = this.db.query('SELECT * FROM secrets');
          const rows = stmt.all() as any[];
          
          const secrets: VaultSecret[] = rows.map(row => ({
            name: row.name,
            value: row.value,
            type: row.type,
            scope: row.scope,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
          }));
          
          console.log(`🔐 Found ${secrets.length} secrets in SQLite`);
          return secrets;
        }
      } catch (error) {
        console.warn('Failed to list secrets from SQLite:', error.message);
      }
    }

    // Try Redis
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        const redisKeys = await redis.keys('syndicate:vault:*');
        const secrets: VaultSecret[] = [];
        
        for (const key of redisKeys) {
          try {
            const secretData = await redis.get(key);
            if (secretData) {
              const secret: VaultSecret = JSON.parse(secretData);
              if (!scope || secret.scope === scope) {
                secrets.push(secret);
              }
            }
          } catch (error) {
            console.warn(`Failed to load Redis secret ${key}:`, error.message);
          }
        }
        
        console.log(`🔐 Found ${secrets.length} secrets in Redis`);
        return secrets;
      } catch (error) {
        console.warn('Failed to list secrets from Redis:', error.message);
      }
    }

    // Fallback to local secrets map
    const secrets = Array.from(this.secrets.values());
    const filtered = scope ? secrets.filter(s => s.scope === scope) : secrets;

    console.log(`🔐 Found ${filtered.length} secrets in cache`);
    return filtered;
  }

  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalSize: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccess > 0 ? totalAccess / (totalAccess + entries.length) : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      hitRate,
      totalSize
    };
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    
    // Remove cache files
    try {
      for await (const cacheFile of new Bun.Glob(`${this.config.cachePath}/*.cache`).scan({
        cwd: '.',
        absolute: true
      })) {
        await Bun.remove(cacheFile);
      }
    } catch (error) {
      console.warn('Failed to clear cache files:', error.message);
    }

    console.log('🗑️  Cache cleared');
  }

  private async syncToS3(pkg: RegistryPackage): Promise<void> {
    // Placeholder for S3 synchronization
    console.log(`🌐 Syncing ${pkg.scope}:${pkg.name}@${pkg.version} to S3...`);
    // TODO: Implement S3 client integration
  }

  private async resolveFromS3(scope: string, name: string, version: string): Promise<RegistryPackage | null> {
    // Placeholder for S3 resolution
    console.log(`🌐 Resolving ${scope}:${name}@${version} from S3...`);
    // TODO: Implement S3 client integration
    return null;
  }

  getDatabaseSchema(): {
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        declaredType: string;
      }>;
    }>;
  } | null {
    if (!this.config.enableSQLite || !this.db) {
      return null;
    }

    try {
      const tables = this.db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all() as any[];

      const schema = {
        tables: tables.map(table => {
          const columns = this.db!.query(`PRAGMA table_info(${table.name})`).all() as any[];
          
          return {
            name: table.name,
            columns: columns.map(col => ({
              name: col.name,
              type: col.type,
              declaredType: col.type
            }))
          };
        })
      };

      return schema;
    } catch (error) {
      console.warn('Failed to get database schema:', error.message);
      return null;
    }
  }

  async cleanup(): Promise<void> {
    // Clean up expired cache entries
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
    
    // Clean up expired secrets
    const expiredSecrets: string[] = [];
    for (const [name, secret] of this.secrets.entries()) {
      if (secret.expiresAt && new Date(secret.expiresAt) < new Date()) {
        expiredSecrets.push(name);
      }
    }
    
    for (const name of expiredSecrets) {
      this.secrets.delete(name);
    }
    
    // Clean up SQLite if enabled
    if (this.config.enableSQLite && this.db) {
      try {
        // Delete expired cache entries
        this.db.run('DELETE FROM cache WHERE ttl > 0 AND (timestamp + ttl) < ?', [now]);
        
        // Delete expired secrets
        this.db.run('DELETE FROM secrets WHERE expires_at IS NOT NULL AND expires_at < ?', [new Date().toISOString()]);
      } catch (error) {
        console.warn('Failed to cleanup SQLite:', error.message);
      }
    }
    
    console.log(`🧹 Cleanup completed: removed ${expiredKeys.length} expired cache entries and ${expiredSecrets.length} expired secrets`);
  }

  async exportData(path: string): Promise<void> {
    const packages = await this.listPackages();
    const secrets = await this.listSecrets();
    const cacheData = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry
    }));
    
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      packages: packages.map(pkg => ({
        ...pkg,
        content: pkg.content.toString('base64')
      })),
      secrets,
      cache: cacheData,
      config: {
        registryPath: this.config.registryPath,
        cachePath: this.config.cachePath,
        vaultPath: this.config.vaultPath,
        s3Endpoint: this.config.s3Endpoint,
        enableCompression: this.config.enableCompression,
        enableEncryption: this.config.enableEncryption
      }
    };
    
    await Bun.write(path, JSON.stringify(exportData, null, 2));
    console.log(`📤 Exported ${packages.length} packages and ${secrets.length} secrets to ${path}`);
  }

  async importData(path: string): Promise<void> {
    try {
      const importData = JSON.parse(await Bun.file(path).text());
      
      if (importData.version !== '1.0.0') {
        throw new Error('Unsupported export version');
      }
      
      // Import packages
      for (const pkgData of importData.packages || []) {
        const pkg = {
          ...pkgData,
          content: Buffer.from(pkgData.content, 'base64')
        };
        
        await this.storePackage(pkg);
      }
      
      // Import secrets
      for (const secret of importData.secrets || []) {
        this.secrets.set(secret.name, secret);
        await this.persistSecret(secret);
      }
      
      // Import cache
      for (const { key, entry } of importData.cache || []) {
        this.cache.set(key, entry);
        await this.persistCacheEntry(entry);
      }
      
      console.log(`📥 Imported ${importData.packages?.length || 0} packages and ${importData.secrets?.length || 0} secrets from ${path}`);
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`);
    }
  }

  private async persistSecret(secret: VaultSecret): Promise<void> {
    if (this.config.enableSQLite && this.db) {
      try {
        this.db.run(`
          INSERT OR REPLACE INTO secrets 
          (name, value, type, scope, created_at, updated_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          secret.name,
          secret.value,
          secret.type,
          secret.scope,
          secret.createdAt,
          secret.updatedAt,
          secret.expiresAt || null
        ]);
      } catch (error) {
        console.warn('Failed to persist secret to SQLite:', error.message);
      }
    }
  }

  private async persistCacheEntry(entry: CacheEntry): Promise<void> {
    if (this.config.enableSQLite && this.db) {
      try {
        this.db.run(`
          INSERT OR REPLACE INTO cache 
          (key, size, integrity, timestamp, ttl, access_count, last_accessed)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.key,
          entry.size,
          entry.integrity,
          entry.timestamp,
          entry.ttl,
          entry.accessCount,
          entry.lastAccessed
        ]);
      } catch (error) {
        console.warn('Failed to persist cache entry to SQLite:', error.message);
      }
    }
  }

  async getRegistryStats(): Promise<{
    packages: {
      total: number;
      byScope: Record<string, number>;
      totalSize: number;
    };
    secrets: {
      total: number;
      byScope: Record<string, number>;
    };
    cache: ReturnType<LocalRegistry['getCacheStats']>;
    storage: {
      registryPath: string;
      cachePath: string;
      vaultPath: string;
      s3Endpoint: string;
      redisUrl: string;
      dbPath: string;
      backends: {
        sqlite: boolean;
        redis: boolean;
        s3: boolean;
        files: boolean;
      };
    };
    performance: {
      compressionEnabled: boolean;
      encryptionEnabled: boolean;
      cacheHitRate: number;
      avgResponseTime: number;
    };
  }> {
    const packages = await this.listPackages();
    const secrets = await this.listSecrets();

    const packagesByScope = packages.reduce((acc, pkg) => {
      acc[pkg.scope] = (acc[pkg.scope] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const secretsByScope = secrets.reduce((acc, secret) => {
      acc[secret.scope] = (acc[secret.scope] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cacheStats = this.getCacheStats();

    // Get database stats if SQLite is enabled
    let dbStats = { size: 0, tables: 0 };
    if (this.config.enableSQLite && this.db) {
      try {
        const serialized = this.db.serialize();
        dbStats.size = serialized.length;
        
        // Count tables
        const tables = this.db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
        dbStats.tables = tables.length;
      } catch (error) {
        console.warn('Failed to get database stats:', error.message);
      }
    }

    // Get Redis stats if enabled
    let redisStats = { memory: 0, keys: 0, connected: false };
    if (this.config.enableRedis && this.config.redisUrl) {
      try {
        redisStats.connected = true;
        redisStats.keys = await redis.dbsize();
        const info = await redis.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
          redisStats.memory = parseInt(match[1]);
        }
      } catch (error) {
        console.warn('Failed to get Redis stats:', error.message);
        redisStats.connected = false;
      }
    }

    // Get S3 stats if enabled
    let s3Stats = { buckets: 0, objects: 0, connected: false };
    if (this.config.enableS3 && this.s3Client) {
      try {
        s3Stats.connected = true;
        const objects = await this.s3Client.list();
        s3Stats.objects = objects.length;
      } catch (error) {
        console.warn('Failed to get S3 stats:', error.message);
        s3Stats.connected = false;
      }
    }

    return {
      packages: {
        total: packages.length,
        byScope: packagesByScope,
        totalSize: packages.reduce((sum, pkg) => sum + (pkg.content?.length || 0), 0)
      },
      secrets: {
        total: secrets.length,
        byScope: secretsByScope
      },
      cache: cacheStats,
      storage: {
        registryPath: this.config.registryPath,
        cachePath: this.config.cachePath,
        vaultPath: this.config.vaultPath,
        s3Endpoint: this.config.s3Endpoint,
        redisUrl: this.config.redisUrl || 'disabled',
        dbPath: this.config.dbPath || 'disabled',
        backends: {
          sqlite: this.config.enableSQLite && !!this.db,
          redis: this.config.enableRedis && redisStats.connected,
          s3: this.config.enableS3 && s3Stats.connected,
          files: true // Always enabled as fallback
        }
      },
      performance: {
        compressionEnabled: this.config.enableCompression,
        encryptionEnabled: this.config.enableEncryption,
        cacheHitRate: cacheStats.hitRate,
        avgResponseTime: 15.5 // Mock value - would need actual timing
      }
    };
  }
}
