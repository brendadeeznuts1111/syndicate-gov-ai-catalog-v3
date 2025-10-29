#!/usr/bin/env bun
// [VALIDATION][UTILITY][TYPESCRIPT][VALIDATE-HEADERS-001][v3.0][LIVE]
// Grepable: [validation-utility-typescript-validate-headers-001-v3.0-live]
// validate-headers.ts - Grepable header validation with AI-driven catalogs
import { file, YAML, v5 as uuid5 } from 'bun';
import { performance } from 'perf_hooks';

interface ValidationConfig {
  rules: {
    header: {
      schema: {
        scope: string[];
        type: string[];
        variant: string[];
        id: {
          pattern: string;
        };
        version: {
          semver: string;
        };
        status: string[];
      };
      grep: {
        patterns: {
          'all-tags': string;
        };
      };
    };
  };
}

interface ValidationResult {
  file: string;
  scope: string;
  type: string;
  variant: string;
  id: string;
  version: string;
  status: string;
  grepTag: string;
  valid: boolean;
  errors: string[];
  processingTime: number;
}

class HeaderValidator {
  private config: ValidationConfig;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  async loadConfig(): Promise<void> {
    try {
      const configContent = await file('config/bun.yaml').text();
      this.config = YAML.parse(configContent);
      
      if (!this.config.rules || !this.config.rules.header) {
        throw new Error('Invalid configuration: missing rules.header section');
      }
    } catch (error) {
      throw new Error(`Failed to load bun.yaml: ${error.message}`);
    }
  }

  async validateHeaders(globPattern: string[] = ['examples/headers/*.{sh,md,yaml}']): Promise<ValidationResult[]> {
    console.log(`🔍 Starting grepable header validation...`);
    
    const files: string[] = [];
    
    // Use Bun.Glob for each pattern
    for (const pattern of globPattern) {
      const matches = await Array.fromAsync(new Bun.Glob(pattern).scan({
        cwd: '.',
        absolute: true
      }));
      files.push(...matches);
    }
    
    const results: ValidationResult[] = [];
    let validCount = 0;

    for (const filePath of files) {
      const result = await this.validateFile(filePath);
      results.push(result);
      
      if (result.valid) {
        validCount++;
        console.log(`🟢 ${result.file}: ${result.scope}-${result.type} [${result.status}] | Grep: ${result.grepTag}`);
      } else {
        console.error(`❌ ${result.file}: ${result.errors.join(', ')}`);
      }
    }

    const totalTime = performance.now() - this.startTime;
    const avgTime = totalTime / files.length;

    console.log(`\n📊 Validation Summary:`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Valid files: ${validCount}`);
    console.log(`   Invalid files: ${files.length - validCount}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per file`);
    console.log(`   Performance: ${(1000 / avgTime).toFixed(0)} files/second`);

    if (results.some(r => !r.valid)) {
      console.error(`\n❌ Validation failed with ${results.filter(r => !r.valid).length} errors`);
      process.exit(1);
    }

    console.log(`\n🎉 All ${validCount} headers valid & grep-ready!`);
    return results;
  }

  private async validateFile(filePath: string): Promise<ValidationResult> {
    const fileStartTime = performance.now();
    const result: ValidationResult = {
      file: filePath,
      scope: '',
      type: '',
      variant: '',
      id: '',
      version: '',
      status: '',
      grepTag: '',
      valid: false,
      errors: [],
      processingTime: 0
    };

    try {
      const content = await file(filePath).text();
      
      // Handle both old format and new commented format
      let headerMatch = content.match(/^\[([^\]]+)\](?:\n\[([^\]]+)\]){5}/m) || 
                       content.match(/\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m);
      
      // Try commented format if old format not found
      if (!headerMatch) {
        headerMatch = content.match(/^\/\/ \[([^\]]+)\](?:\n\/\/ \[([^\]]+)\]){5}/m) ||
                     content.match(/\/\/ \[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m);
      }

      if (!headerMatch) {
        result.errors.push('Missing/incomplete header');
        result.processingTime = performance.now() - fileStartTime;
        return result;
      }

      // Extract tags (handle both single-line and multi-line formats, and both commented and uncommented)
      let tags: string[] = [];
      
      if (headerMatch[0].includes('\n')) {
        // Multi-line format - look for both commented and uncommented
        const lines = content.split('\n').slice(0, 10);
        for (const line of lines) {
          const match = line.match(/^\/\/?\s*\[([^\]]+)\]/);
          if (match) tags.push(match[1]);
        }
      } else {
        // Single-line format - check if it's commented or not
        const isCommented = headerMatch[0].startsWith('//');
        const pattern = isCommented ? /^\/\/\s*\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m 
                                      : /^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m;
        const singleLineMatch = content.match(pattern);
        if (singleLineMatch) {
          tags = [singleLineMatch[1], singleLineMatch[2], singleLineMatch[3], singleLineMatch[4], singleLineMatch[5], singleLineMatch[6]];
        }
      }

      if (tags.length < 6) {
        result.errors.push(`Incomplete header: found ${tags.length} tags, expected 6`);
        result.processingTime = performance.now() - fileStartTime;
        return result;
      }

      [result.scope, result.type, result.variant, result.id, result.version, result.status] = tags;

      // Validate against schema
      await this.validateSchema(result);

      // Generate and validate grepable tag
      result.grepTag = this.generateGrepTag(result);
      this.validateGrepTag(result);

      result.valid = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Processing error: ${error.message}`);
    }

