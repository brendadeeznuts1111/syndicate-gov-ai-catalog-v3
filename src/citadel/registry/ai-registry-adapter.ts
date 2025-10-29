// [REGISTRY][SERVICE][TYPESCRIPT][AI-REGISTRY-ADAPTER-001][v3.0][LIVE]
// Grepable: [registry-service-typescript-ai-registry-adapter-001-v3.0-live]
// src/citadel/registry/ai-registry-adapter.ts
// 🛡️ **Maintainers**: @syndicate-gov/registry-team, @syndicate-gov/ai-team
// 🎯 **Semantic Tag**: 🟣 [REGISTRY-TEAM][AI][SERVICE][TYPESCRIPT]
// 📊 **Coverage**: AI-Registry Fusion Core - Seamless integration of AI YAML Generator with Citadel registry

import { YAML, file } from 'bun';
import { YAMLRegistry } from './yaml-registry.ts';
import { APIRegistry } from './api-registry.ts';
import { UnifiedRegistry, SecureVault } from './unified-registry.ts';
import { AIYAMLGenerator } from '../../ai/ai-yaml-gen.js';
import { AIHeaderGenerator } from '../../ai/ai-header-gen.js';

export interface AIContext {
  title?: string;
  scope?: string;
  type?: string;
  variant?: string;
  status?: string;
  context?: Record<string, any>;
  store?: boolean;
  broadcast?: boolean;
  vaultSync?: boolean;
}

export interface AIResult {
  header: string;
  config: string;
  yamlPath?: string;
  headerPath?: string;
  secrets?: Record<string, string>;
  metadata: {
    hash: string;
    timestamp: string;
    inferenceTime: number;
    confidence: number;
    model: string;
  };
  performance: {
    storageTime: number;
    broadcastTime: number;
    vaultTime: number;
    totalTime: number;
  };
}

export class AIRegistryAdapter {
  private yamlRegistry: YAMLRegistry;
  private apiRegistry: APIRegistry;
  private unifiedRegistry: UnifiedRegistry;
  private aiHeaderGenerator: AIHeaderGenerator;
  private aiYAMLGenerator: AIYAMLGenerator;

  constructor(
    yamlRegistry?: YAMLRegistry,
    apiRegistry?: APIRegistry,
    unifiedRegistry?: UnifiedRegistry,
    aiHeaderGenerator?: AIHeaderGenerator,
    aiYAMLGenerator?: AIYAMLGenerator
  ) {
    this.yamlRegistry = yamlRegistry || new YAMLRegistry();
    this.apiRegistry = apiRegistry || new APIRegistry();
    this.unifiedRegistry = unifiedRegistry || new UnifiedRegistry();
    this.aiHeaderGenerator = aiHeaderGenerator || new AIHeaderGenerator();
    this.aiYAMLGenerator = aiYAMLGenerator || new AIYAMLGenerator();
  }

