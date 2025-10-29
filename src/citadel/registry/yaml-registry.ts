// citadel/registry/yaml-registry.ts
import { file, YAML } from 'bun';

export interface RegistrySchema {
  version: string;
  rules: YAMLEntry[];
  packages: PackageEntry[];
  metadata: {
    created: string;
    updated: string;
  };
}

export interface YAMLEntry {
  id: string;
  name: string;
  category: string;
  trigger: string;
  action: string;
  priority: string;
  version: string;
  createdAt: string;
  enforcement: EnforcementConfig;
}

export interface PackageEntry {
  name: string;
  version: string;
  scope: string;
  size: number;
  dependencies: Record<string, string>;
  lastUpdated: string;
}

export interface EnforcementConfig {
  trigger: string;
  action: string;
  conditions: Record<string, any>;
  fallback: string;
  monitoring: MonitoringConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    failure_rate: number;
    execution_time: number;
  };
  notifications: string[];
}

export class YAMLRegistry {
  private registryPath = './.citadel/registry.yaml';
  private cache = new Map<string, any>();
  private watchers: Array<(registry: RegistrySchema) => void> = [];

  constructor() {
    this.initializeRegistry();
  }

  async register(rule: any): Promise<YAMLEntry> {
    console.log(`📝 Registering rule in YAML registry: ${rule.name}`);
    
    const registry = await this.loadRegistry();
    
    const entry: YAMLEntry = {
      id: rule.id || this.generateRuleId(rule),
      name: rule.name,
      category: rule.category,
      trigger: rule.trigger,
      action: rule.action,
      priority: rule.priority,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      enforcement: this.generateEnforcementYAML(rule)
    };

    // Use Bun's native YAML parsing
    registry.rules.push(entry);
    await this.saveRegistry(registry);
    
    // Cache for performance
    this.cache.set(entry.id, entry);
    
    // Notify watchers
    this.emit('registry:updated', registry);
    
    console.log(`✅ Rule registered: ${entry.id}`);
    return entry;
  }

  async loadRegistry(): Promise<RegistrySchema> {
    try {
      // Bun native YAML import
      const content = await file(this.registryPath).text();
      const registry = YAML.parse(content);
      
      // Validate schema
      if (!this.validateRegistrySchema(registry)) {
        console.warn('Invalid registry schema, initializing new registry');
        return this.initializeNewRegistry();
      }
      
      return registry;
    } catch (error) {
      console.log('Registry not found, initializing new one...');
      return this.initializeNewRegistry();
    }
  }

  async saveRegistry(registry: RegistrySchema): Promise<void> {
    // Update metadata
    registry.metadata.updated = new Date().toISOString();
    
    // Use Bun's native YAML stringification
    const yamlContent = YAML.stringify(registry, {
      indent: 2,
      lineWidth: 120
    });
    
    await Bun.write(this.registryPath, yamlContent);
    
    // Hot reload support
    this.emit('registry:updated', registry);
    
    console.log('💾 Registry saved successfully');
  }

  async getAllRules(): Promise<YAMLEntry[]> {
    const registry = await this.loadRegistry();
    return registry.rules || [];
  }

  async findRulesByCategory(category: string): Promise<YAMLEntry[]> {
    const registry = await this.loadRegistry();
    return registry.rules.filter(rule => 
      rule.category.toLowerCase() === category.toLowerCase()
    );
  }

  async findRuleById(id: string): Promise<YAMLEntry | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    const registry = await this.loadRegistry();
    const rule = registry.rules.find(r => r.id === id);
    
    if (rule) {
      this.cache.set(id, rule);
    }
    
