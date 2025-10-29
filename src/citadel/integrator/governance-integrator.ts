// citadel/integrator/governance-integrator.ts
import { file, YAML } from 'bun';

export interface RuleDefinition {
  id?: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  action: string;
  priority: 'REQUIRED' | 'STANDARD' | 'OPTIONAL';
  conditions?: Record<string, any>;
  fallbackAction?: string;
  tags?: string[];
  emoji?: string;
}

export interface HeaderOptions {
  rule: RuleDefinition;
  tags?: string[];
  emoji?: string;
  priority?: string;
}

export interface Header {
  human: string;
  machine: string;
  combined: string;
  metadata: {
    generatedAt: Date;
    version: string;
    tags: string[];
  };
}

export interface GovernanceResult {
  header: Header;
  yamlPath: string;
  wsEndpoint: string;
  enforcement: string;
  dashboard: DashboardWidget;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'rule' | 'metric' | 'alert';
  data: any;
  config: any;
}

export interface Dashboard {
  overview: {
    totalRules: number;
    activeEnforcements: number;
    cacheHitRate: number;
    packageCount: number;
  };
  rules: Record<string, YAMLEntry[]>;
  packages: PackageHealth[];
  alerts: Alert[];
  performance: {
    ruleProcessing: number;
    packageResolution: number;
    cacheEfficiency: number;
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
  enforcement: any;
}

export interface PackageHealth {
  name: string;
  version: string;
  status: 'healthy' | 'warning' | 'error';
  lastUpdated: string;
  metrics: any;
}

export interface Alert {
  id: string;
  type: 'security' | 'performance' | 'compliance';
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
}

export class GovernanceIntegrator {
  private headerGenerator = new DualTagHeaderGenerator();
  private yamlRegistry = new YAMLRegistry();
  private wsManager = new WebSocketManager();

  async processRule(rule: RuleDefinition): Promise<GovernanceResult> {
    console.log(`🎯 Processing governance rule: ${rule.name}`);
    
    // Generate dual-tag header
    const header = await this.headerGenerator.generate({
      rule,
      tags: rule.tags || ['SECURITY', 'AUTO-ENFORCE'],
      emoji: rule.emoji || '🛡️',
      priority: rule.priority
    });

    // Register in YAML registry (Bun native parsing)
    const yamlEntry = await this.yamlRegistry.register(rule);
    
    // Setup WebSocket monitoring with cookie authentication
    const wsEndpoint = await this.wsManager.createMonitor(rule, {
      auth: {
        type: 'cookie',
        name: 'syndicate-gov',
        httpOnly: true
      }
    });

    return {
      header,
      yamlPath: yamlEntry.path,
      wsEndpoint,
      enforcement: this.generateEnforcementCode(rule),
      dashboard: await this.createDashboardWidget(rule)
    };
  }

  async generateDashboard(): Promise<Dashboard> {
    console.log('📊 Generating governance dashboard...');
    
    const rules = await this.yamlRegistry.getAllRules();
    const packages = await this.getInstalledPackages();
    const metrics = await this.collectGovernanceMetrics();

    return {
      overview: {
        totalRules: rules.length,
        activeEnforcements: metrics.activeEnforcements,
        cacheHitRate: metrics.cacheHitRate,
        packageCount: packages.length
      },
      rules: this.groupRulesByCategory(rules),
      packages: this.analyzePackageHealth(packages),
      alerts: await this.getActiveAlerts(),
      performance: {
        ruleProcessing: metrics.processingTime,
        packageResolution: metrics.resolutionTime,
        cacheEfficiency: metrics.cacheEfficiency
      }
    };
  }

  private groupRulesByCategory(rules: YAMLEntry[]): Record<string, YAMLEntry[]> {
    const grouped: Record<string, YAMLEntry[]> = {};
    
    for (const rule of rules) {
      if (!grouped[rule.category]) {
        grouped[rule.category] = [];
      }
      grouped[rule.category].push(rule);
    }
    
    return grouped;
  }

