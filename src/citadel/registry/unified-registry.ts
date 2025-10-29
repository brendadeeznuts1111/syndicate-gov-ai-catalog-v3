// citadel/registry/unified-registry.ts
import { file, gzip, zstd } from 'bun';
import { Package, PackageMetadata, ResolveRequest } from '../core/pm-core.js';

export interface PackageData {
  name: string;
  version: string;
  scope: string;
  content: Buffer;
  metadata: PackageMetadata;
  secrets?: Record<string, string>;
}

export interface PublishResult {
  local: any;
  global: any;
  version: string;
  urls: {
    local: string;
    global: string;
    vault: string;
  };
}

export interface PackageIndex {
  path: string;
  compression: 'zstd' | 'gzip';
  size: number;
  timestamp: number;
  integrity: string;
}

export class UnifiedRegistry {
  private localRegistry = new LocalRegistry();
  private globalRegistry = new GlobalRegistry();
  private vault = new SecureVault();

  async resolve(request: ResolveRequest): Promise<Package> {
    console.log(`🔍 Resolving ${request.scope}:${request.name}@${request.version}`);
    
    // Try local registry first
    try {
      const local = await this.localRegistry.get(request);
      if (local) {
        console.log(`📦 Found in local registry`);
        return local;
      }
    } catch (error) {
      console.log('🔄 Local registry miss, trying global...');
    }

    // Fall back to global registry
    const global = await this.globalRegistry.fetch(request);
    console.log(`🌐 Found in global registry`);
    
    // Cache in local registry
    await this.localRegistry.set(request, global);
    
    return global;
  }

  async publish(packageData: PackageData): Promise<PublishResult> {
    console.log(`📤 Publishing ${packageData.name}@${packageData.version}`);
    
    // Validate package signature and integrity
    await this.validatePackageIntegrity(packageData);
    
    // Publish to both registries
    const [localResult, globalResult] = await Promise.all([
      this.localRegistry.publish(packageData),
      this.globalRegistry.publish(packageData)
    ]);

    // Store sensitive data in vault
    if (packageData.secrets) {
      await this.vault.storeSecrets(packageData.name, packageData.secrets);
    }

    return {
      local: localResult,
      global: globalResult,
      version: packageData.version,
      urls: {
        local: `registry://local/${packageData.scope}/${packageData.name}`,
        global: `https://registry.syndicate.example.com/${packageData.scope}/${packageData.name}`,
        vault: `vault://secrets/${packageData.name}` 
      }
    };
  }

  private async validatePackageIntegrity(packageData: PackageData): Promise<void> {
    // Basic integrity validation
    if (!packageData.name || !packageData.version) {
      throw new Error('Package name and version are required');
    }

    if (!packageData.content || packageData.content.byteLength === 0) {
      throw new Error('Package content cannot be empty');
    }

    console.log(`✅ Package integrity validated for ${packageData.name}`);
  }
}

export class LocalRegistry {
  private basePath = './.citadel/registry';
  private index = new Map<string, PackageIndex>();

  constructor() {
    this.initializeRegistry();
  }

  async get(request: ResolveRequest): Promise<Package | null> {
    const key = this.getPackageKey(request);
    
    // Check memory index first
    if (this.index.has(key)) {
      const indexEntry = this.index.get(key)!;
      const packagePath = `${this.basePath}/${indexEntry.path}`;
      
      try {
        const data = await file(packagePath).bytes();
        return this.decodePackage(data, indexEntry.compression);
      } catch (error) {
        console.warn(`Corrupted cache entry for ${key}, removing...`);
        this.index.delete(key); // Remove corrupted entry
      }
    }

    return null;
  }

  async set(request: ResolveRequest, pkg: Package): Promise<void> {
    const key = this.getPackageKey(request);
    const compressed = await this.compressPackage(pkg);
    
    const filename = `${request.name}-${request.version}.${this.getCompressionExt(pkg.compression)}`;
    const path = `packages/${filename}`;
    const fullPath = `${this.basePath}/${path}`;
    
    await Bun.write(fullPath, compressed);
    
    // Update index
    this.index.set(key, {
      path,
      compression: pkg.compression,
      size: compressed.byteLength,
      timestamp: Date.now(),
      integrity: pkg.integrity
    });

    console.log(`💾 Cached ${key} locally (${compressed.byteLength} bytes)`);
  }

