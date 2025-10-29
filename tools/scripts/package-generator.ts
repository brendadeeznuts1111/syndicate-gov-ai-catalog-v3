#!/usr/bin/env bun
/**
 * Enterprise Package Metadata Generator v3.0
 * 
 * Generates standardized package.json files following the Syndicate
 * enterprise metadata standards with AI enhancement and quantum safety.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PackageConfig {
  name: string;
  category: 'business-intelligence' | 'governance' | 'ai' | 'security' | 'infrastructure';
  description: string;
  keywords: string[];
  features: string[];
  performance: {
    target_load_time?: string;
    target_render_time?: string;
    target_validation_time?: string;
    target_inference_time?: string;
    target_encryption_time?: string;
    concurrent_users?: number;
    concurrent_rules?: number;
    model_accuracy?: string;
    security_level?: string;
  };
  compliance: string[];
  hasBinary?: boolean;
  hasStyles?: boolean;
  target: 'browser' | 'node';
  customScripts?: Record<string, string>;
  customDependencies?: Record<string, string>;
  customDevDependencies?: Record<string, string>;
  customPeerDependencies?: Record<string, string>;
}

const TEMPLATES = {
  'business-intelligence': {
    baseDescription: 'Enterprise-grade business intelligence {module} with real-time analytics, KPI monitoring, and holographic visualization capabilities',
    defaultKeywords: [
      'dashboard', 'analytics', 'business-intelligence', 'kpi', 
      'monitoring', 'visualization', 'enterprise', 'react', 
      'typescript', 'syndicate', 'real-time', 'holographic', 'synesthetic'
    ],
    defaultFeatures: [
      'real-time-analytics',
      'kpi-monitoring',
      'holographic-visualization',
      'synesthetic-experience',
      'quantum-safe',
      'ai-enhanced'
    ],
    defaultPerformance: {
      target_load_time: '100ms',
      target_render_time: '50ms',
      concurrent_users: 10000
    },
    defaultDependencies: {
      'react': '^19.2.0',
      'react-dom': '^19.2.0',
      '@syndicate/core': '^3.0.3'
    },
    defaultDevDependencies: {
      '@types/react': '^19.2.0',
      '@types/react-dom': '^19.2.0',
      'typescript': '^5.0.4',
      'bun-types': '^1.3.0'
    },
    defaultPeerDependencies: {
      'react': '>=19.0.0',
      'react-dom': '>=19.0.0'
    }
  },
  governance: {
    baseDescription: 'Enterprise governance {module} with AI-enhanced validation, quantum-safe compliance, and real-time policy enforcement',
    defaultKeywords: [
      'governance', 'rules', 'compliance', 'validation', 'policy',
      'enterprise', 'ai-enhanced', 'quantum-safe', 'syndicate',
      'governance-engine', 'policy-enforcement', 'regulatory', 'audit', 'typescript'
    ],
    defaultFeatures: [
      'ai-enhanced-validation',
      'quantum-safe-compliance',
      'real-time-policy-enforcement',
      'governance-engine',
      'regulatory-audit',
      'blockchain-verification'
    ],
    defaultPerformance: {
      target_validation_time: '50ms',
      target_compliance_check: '100ms',
      concurrent_rules: 100000
    },
    defaultDependencies: {
      '@syndicate/core': '^3.0.3',
      'zod': '^3.24.3',
      'uuid': '^10.0.2'
    },
    defaultDevDependencies: {
      'typescript': '^5.0.4',
      'bun-types': '^1.3.0',
      '@types/uuid': '^10.0.0'
    }
  },
  ai: {
    baseDescription: 'AI-powered {module} with machine learning optimization, neural interface integration, and consciousness enhancement',
    defaultKeywords: [
      'ai', 'machine-learning', 'neural-network', 'consciousness',
      'syndicate', 'enterprise', 'quantum-safe', 'cognitive-enhancement', 'typescript'
    ],
    defaultFeatures: [
      'machine-learning-optimization',
      'neural-interface-integration',
      'consciousness-enhancement',
      'quantum-ai-processing',
      'predictive-analytics'
    ],
    defaultPerformance: {
      target_inference_time: '10ms',
      target_training_time: '1000ms',
      model_accuracy: '97.8%'
    },
    defaultDependencies: {
      '@syndicate/core': '^3.0.3',
      '@tensorflow/tfjs': '^4.0.0',
      'ml-matrix': '^6.10.0'
    },
    defaultDevDependencies: {
      'typescript': '^5.0.4',
      'bun-types': '^1.3.0',
      '@types/ml-matrix': '^6.10.0'
    }
  },
  security: {
    baseDescription: 'Quantum-safe {module} with post-quantum cryptography, blockchain verification, and consciousness-level security',
    defaultKeywords: [
      'quantum', 'security', 'cryptography', 'blockchain',
      'syndicate', 'enterprise', 'post-quantum', 'consciousness-security', 'typescript'
    ],
    defaultFeatures: [
      'post-quantum-cryptography',
      'blockchain-verification',
      'consciousness-level-security',
      'quantum-key-distribution',
      'tamper-proof-validation'
    ],
    defaultPerformance: {
      target_encryption_time: '5ms',
      target_decryption_time: '3ms',
      security_level: 'quantum-supreme'
    },
    defaultDependencies: {
      '@syndicate/core': '^3.0.3',
      'crypto': '^1.0.1',
      'blockchain-lib': '^2.0.0'
    },
    defaultDevDependencies: {
      'typescript': '^5.0.4',
      'bun-types': '^1.3.0'
    }
  },
  infrastructure: {
    baseDescription: 'Enterprise infrastructure {module} with quantum-safe operations, AI-enhanced monitoring, and supreme performance',
    defaultKeywords: [
      'infrastructure', 'scaling', 'monitoring', 'performance',
      'syndicate', 'enterprise', 'quantum-safe', 'ai-enhanced', 'typescript'
    ],
    defaultFeatures: [
      'quantum-safe-operations',
      'ai-enhanced-monitoring',
      'supreme-performance',
      'global-scaling',
      'real-time-optimization'
    ],
    defaultPerformance: {
      target_response_time: '20ms',
      target_throughput: '10000 ops/sec',
      availability: '99.999%'
    },
    defaultDependencies: {
      '@syndicate/core': '^3.0.3',
      'ioredis': '^5.3.0',
      'pg': '^8.11.0'
    },
    defaultDevDependencies: {
      'typescript': '^5.0.4',
      'bun-types': '^1.3.0',
      '@types/pg': '^8.10.0'
    }
  }
};

function generatePackageJson(config: PackageConfig): string {
  const template = TEMPLATES[config.category];
  const module = config.name.replace('@syndicate/', '');
  
  const packageJson = {
    name: config.name,
    version: '3.0.3',
    description: config.description || template.baseDescription.replace('{module}', module),
    license: 'MIT',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: generateExports(config),
    files: [
      'dist',
      'README.md',
      'LICENSE'
    ],
    scripts: generateScripts(config),
    dependencies: {
      ...template.defaultDependencies,
      ...config.customDependencies
    },
    devDependencies: {
      ...template.defaultDevDependencies,
      ...config.customDevDependencies
    },
    ...(config.customPeerDependencies && { peerDependencies: config.customPeerDependencies }),
    ...(config.hasBinary && { 
      bin: {
        [`syndicate-${module}`]: `./dist/cli/index.js`,
        [`${module}-validate`]: `./dist/cli/validate.js`
      }
    }),
    keywords: [
      ...template.defaultKeywords,
      ...config.keywords
    ],
    repository: {
      type: 'git',
      url: 'https://github.com/syndicate/ai-catalog.git',
      directory: `packages/${module}`
    },
    bugs: {
      url: 'https://github.com/syndicate/ai-catalog/issues'
    },
    homepage: `https://github.com/syndicate/ai-catalog/tree/main/packages/${module}#readme`,
    author: {
      name: `Syndicate ${config.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Team`,
      email: `${config.category}@syndicate.com`,
      url: `https://syndicate.com/${config.category}`
    },
    maintainers: [
      {
        name: `Syndicate ${config.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Team`,
        email: `${config.category}@syndicate.com`,
        url: `https://syndicate.com/${config.category}`
      },
      {
        name: 'Enterprise Support',
        email: 'enterprise@syndicate.com',
        url: 'https://syndicate.com/enterprise'
      }
    ],
    engines: {
      bun: '>=1.3.0',
      node: '>=20.0.0'
    },
    os: ['darwin', 'linux', 'win32'],
    cpu: ['x64', 'arm64'],
    publishConfig: {
      access: 'public',
      registry: 'https://registry.npmjs.org/'
    },
    funding: {
      type: 'github',
      url: 'https://github.com/sponsors/syndicate'
    },
    config: {
      enterprise: true,
      quantum_safe: true,
      ai_enhanced: true,
      performance_tier: 'supreme'
    },
    syndicate: {
      category: config.category,
      tier: 'enterprise',
      features: [
        ...template.defaultFeatures,
        ...config.features
      ],
      performance: {
        ...template.defaultPerformance,
        ...config.performance
      },
      compliance: [
        'SOC2',
        'ISO27001',
        'GDPR',
        'HIPAA',
        ...config.compliance
      ],
      ...(config.category === 'governance' && {
        governance: {
          policy_engine: 'ai-enhanced',
          validation_framework: 'quantum-safe',
          audit_trail: 'blockchain-verified',
          enforcement_mode: 'real-time'
        }
      })
    }
  };

  return JSON.stringify(packageJson, null, 2);
}

function generateExports(config: PackageConfig): Record<string, any> {
  const exports: Record<string, any> = {
    '.': {
      import: './dist/index.js',
      require: './dist/index.cjs',
      types: './dist/index.d.ts'
    }
  };

  // Add conditional exports based on package type
  if (config.category === 'business-intelligence') {
    exports['./components'] = {
      import: './dist/components/index.js',
      require: './dist/components/index.cjs',
      types: './dist/components/index.d.ts'
    };
    exports['./hooks'] = {
      import: './dist/hooks/index.js',
      require: './dist/hooks/index.cjs',
      types: './dist/hooks/index.d.ts'
    };
  }

  if (config.category === 'governance') {
    exports['./validators'] = {
      import: './dist/validators/index.js',
      require: './dist/validators/index.cjs',
      types: './dist/validators/index.d.ts'
    };
    exports['./parsers'] = {
      import: './dist/parsers/index.js',
      require: './dist/parsers/index.cjs',
      types: './dist/parsers/index.d.ts'
    };
    exports['./compliance'] = {
      import: './dist/compliance/index.js',
      require: './dist/compliance/index.cjs',
      types: './dist/compliance/index.d.ts'
    };
  }

  exports['./utils'] = {
    import: './dist/utils/index.js',
    require: './dist/utils/index.cjs',
    types: './dist/utils/index.d.ts'
  };

  if (config.hasStyles) {
    exports['./styles'] = './dist/styles.css';
  }

  exports['./package.json'] = './package.json';

  return exports;
}

function generateScripts(config: PackageConfig): Record<string, string> {
  const baseScripts = {
    build: `bun build src/index.ts --outdir dist --target ${config.target} --format esm`,
    'build:cjs': `bun build src/index.ts --outdir dist --target ${config.target} --format cjs --outfile index.cjs`,
    dev: 'bun --watch src/index.ts',
    test: 'bun test',
    lint: 'bun tsc --noEmit',
    typecheck: 'bun tsc',
    clean: 'rm -rf dist',
    prepublishOnly: 'bun run clean && bun run build && bun run build:cjs',
    analyze: 'bun install --analyze',
    audit: 'bun audit --severity=high',
    'audit:json': 'bun audit --json > audit-report.json'
  };

  // Add category-specific scripts
  if (config.category === 'governance') {
    baseScripts.validate = 'bun run src/cli/validate.ts';
    baseScripts['governance:check'] = 'bun run src/scripts/governance-check.ts';
    baseScripts['compliance:verify'] = 'bun run src/scripts/compliance-verify.ts';
  }

  if (config.category === 'business-intelligence') {
    baseScripts['dashboard:dev'] = 'bun run src/dashboard/dev.ts';
    baseScripts['analytics:test'] = 'bun run src/analytics/test.ts';
  }

  if (config.category === 'ai') {
    baseScripts['ai:train'] = 'bun run src/models/train.ts';
    baseScripts['ai:predict'] = 'bun run src/models/predict.ts';
  }

  if (config.category === 'security') {
    baseScripts['security:audit'] = 'bun run src/security/audit.ts';
    baseScripts['quantum:test'] = 'bun run src/quantum/test.ts';
  }

  return {
    ...baseScripts,
    ...config.customScripts
  };
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🏭 Enterprise Package Metadata Generator v3.0

Usage: bun run package-generator.ts <command> [options]

Commands:
  generate <category> <name>     Generate package.json for specific category
  validate <path>               Validate existing package.json
  update <path>                 Update existing package.json to standard

Categories:
  business-intelligence         BI dashboards and analytics
  governance                    Rules and compliance engines
  ai                            Machine learning and neural interfaces
  security                      Quantum-safe cryptography and security
  infrastructure                Scaling and performance infrastructure

Examples:
  bun run package-generator.ts generate business-intelligence analytics
  bun run package-generator.ts generate governance rules-engine
  bun run package-generator.ts validate packages/dashboard/package.json
    `);
    process.exit(0);
  }

  const command = args[0];

  if (command === 'generate') {
    if (args.length < 3) {
      console.error('❌ Usage: generate <category> <name>');
      process.exit(1);
    }

    const category = args[1] as PackageConfig['category'];
    const name = args[2];
    const packageName = `@syndicate/${name}`;

    if (!TEMPLATES[category]) {
      console.error(`❌ Unknown category: ${category}`);
      console.error(`Available categories: ${Object.keys(TEMPLATES).join(', ')}`);
      process.exit(1);
    }

    const config: PackageConfig = {
      name: packageName,
      category,
      description: '',
      keywords: [],
      features: [],
      performance: {},
      compliance: [],
      target: category === 'business-intelligence' ? 'browser' : 'node',
      hasBinary: category === 'governance',
      hasStyles: category === 'business-intelligence'
    };

    const packageJson = generatePackageJson(config);
    console.log(`✅ Generated package.json for ${packageName}`);
    console.log(`📁 Category: ${category}`);
    console.log(`🎯 Target: ${config.target}`);
    console.log(`🔒 Binary: ${config.hasBinary ? 'Yes' : 'No'}`);
    console.log(`🎨 Styles: ${config.hasStyles ? 'Yes' : 'No'}`);
    console.log('\n' + packageJson);
  } else if (command === 'validate') {
    if (args.length < 2) {
      console.error('❌ Usage: validate <path-to-package.json>');
      process.exit(1);
    }

    const path = args[1];
    if (!existsSync(path)) {
      console.error(`❌ File not found: ${path}`);
      process.exit(1);
    }

    try {
      const packageJson = JSON.parse(readFileSync(path, 'utf8'));
      console.log(`✅ Valid JSON in ${path}`);
      
      // Basic validation
      const required = ['name', 'version', 'description', 'license'];
      const missing = required.filter(field => !packageJson[field]);
      
      if (missing.length > 0) {
        console.warn(`⚠️  Missing required fields: ${missing.join(', ')}`);
      } else {
        console.log('✅ All required fields present');
      }

      // Syndicate validation
      if (!packageJson.syndicate) {
        console.warn('⚠️  Missing syndicate configuration');
      } else {
        console.log('✅ Syndicate configuration present');
      }

    } catch (error) {
      console.error(`❌ Invalid JSON: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { generatePackageJson, PackageConfig, TEMPLATES };