  private analyzePackageHealth(packages: any[]): PackageHealth[] {
    return packages.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      status: 'healthy', // Mock status
      lastUpdated: new Date().toISOString(),
      metrics: {
        dependencies: Object.keys(pkg.dependencies || {}).length,
        size: pkg.size || 0,
        downloads: Math.floor(Math.random() * 10000)
      }
    }));
  }

  private async getInstalledPackages(): Promise<any[]> {
    // Mock implementation - would read from package.json or registry
    return [
      {
        name: '@syndicate/agent-risk',
        version: '1.2.3',
        dependencies: { '@syndicate/core': '^1.0.0' },
        size: 1024
      },
      {
        name: '@syndicate/gov-headers',
        version: '2.1.0',
        dependencies: { '@syndicate/core': '^1.0.0' },
        size: 2048
      }
    ];
  }

  private async collectGovernanceMetrics(): Promise<any> {
    return {
      activeEnforcements: 12,
      cacheHitRate: 94.2,
      processingTime: 45,
      resolutionTime: 120,
      cacheEfficiency: 87.5
    };
  }

  private async getActiveAlerts(): Promise<Alert[]> {
    return [
      {
        id: 'alert-001',
        type: 'security',
        severity: 'high',
        message: 'Unusual package access pattern detected',
        timestamp: new Date().toISOString()
      }
    ];
  }

  private generateEnforcementCode(rule: RuleDefinition): string {
    const action = rule.action || 'log.warning';
    return `
// Auto-generated enforcement for ${rule.name}
export async function enforce${rule.name.replace(/\s+/g, '')}(context: any): Promise<boolean> {
  const trigger = ${rule.trigger};
  const action = '${action}';
  
  if (trigger) {
    console.log('🎯 Rule triggered:', '${rule.name}');
    // Execute action: ${action}
    return true;
  }
  
  return false;
}`;
  }

  private async createDashboardWidget(rule: RuleDefinition): Promise<DashboardWidget> {
    return {
      id: rule.id || `widget-${Date.now()}`,
      title: rule.name,
      type: 'rule',
      data: {
        status: 'active',
        lastTriggered: new Date().toISOString(),
        triggerCount: Math.floor(Math.random() * 100)
      },
      config: {
        refreshInterval: 5000,
        showMetrics: true,
        allowDisable: rule.priority !== 'REQUIRED'
      }
    };
  }
}

export class DualTagHeaderGenerator {
  async generate(options: HeaderOptions): Promise<Header> {
    const baseHeader = this.generateBaseHeader(options);
    const aiHeader = await this.generateAIHeader(options);
    
    return {
      human: baseHeader,
      machine: aiHeader,
      combined: this.combineHeaders(baseHeader, aiHeader),
      metadata: {
        generatedAt: new Date(),
        version: 'v2.0',
        tags: options.tags || []
      }
    };
  }

  private generateBaseHeader(options: HeaderOptions): string {
    const emoji = options.emoji || this.inferEmoji(options.rule);
    const priority = options.priority || options.rule.priority;
    
    return `${emoji} **${options.rule.name}** - *${options.rule.description}* [${priority}]`;
  }

  private inferEmoji(rule: RuleDefinition): string {
    const emojiMap: Record<string, string> = {
      'SECURITY': '🛡️',
      'PERFORMANCE': '⚡',
      'COMPLIANCE': '📋',
      'RISK': '⚠️',
      'MONITORING': '📊'
    };
    
    return emojiMap[rule.category.toUpperCase()] || '📝';
  }

  private async generateAIHeader(options: HeaderOptions): Promise<string> {
    // Use Bun's AI capabilities or call external API
    const prompt = this.buildAIPrompt(options);
    
    // Mock AI response - would call actual AI service
    const response = {
      confidence: 0.95,
      classification: 'high-priority-governance',
      recommendations: ['implement-monitoring', 'add-fallback', 'schedule-review'],
      estimatedImpact: 'high',
      automationLevel: 'full'
    };
    
    return this.formatAIHeader(response, options);
  }