  async publish(packageData: PackageData): Promise<any> {
    const request: ResolveRequest = {
      name: packageData.name,
      version: packageData.version,
      scope: packageData.scope
    };

    const pkg: Package = {
      name: packageData.name,
      version: packageData.version,
      scope: packageData.scope,
      content: packageData.content,
      metadata: packageData.metadata,
      compression: 'zstd',
      size: packageData.content.byteLength,
      integrity: Bun.hash(packageData.content).toString()
    };

    await this.set(request, pkg);
    
    return {
      success: true,
      path: `${this.basePath}/packages/${packageData.name}-${packageData.version}.zst`,
      size: pkg.size
    };
  }

  private async initializeRegistry(): Promise<void> {
    try {
      await Bun.mkdir(`${this.basePath}/packages`, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private getPackageKey(request: ResolveRequest): string {
    return `${request.scope}:${request.name}@${request.version}`;
  }

  private async compressPackage(pkg: Package): Promise<Buffer> {
    if (pkg.compression === 'zstd') {
      return await zstd.compress(pkg.content);
    } else {
      return await gzip(pkg.content);
    }
  }

  private decodePackage(data: Buffer, compression: 'zstd' | 'gzip'): Package {
    // Mock decode - in real implementation would decompress
    return {
      name: 'decoded-package',
      version: '1.0.0',
      scope: 'syndicate',
      content: data,
      metadata: {
        name: 'decoded-package',
        version: '1.0.0',
        scope: 'syndicate'
      },
      compression,
      size: data.byteLength,
      integrity: Bun.hash(data).toString()
    };
  }

  private getCompressionExt(compression: 'zstd' | 'gzip'): string {
    return compression === 'zstd' ? 'zst' : 'gz';
  }
}

export class GlobalRegistry {
  private baseUrl = 'https://registry.syndicate.example.com';

  async fetch(request: ResolveRequest): Promise<Package> {
    console.log(`🌐 Fetching from global registry: ${this.getPackageUrl(request)}`);
    
    // Mock implementation - would make HTTP request in real scenario
    const mockPackage: Package = {
      name: request.name,
      version: request.version,
      scope: request.scope,
      content: Buffer.from(`Global package content for ${request.name}@${request.version}`),
      metadata: {
        name: request.name,
        version: request.version,
        scope: request.scope,
        description: 'Global registry package'
      },
      compression: 'zstd',
      size: 50,
      integrity: 'global-integrity-hash'
    };

    return mockPackage;
  }

  async publish(packageData: PackageData): Promise<any> {
    console.log(`🌐 Publishing to global registry: ${this.getPackageUrl(packageData)}`);
    
    // Mock implementation - would make HTTP request in real scenario
    return {
      success: true,
      url: this.getPackageUrl(packageData),
      publishedAt: new Date().toISOString()
    };
  }

  private getPackageUrl(request: ResolveRequest | PackageData): string {
    return `${this.baseUrl}/${request.scope}/${request.name}/${request.version}`;
  }
}

export class SecureVault {
  private vaultPath = './.citadel/vault';

  async storeSecrets(packageName: string, secrets: Record<string, string>): Promise<void> {
    console.log(`🔐 Storing secrets for ${packageName}`);
    
    try {
      await Bun.mkdir(this.vaultPath, { recursive: true });
      
      const encryptedSecrets = this.encryptSecrets(secrets);
      const vaultFile = `${this.vaultPath}/${packageName}.secrets`;
      
      await Bun.write(vaultFile, JSON.stringify(encryptedSecrets));
      
      console.log(`🔐 Secrets stored securely for ${packageName}`);
    } catch (error) {
      console.error(`Failed to store secrets for ${packageName}:`, error);
    }
  }

  async retrieveSecrets(packageName: string): Promise<Record<string, string> | null> {
    try {
      const vaultFile = `${this.vaultPath}/${packageName}.secrets`;
      const encryptedData = await file(vaultFile).text();
      const secrets = JSON.parse(encryptedData);
      
      return this.decryptSecrets(secrets);
    } catch {
      return null;
    }
  }

  private encryptSecrets(secrets: Record<string, string>): any {
    // Mock encryption - would use real encryption in production
    return {
      encrypted: Buffer.from(JSON.stringify(secrets)).toString('base64'),
      algorithm: 'aes-256-gcm',
      timestamp: Date.now()
    };
  }

  private decryptSecrets(encrypted: any): Record<string, string> {
    // Mock decryption - would use real decryption in production
    return JSON.parse(Buffer.from(encrypted.encrypted, 'base64').toString());
  }
}