    return rule || null;
  }

  async updateRule(id: string, updates: Partial<YAMLEntry>): Promise<YAMLEntry | null> {
    const registry = await this.loadRegistry();
    const ruleIndex = registry.rules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return null;
    }
    
    // Update rule
    registry.rules[ruleIndex] = { ...registry.rules[ruleIndex], ...updates };
    
    await this.saveRegistry(registry);
    
    // Update cache
    this.cache.set(id, registry.rules[ruleIndex]);
    
    console.log(`🔄 Rule updated: ${id}`);
    return registry.rules[ruleIndex];
  }

  async deleteRule(id: string): Promise<boolean> {
    const registry = await this.loadRegistry();
    const ruleIndex = registry.rules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return false;
    }
    
    registry.rules.splice(ruleIndex, 1);
    await this.saveRegistry(registry);
    
    // Remove from cache
    this.cache.delete(id);
    
    console.log(`🗑️  Rule deleted: ${id}`);
    return true;
  }

  async registerPackage(pkg: any): Promise<PackageEntry> {
    const registry = await this.loadRegistry();
    
    const entry: PackageEntry = {
      name: pkg.name,
      version: pkg.version,
      scope: pkg.scope,
      size: pkg.size || 0,
      dependencies: pkg.dependencies || {},
      lastUpdated: new Date().toISOString()
    };
    
    registry.packages.push(entry);
    await this.saveRegistry(registry);
    
    console.log(`📦 Package registered: ${entry.name}@${entry.version}`);
    return entry;
  }

  async getAllPackages(): Promise<PackageEntry[]> {
    const registry = await this.loadRegistry();
    return registry.packages || [];
  }

  async searchRules(query: string): Promise<YAMLEntry[]> {
    const registry = await this.loadRegistry();
    const lowerQuery = query.toLowerCase();
    
    return registry.rules.filter(rule => 
      rule.name.toLowerCase().includes(lowerQuery) ||
      rule.category.toLowerCase().includes(lowerQuery) ||
      rule.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getStatistics(): Promise<any> {
    const registry = await this.loadRegistry();
    
    const categoryStats = registry.rules.reduce((acc: any, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {});
    
    const priorityStats = registry.rules.reduce((acc: any, rule) => {
      acc[rule.priority] = (acc[rule.priority] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalRules: registry.rules.length,
      totalPackages: registry.packages.length,
      categories: categoryStats,
      priorities: priorityStats,
      lastUpdated: registry.metadata.updated,
      version: registry.version
    };
  }

  // Event system for hot reloading
  on(event: string, callback: (registry: RegistrySchema) => void): void {
    this.watchers.push(callback);
  }

  private emit(event: string, registry: RegistrySchema): void {
    if (event === 'registry:updated') {
      this.watchers.forEach(callback => {
        try {
          callback(registry);
        } catch (error) {
          console.error('Error in registry watcher:', error);
        }
      });
    }
  }

  private async initializeRegistry(): Promise<void> {
    try {
      await Bun.mkdir('./.citadel', { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private initializeNewRegistry(): RegistrySchema {
    const now = new Date().toISOString();
    return {
      version: '1.0.0',
      rules: [],
      packages: [],
      metadata: {
        created: now,
        updated: now
      }
    };
  }

  private validateRegistrySchema(registry: any): boolean {
    return (
      registry &&
      typeof registry === 'object' &&
      typeof registry.version === 'string' &&
      Array.isArray(registry.rules) &&
      Array.isArray(registry.packages) &&
      registry.metadata &&
      typeof registry.metadata.created === 'string' &&
      typeof registry.metadata.updated === 'string'
    );
  }

  private generateRuleId(rule: any): string {
    const category = rule.category.substring(0, 3).toUpperCase();
    const name = rule.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    return `${category}-${name}-${timestamp}`;
  }

  private generateEnforcementYAML(rule: any): EnforcementConfig {
    return {
      trigger: rule.trigger,
      action: rule.action,
      conditions: rule.conditions || {},
      fallback: rule.fallbackAction || 'log-warning',
      monitoring: {
        enabled: true,
        metrics: ['execution_time', 'success_rate', 'false_positives'],
        alerts: this.generateAlertConfig(rule)
      }
    };
  }

  private generateAlertConfig(rule: any): AlertConfig {
    return {
      enabled: rule.priority === 'REQUIRED',
      thresholds: {
        failure_rate: 0.05,
        execution_time: 1000
      },
      notifications: ['console', 'websocket']
    };
  }

  // Advanced YAML operations
  async exportRegistry(format: 'yaml' | 'json' = 'yaml'): Promise<string> {
    const registry = await this.loadRegistry();
    
    if (format === 'json') {
      return JSON.stringify(registry, null, 2);
    }
    
    return YAML.stringify(registry);
  }

  async importRegistry(data: string, format: 'yaml' | 'json' = 'yaml'): Promise<void> {
    let registry: RegistrySchema;
    
    try {
      if (format === 'json') {
        registry = JSON.parse(data);
      } else {
        registry = YAML.parse(data);
      }
      
      if (!this.validateRegistrySchema(registry)) {
        throw new Error('Invalid registry schema');
      }
      
      await this.saveRegistry(registry);
      console.log('📥 Registry imported successfully');
    } catch (error) {
      console.error('❌ Failed to import registry:', error);
      throw error;
    }
  }

  async backupRegistry(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./.citadel/backup-${timestamp}.yaml`;
    
    const registry = await this.loadRegistry();
    const yamlContent = YAML.stringify(registry);
    
    await Bun.write(backupPath, yamlContent);
    
    console.log(`💾 Registry backed up to: ${backupPath}`);
    return backupPath;
  }

  async restoreRegistry(backupPath: string): Promise<void> {
    try {
      const content = await file(backupPath).text();
      await this.importRegistry(content, 'yaml');
      console.log(`🔄 Registry restored from: ${backupPath}`);
    } catch (error) {
      console.error('❌ Failed to restore registry:', error);
      throw error;
    }
  }
}