  private buildAIPrompt(options: HeaderOptions): string {
    return `
Analyze the following governance rule and provide machine-readable metadata:

Rule: ${options.rule.name}
Description: ${options.rule.description}
Category: ${options.rule.category}
Priority: ${options.rule.priority}
Trigger: ${options.rule.trigger}
Action: ${options.rule.action}

Provide classification, confidence score, and recommendations.
`;
  }

  private formatAIHeader(response: any, options: HeaderOptions): string {
    return `🤖 AI Classification: ${response.classification} (confidence: ${(response.confidence * 100).toFixed(1)}%)
🎯 Impact: ${response.estimatedImpact}
🔧 Automation: ${response.automationLevel}
💡 Recommendations: ${response.recommendations.join(', ')}`;
  }

  private combineHeaders(human: string, machine: string): string {
    return `👤 ${human}\n🤖 ${machine}`;
  }
}

export class YAMLRegistry {
  private registryPath = './.citadel/registry.yaml';
  private cache = new Map<string, any>();

  async register(rule: RuleDefinition): Promise<{ path: string; id: string }> {
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
    
    return {
      path: this.registryPath,
      id: entry.id
    };
  }

  async loadRegistry(): Promise<any> {
    try {
      const content = await file(this.registryPath).text();
      return YAML.parse(content);
    } catch {
      // Initialize new registry
      return {
        version: '1.0.0',
        rules: [],
        packages: [],
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };
    }
  }

  async saveRegistry(registry: any): Promise<void> {
    const yamlContent = YAML.stringify(registry);
    await Bun.write(this.registryPath, yamlContent);
    
    console.log('💾 Registry updated and saved');
  }

  async getAllRules(): Promise<YAMLEntry[]> {
    const registry = await this.loadRegistry();
    return registry.rules || [];
  }

  async findRulesByCategory(category: string): Promise<YAMLEntry[]> {
    const registry = await this.loadRegistry();
    return registry.rules.filter((rule: YAMLEntry) => rule.category === category);
  }

  private generateRuleId(rule: RuleDefinition): string {
    const category = rule.category.substring(0, 3).toUpperCase();
    const name = rule.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    return `${category}-${name}-${timestamp}`;
  }

  private generateEnforcementYAML(rule: RuleDefinition): any {
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

  private generateAlertConfig(rule: RuleDefinition): any {
    return {
      enabled: rule.priority === 'REQUIRED',
      thresholds: {
        failure_rate: 0.05,
        execution_time: 1000
      },
      notifications: ['console', 'websocket']
    };
  }
}

export class WebSocketManager {
  private connections = new Map<string, any>();
  private cookieManager = new CookieManager();

  async createMonitor(rule: RuleDefinition, options: any = {}): Promise<string> {
    const endpoint = `/ws/monitor/${rule.id || this.generateRuleId(rule)}`;
    const port = options.port || 3001;
    
    console.log(`🔗 Creating WebSocket monitor for ${rule.name} on ${endpoint}`);
    
    // Mock WebSocket setup - would use actual Bun.serve in production
    const wsUrl = `ws://localhost:${port}${endpoint}`;
    
    // Store connection info
    this.connections.set(rule.id || rule.name, {
      endpoint,
      ruleId: rule.id || rule.name,
      connectedAt: Date.now(),
      status: 'active'
    });

    return wsUrl;
  }

  private generateRuleId(rule: RuleDefinition): string {
    return `rule-${Date.now()}`;
  }

  async broadcastRuleUpdate(ruleId: string, update: any): Promise<void> {
    const connection = this.connections.get(ruleId);
    if (connection) {
      console.log(`📡 Broadcasting update for rule: ${ruleId}`);
      // Would send actual WebSocket message
    }
  }
}

export class CookieManager {
  parse(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }

  createAuthCookie(token: string, options: any = {}): string {
    const defaults = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    };

    const settings = { ...defaults, ...options };
    
    return `syndicate-auth=${token}; ${this.serializeOptions(settings)}`;
  }

  private serializeOptions(options: any): string {
    const parts: string[] = [];
    
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    
    return parts.join('; ');
  }
}