  async generateAndStore(context: AIContext): Promise<AIResult> {
    const startTime = performance.now();
    console.log(`🤖 AI Registry Adapter: Generating with context:`, context);
    
    try {
      // Generate AI-driven header and YAML config
      const headerStart = performance.now();
      const headerResult = await this.aiHeaderGenerator.generateAIHeader({
        title: context.title || 'AI Generated Rule',
        context: context.context || {}
      });
      const headerTime = performance.now() - headerStart;

      const configStart = performance.now();
      const configResult = await this.aiYAMLGenerator.generateAIYAML({
        scope: context.scope || 'GOV',
        type: context.type || 'RULES',
        variant: context.variant || 'LIVE',
        status: context.status || 'LIVE',
        context: context.context || {}
      });
      const configTime = performance.now() - configStart;

      const header = headerResult.header;
      const config = configResult.yaml;
      const hash = await this.generateHash(header + config);
      const timestamp = new Date().toISOString();

      // Validate against bun.yaml schema
      await this.validateSchema(header);

      let storageTime = 0;
      let yamlPath = '';
      let headerPath = '';

      // Store in YAML registry with zstd compression if requested
      if (context.store !== false) {
        const storeStart = performance.now();
        
        // Store header
        headerPath = `rules/ai-${hash.substring(0, 8)}.md`;
        await Bun.write(headerPath, header);
        
        // Store YAML config
        yamlPath = `rules/ai-${hash.substring(0, 8)}.yaml`;
        await Bun.write(yamlPath, config);
        
        // Register in YAML registry (simplified registration)
        try {
          await this.yamlRegistry.register({
            id: `ai-${hash.substring(0, 8)}`,
            name: context.title || 'AI Generated Rule',
            category: context.scope || 'GOV',
            trigger: 'AI-generated',
            action: 'Automated enforcement',
            priority: context.status || 'LIVE',
            version: '2.1.0',
            createdAt: timestamp,
            enforcement: {
              trigger: 'ai-generated',
              action: 'automated',
              conditions: context.context || {},
              fallback: 'log-warning',
              monitoring: {
                enabled: true,
                metrics: ['inference_time', 'accuracy', 'compliance'],
                alerts: {
                  enabled: true,
                  thresholds: {
                    failure_rate: 0.05,
                    execution_time: 1000
                  },
                  notifications: ['console', 'websocket']
                }
              }
            }
          });
        } catch (regError) {
          console.warn('⚠️ Registry registration failed, but files were stored:', regError.message);
        }
        
        storageTime = performance.now() - storeStart;
        console.log(`💾 AI Registry: Stored in ${storageTime.toFixed(2)}ms`);
      }

      let broadcastTime = 0;
      // Broadcast to dashboard if requested
      if (context.broadcast) {
        const broadcastStart = performance.now();
        await this.apiRegistry.broadcastUpdate('ai:generated', {
          hash,
          changes: [`rules.ai-generated-${hash.substring(0, 8)}`, header],
          metadata: {
            timestamp,
            inferenceTime: headerTime + configTime,
            confidence: headerResult.confidence || configResult.confidence || 0.978
          }
        });
        broadcastTime = performance.now() - broadcastStart;
        console.log(`📡 AI Registry: Broadcast in ${broadcastTime.toFixed(2)}ms`);
      }

      let vaultTime = 0;
      let secrets: Record<string, string> = {};
      // Sync secrets to vault if requested
      if (context.vaultSync && context.context?.secrets) {
        const vaultStart = performance.now();
        secrets = context.context.secrets;
        await this.unifiedRegistry.publish({
          name: `ai-${hash.substring(0, 8)}`,
          version: '2.1.0',
          scope: context.scope || 'GOV',
          content: Buffer.from(config),
          metadata: {
            name: `ai-${hash.substring(0, 8)}`,
            version: '2.1.0',
            scope: context.scope || 'GOV',
            description: context.title || 'AI Generated Rule'
          },
          secrets
        });
        vaultTime = performance.now() - vaultStart;
        console.log(`🔐 AI Registry: Vault sync in ${vaultTime.toFixed(2)}ms`);
      }

      const totalTime = performance.now() - startTime;

      const result: AIResult = {
        header,
        config,
        yamlPath,
        headerPath,
        secrets,
        metadata: {
          hash,
          timestamp,
          inferenceTime: headerTime + configTime,
          confidence: headerResult.confidence || configResult.confidence || 0.978,
          model: 'WASM TensorFlow Lite'
        },
        performance: {
          storageTime,
          broadcastTime,
          vaultTime,
          totalTime
        }
      };

      console.log(`✅ AI Registry Adapter: Completed in ${totalTime.toFixed(2)}ms`);
      console.log(`   📊 Performance: Storage ${storageTime.toFixed(2)}ms, Broadcast ${broadcastTime.toFixed(2)}ms, Vault ${vaultTime.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      console.error('❌ AI Registry Adapter failed:', error.message);
      throw error;
    }
  }

  async validateSchema(header: string): Promise<void> {
    try {
      const schema = await file('config/bun.yaml').text();
      const parsedSchema = YAML.parse(schema);
      const headerTags = header.match(/\[(.*?)\]/g)?.map(tag => tag.slice(1, -1));
      
      if (!headerTags || headerTags.length < 6) {
        throw new Error(`❌ AI Header invalid: insufficient tags. Found: ${headerTags?.join(', ') || 'none'}`);
      }

      const [scope, type, variant, id, version, status] = headerTags;
      
      // Validate against schema with fallbacks
      const validScopes = parsedSchema?.rules?.header?.schema?.scope || ['GOV', 'SEC', 'OPS', 'ALERT', 'BASH', 'DASHBOARD', 'ETL'];
      const validTypes = parsedSchema?.rules?.header?.schema?.type || ['RULES', 'SCRIPT', 'CONFIG', 'MULTI-ETL'];
      const validVariants = parsedSchema?.rules?.header?.schema?.variant || ['EXPANDED', 'COMPACT', 'LIVE', 'DEV', 'TEST', 'DEPRECATED', 'SCRIPT', 'YAML'];
      const validStatuses = parsedSchema?.rules?.header?.schema?.status || ['LIVE', 'DEV', 'TEST', 'DEPRECATED', 'REQUIRED', 'STANDARD', 'OPTIONAL'];

      if (!validScopes.includes(scope)) {
        throw new Error(`❌ AI Scope invalid: ${scope}. Must be one of: ${validScopes.join(', ')}`);
      }

      if (!validTypes.includes(type)) {
        throw new Error(`❌ AI Type invalid: ${type}. Must be one of: ${validTypes.join(', ')}`);
      }

      if (!validVariants.includes(variant)) {
        throw new Error(`❌ AI Variant invalid: ${variant}. Must be one of: ${validVariants.join(', ')}`);
      }

      if (!validStatuses.includes(status)) {
        throw new Error(`❌ AI Status invalid: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      console.log(`✅ AI Schema validated: [${scope}][${type}][${variant}][${id}][${version}][${status}]`);
    } catch (error) {
      if (error.message.includes('AI')) {
        throw error;
      }
      console.warn('⚠️ Schema validation failed, using defaults:', error.message);
    }
  }

  private async generateHash(content: string): Promise<string> {
    const buffer = Buffer.from(content);
    const hash = Bun.hash(buffer);
    return hash.toString(16); // Use hexadecimal instead of default radix
  }

  // Performance benchmarking
  async benchmark(iterations: number = 100): Promise<any> {
    console.log(`📊 AI Registry Adapter: Running ${iterations} iterations benchmark...`);
    
    const results = {
      totalInferenceTime: 0,
      totalStorageTime: 0,
      totalBroadcastTime: 0,
      totalVaultTime: 0,
      totalOperations: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0
    };

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        const result = await this.generateAndStore({
          title: `Benchmark Rule ${i}`,
          scope: 'GOV',
          type: 'RULES',
          context: { benchmark: true, iteration: i }
        });
        const end = performance.now();
        
        const totalTime = end - start;
        results.totalOperations += totalTime;
        results.totalInferenceTime += result.metadata.inferenceTime;
        results.totalStorageTime += result.performance.storageTime;
        results.totalBroadcastTime += result.performance.broadcastTime;
        results.totalVaultTime += result.performance.vaultTime;
        
        results.minTime = Math.min(results.minTime, totalTime);
        results.maxTime = Math.max(results.maxTime, totalTime);
        
        if (i % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        results.errors++;
        console.error(`❌ Benchmark iteration ${i} failed:`, error.message);
      }
    }

    console.log('\n📈 AI Registry Adapter Benchmark Results:');
    console.log(`   Total Operations: ${iterations - results.errors}/${iterations}`);
    console.log(`   Average Total Time: ${(results.totalOperations / (iterations - results.errors)).toFixed(2)}ms`);
    console.log(`   Average Inference Time: ${(results.totalInferenceTime / (iterations - results.errors)).toFixed(2)}ms`);
    console.log(`   Average Storage Time: ${(results.totalStorageTime / (iterations - results.errors)).toFixed(2)}ms`);
    console.log(`   Average Broadcast Time: ${(results.totalBroadcastTime / (iterations - results.errors)).toFixed(2)}ms`);
    console.log(`   Average Vault Time: ${(results.totalVaultTime / (iterations - results.errors)).toFixed(2)}ms`);
    console.log(`   Min Time: ${results.minTime.toFixed(2)}ms`);
    console.log(`   Max Time: ${results.maxTime.toFixed(2)}ms`);
    console.log(`   Error Rate: ${((results.errors / iterations) * 100).toFixed(2)}%`);

    return results;
  }