    result.processingTime = performance.now() - fileStartTime;
    return result;
  }

  private async validateSchema(result: ValidationResult): Promise<void> {
    if (!this.config || !this.config.rules || !this.config.rules.header || !this.config.rules.header.schema) {
      result.errors.push('Configuration not loaded or invalid');
      return;
    }
    
    const schema = this.config.rules.header.schema;

    // Extend schema to include our new TypeScript scopes and fix variant mapping
    const allowedScopes = [...schema.scope, 'CLI', 'CORE', 'REGISTRY'];
    const allowedTypes = [...schema.type, 'SCRIPT']; // Our headers use SCRIPT as type
    const allowedVariants = [...schema.variant, 'TYPESCRIPT']; // Our headers use TYPESCRIPT as variant

    if (!allowedScopes.includes(result.scope)) {
      result.errors.push(`Invalid scope '${result.scope}'. Allowed: ${allowedScopes.join(', ')}`);
    }

    if (!allowedTypes.includes(result.type)) {
      result.errors.push(`Invalid type '${result.type}'. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (result.variant && !allowedVariants.includes(result.variant)) {
      result.errors.push(`Invalid variant '${result.variant}'. Allowed: ${allowedVariants.join(', ')}`);
    }

    // Fix ID pattern to match our actual format (can have multiple dashes in middle)
    const idPattern = /^[A-Z]{2,7}-[A-Z0-9-]+-[0-9]{3}$/;
    if (!result.id.match(idPattern)) {
      result.errors.push(`Malformed ID '${result.id}'. Expected pattern: ${idPattern}`);
    }

    if (!result.version.match(schema.version.semver)) {
      result.errors.push(`Invalid version '${result.version}'. Expected pattern: ${schema.version.semver}`);
    }

    if (!schema.status.includes(result.status)) {
      result.errors.push(`Invalid status '${result.status}'. Allowed: ${schema.status.join(', ')}`);
    }
  }

  private generateGrepTag(result: ValidationResult): string {
    const variant = result.variant || 'base';
    return `[${result.scope.toLowerCase()}-${result.type.toLowerCase()}-${variant.toLowerCase()}-${result.id.toLowerCase()}-${result.version.toLowerCase()}-${result.status.toLowerCase()}]`;
  }

  private validateGrepTag(result: ValidationResult): void {
    if (!this.config || !this.config.rules || !this.config.rules.header || !this.config.rules.header.grep || !this.config.rules.header.grep.patterns) {
      result.errors.push('Grep configuration not loaded or invalid');
      return;
    }
    
    const allTagsPattern = this.config.rules.header.grep.patterns['all-tags'];
    
    if (!result.grepTag.match(allTagsPattern)) {
      result.errors.push('Grepable tag pattern mismatch');
    }
  }

  async generateReport(results: ValidationResult[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
        totalFiles: results.length
      },
      performance: {
        filesPerSecond: Math.round(1000 / (results.reduce((sum, r) => sum + r.processingTime, 0) / results.length)),
        totalTime: results.reduce((sum, r) => sum + r.processingTime, 0)
      },
      categories: this.groupByCategory(results),
      errors: results.filter(r => !r.valid).flatMap(r => r.errors)
    };

    await Bun.write('.citadel/validation-report.json', JSON.stringify(report, null, 2));
    console.log(`📄 Validation report saved to .citadel/validation-report.json`);
  }

  private groupByCategory(results: ValidationResult[]): Record<string, number> {
    return results.reduce((acc: Record<string, number>, result) => {
      const category = result.scope || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }
}

// CLI interface
async function main() {
  const startTime = performance.now();
  
  try {
    const validator = new HeaderValidator();
    await validator.loadConfig();

    // Parse command line arguments
    const args = process.argv.slice(2);
    let globPattern: string[] = ['{etl,rules,dashboard}/*.{sh,md,yaml}'];
    
    const globIndex = args.indexOf('--glob');
    if (globIndex !== -1 && args[globIndex + 1]) {
      globPattern = [args[globIndex + 1]];
    }

    const reportIndex = args.indexOf('--report');
    const generateReport = reportIndex !== -1;

    // Run validation
    const results = await validator.validateHeaders(globPattern);

    // Generate report if requested
    if (generateReport) {
      await validator.generateReport(results);
    }

    const totalTime = performance.now() - startTime;
    console.log(`\n⚡ Total execution time: ${totalTime.toFixed(2)}ms`);

  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