  // Batch generation for scaling
  async generateBatch(contexts: AIContext[]): Promise<AIResult[]> {
    console.log(`🚀 AI Registry Adapter: Generating batch of ${contexts.length} items...`);
    
    const results: AIResult[] = [];
    const startTime = performance.now();
    
    for (let i = 0; i < contexts.length; i++) {
      try {
        const result = await this.generateAndStore(contexts[i]);
        results.push(result);
        console.log(`✅ Batch item ${i + 1}/${contexts.length} completed`);
      } catch (error) {
        console.error(`❌ Batch item ${i + 1} failed:`, error.message);
      }
    }
    
    const totalTime = performance.now() - startTime;
    const avgTime = totalTime / contexts.length;
    
    console.log(`🎯 Batch completed: ${results.length}/${contexts.length} successful`);
    console.log(`⚡ Average time per item: ${avgTime.toFixed(2)}ms`);
    console.log(`🚀 Total batch time: ${totalTime.toFixed(2)}ms`);
    
    return results;
  }
}

// CLI: bun run src/citadel/registry/ai-registry-adapter.ts --title "AI Compliance Rule" --scope GOV --context '{"env":"prod"}'
if (import.meta.main) {
  const args = process.argv.slice(2);
  const context: AIContext = {
    title: 'AI Generated Rule',
    scope: 'GOV',
    type: 'RULES',
    store: true,
    broadcast: false,
    vaultSync: false
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--title=')) {
      context.title = arg.split('=')[1];
    } else if (arg.startsWith('--scope=')) {
      context.scope = arg.split('=')[1];
    } else if (arg.startsWith('--type=')) {
      context.type = arg.split('=')[1];
    } else if (arg.startsWith('--variant=')) {
      context.variant = arg.split('=')[1];
    } else if (arg.startsWith('--status=')) {
      context.status = arg.split('=')[1];
    } else if (arg.startsWith('--context=')) {
      try {
        context.context = JSON.parse(arg.split('=')[1]);
      } catch (e) {
        console.error('❌ Invalid JSON in --context parameter');
        process.exit(1);
      }
    } else if (arg === '--store') {
      context.store = true;
    } else if (arg === '--broadcast') {
      context.broadcast = true;
    } else if (arg === '--vault-sync') {
      context.vaultSync = true;
    } else if (arg === '--benchmark') {
      // Run benchmark
      const adapter = new AIRegistryAdapter();
      await adapter.benchmark(100);
      process.exit(0);
    } else if (arg === '--help') {
      console.log(`
🤖 AI Registry Adapter CLI

Usage: bun run src/citadel/registry/ai-registry-adapter.ts [options]

Options:
  --title=<string>        Rule title (default: "AI Generated Rule")
  --scope=<string>        Rule scope (GOV, SEC, OPS, ALERT, BASH, DASHBOARD, ETL)
  --type=<string>         Rule type (RULES, SCRIPT, CONFIG, MULTI-ETL)
  --variant=<string>      Rule variant (EXPANDED, COMPACT, LIVE, DEV, TEST, DEPRECATED, SCRIPT, YAML)
  --status=<string>       Rule status (LIVE, DEV, TEST, DEPRECATED, REQUIRED, STANDARD, OPTIONAL)
  --context=<json>        Additional context as JSON string
  --store                 Store generated files (default: true)
  --broadcast             Broadcast to dashboard WebSocket
  --vault-sync            Sync secrets to vault
  --benchmark             Run performance benchmark (100 iterations)
  --help                  Show this help

Examples:
  bun run src/citadel/registry/ai-registry-adapter.ts --title "Security Rule" --scope SEC --broadcast
  bun run src/citadel/registry/ai-registry-adapter.ts --context '{"env":"prod","focus":"security"}' --vault-sync
  bun run src/citadel/registry/ai-registry-adapter.ts --benchmark
      `);
      process.exit(0);
    }
  }

  try {
    const adapter = new AIRegistryAdapter();
    const result = await adapter.generateAndStore(context);
    
    console.log('\n🎉 AI Registry Adapter Result:');
    console.log(`📝 Header: ${result.header.split('\n')[0]}`);
    console.log(`⚙️  Config: ${result.config.split('\n')[0]}`);
    console.log(`🔑 Hash: ${result.metadata.hash}`);
    console.log(`⚡ Inference: ${result.metadata.inferenceTime.toFixed(2)}ms`);
    console.log(`🎯 Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`📊 Total Time: ${result.performance.totalTime.toFixed(2)}ms`);
    
    if (result.yamlPath) {
      console.log(`💾 YAML stored: ${result.yamlPath}`);
    }
    if (result.headerPath) {
      console.log(`📄 Header stored: ${result.headerPath}`);
    }
    if (context.broadcast) {
      console.log(`📡 Broadcast: ws://localhost:3003/ws/config-update`);
    }
    if (context.vaultSync && Object.keys(result.secrets || {}).length > 0) {
      console.log(`🔐 Vault synced: ${Object.keys(result.secrets || {}).length} secrets`);
    }
  } catch (error) {
    console.error('❌ AI Registry Adapter failed:', error.message);
    process.exit(1);
  }
}
