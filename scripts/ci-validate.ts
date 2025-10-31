#!/usr/bin/env bun
// scripts/ci-validate.ts - CI-powered schema sentinel + Bun 1.3 hooks
import { file } from 'bun';
import { performance } from 'perf_hooks';
// Native Bun.YAML support (Bun v1.3+)

interface CIValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  processingTime: number;
}

class CIValidator {
  private startTime: number;
  private config: any;
  private results: CIValidationResult[];

  constructor() {
    this.startTime = performance.now();
    this.results = [];
  }

  async loadConfig(): Promise<void> {
    try {
      const configContent = await file('config/bun.yaml').text();
      this.config = Bun.YAML.parse(configContent);
      
      if (!this.config.rules || !this.config.rules.header) {
        throw new Error('Invalid configuration: missing rules.header section');
      }
    } catch (error) {
      throw new Error(`Failed to load bun.yaml: ${error.message}`);
    }
  }

  async validateAll(): Promise<void> {
    console.log('🔍 CI HEADER Validation Starting...');
    
    // Load configuration
    await this.loadConfig();
    
    // Find files using Bun's built-in glob
    const files = await this.findFiles();
    console.log(`📂 Found ${files.length} files to validate`);

    let validCount = 0;
    let errorCount = 0;

    // Validate each file
    for (const filePath of files) {
      const result = await this.validateFile(filePath);
      this.results.push(result);
      
      if (result.valid) {
        validCount++;
        console.log(`🟢 ${this.relativePath(filePath)}: Validated in ${result.processingTime.toFixed(2)}ms`);
      } else {
        errorCount++;
        console.error(`❌ ${this.relativePath(filePath)}: ${result.errors.join(', ')}`);
      }
    }

    // Generate summary
    const totalTime = performance.now() - this.startTime;
    const avgTime = totalTime / files.length;

    console.log('\n📊 CI Validation Summary:');
    console.log(`   Total files: ${files.length}`);
    console.log(`   Valid files: ${validCount}`);
    console.log(`   Invalid files: ${errorCount}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per file`);
    console.log(`   Performance: ${(1000 / avgTime).toFixed(0)} files/second`);

    // Save detailed report
    await this.saveReport();

    // Exit with error code if any files failed
    if (errorCount > 0) {
      console.error(`\n❌ CI Validation failed with ${errorCount} errors`);
      process.exit(1);
    }

    console.log(`\n🎉 CI: All ${validCount} files HEADER-compliant & grep-ready!`);
  }

  private async findFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.sh', 
      'examples/**/*.sh',
      'examples/**/*.yaml',
      'config/**/*.yaml'
    ];

    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      try {
        // Use proper find command for glob patterns
        const findPattern = pattern.replace('**/', '*').replace('*', '.*');
        const cmd = Bun.$`find . -path "./${pattern}" -type f`.text();
        const files = cmd.trim().split('\n').filter(f => f.length > 0 && f !== '.');
        allFiles.push(...files.map(f => f.replace('./', '')));
      } catch (error) {
        // Try alternative approach with find
        try {
          const extension = pattern.split('.').pop();
          const baseDir = pattern.split('/')[0];
          const cmd = Bun.$`find ./${baseDir} -name "*.${extension}" -type f`.text();
          const files = cmd.trim().split('\n').filter(f => f.length > 0 && f !== '.');
          allFiles.push(...files.map(f => f.replace('./', '')));
        } catch (altError) {
          console.warn(`Warning: Could not find files for pattern ${pattern}`);
        }
      }
    }

    // Filter out ignored directories
    return allFiles.filter(file => 
      !file.includes('node_modules') && 
      !file.includes('dist') && 
      !file.includes('.git') &&
      !file.includes('docs')
    ).map(file => `${file}`);
  }

  private async validateFile(filePath: string): Promise<CIValidationResult> {
    const fileStartTime = performance.now();
    const result: CIValidationResult = {
      file: filePath,
      valid: false,
      errors: [],
      processingTime: 0
    };

    try {
      const content = await file(filePath).text();
      
      // Handle different file types
      if (filePath.endsWith('.ts')) {
        await this.validateTypeScriptFile(content, result);
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        await this.validateYamlFile(content, result);
      } else if (filePath.endsWith('.sh')) {
        await this.validateShellFile(content, result);
      }

      result.valid = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Processing error: ${error.message}`);
    }

    result.processingTime = performance.now() - fileStartTime;
    return result;
  }

  private async validateTypeScriptFile(content: string, result: CIValidationResult): Promise<void> {
    // Look for commented HEADER in TypeScript files
    const headerMatch = content.match(/^\/\/ \[([^\]]+)\](?:\n\/\/ \[([^\]]+)\]){5}/m);
    
    if (!headerMatch) {
      result.errors.push('Missing commented HEADER metadata');
      return;
    }

    const lines = content.split('\n').slice(0, 10);
    const tags: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\/\/\s*\[([^\]]+)\]/);
      if (match) tags.push(match[1]);
    }

    if (tags.length < 6) {
      result.errors.push(`Incomplete HEADER: found ${tags.length} tags, expected 6`);
      return;
    }

    await this.validateHeaderTags(tags, result);
  }

  private async validateYamlFile(content: string, result: CIValidationResult): Promise<void> {
    try {
      // Parse YAML and validate header structure
      const yamlContent = Bun.YAML.parse(content);
      
      if (!yamlContent.scope || !yamlContent.type || !yamlContent.id) {
        result.errors.push('Missing required YAML HEADER fields (scope, type, id)');
        return;
      }

      const tags = [yamlContent.scope, yamlContent.type, yamlContent.variant || 'YAML', yamlContent.id, yamlContent.version || 'v1.0', yamlContent.status || 'LIVE'];
      await this.validateHeaderTags(tags, result);
      
    } catch (error) {
      result.errors.push(`Invalid YAML format: ${error.message}`);
    }
  }

  private async validateShellFile(content: string, result: CIValidationResult): Promise<void> {
    // Look for HEADER in shell files
    const headerMatch = content.match(/^\[([^\]]+)\](?:\n\[([^\]]+)\]){5}/m);
    
    if (!headerMatch) {
      result.errors.push('Missing HEADER metadata');
      return;
    }

    const lines = content.split('\n').slice(0, 6);
    const tags: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\[([^\]]+)\]/);
      if (match) tags.push(match[1]);
    }

    if (tags.length < 6) {
      result.errors.push(`Incomplete HEADER: found ${tags.length} tags, expected 6`);
      return;
    }

    await this.validateHeaderTags(tags, result);
  }

  private async validateHeaderTags(tags: string[], result: CIValidationResult): Promise<void> {
    const schema = this.config.rules.header.schema;
    
    // Extend schema for CI validation
    const allowedScopes = [...schema.scope, 'CLI', 'CORE', 'REGISTRY', 'DEMO'];
    const allowedTypes = [...schema.type, 'SCRIPT', 'TYPESCRIPT'];
    const allowedVariants = [...schema.variant, 'TYPESCRIPT', 'YAML'];

    // Validate scope
    if (!allowedScopes.includes(tags[0])) {
      result.errors.push(`Invalid scope '${tags[0]}'. Allowed: ${allowedScopes.join(', ')}`);
    }

    // Validate type
    if (!allowedTypes.includes(tags[1])) {
      result.errors.push(`Invalid type '${tags[1]}'. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Validate variant
    if (tags[2] && !allowedVariants.includes(tags[2])) {
      result.errors.push(`Invalid variant '${tags[2]}'. Allowed: ${allowedVariants.join(', ')}`);
    }

    // Validate ID pattern
    const idPattern = /^[A-Z]{2,7}-[A-Z0-9-]+-[0-9]{3}$/;
    if (!tags[3].match(idPattern)) {
      result.errors.push(`Malformed ID '${tags[3]}'. Expected pattern: ${idPattern}`);
    }

    // Validate version
    if (!tags[4].match(schema.version.semver)) {
      result.errors.push(`Invalid version '${tags[4]}'. Expected pattern: ${schema.version.semver}`);
    }

    // Validate status
    if (!schema.status.includes(tags[5])) {
      result.errors.push(`Invalid status '${tags[5]}'. Allowed: ${schema.status.join(', ')}`);
    }

    // Generate and validate grepable tag
    const grepableTag = this.generateGrepableTag(tags);
    if (!grepableTag.match(/^\[[a-z0-9.-]+\]$/)) {
      result.errors.push(`Invalid grepable tag format: ${grepableTag}`);
    }
  }

  private generateGrepableTag(tags: string[]): string {
    const variant = tags[2] || 'base';
    return `[${tags[0].toLowerCase()}-${tags[1].toLowerCase()}-${variant.toLowerCase()}-${tags[3].toLowerCase()}-${tags[4].toLowerCase()}-${tags[5].toLowerCase()}]`;
  }

  private relativePath(filePath: string): string {
    return filePath;
  }

  private async saveReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        valid: this.results.filter(r => r.valid).length,
        invalid: this.results.filter(r => !r.valid).length,
        averageTime: this.results.reduce((sum, r) => sum + r.processingTime, 0) / this.results.length
      },
      performance: {
        filesPerSecond: Math.round(1000 / (this.results.reduce((sum, r) => sum + r.processingTime, 0) / this.results.length)),
        totalTime: this.results.reduce((sum, r) => sum + r.processingTime, 0)
      },
      results: this.results,
      errors: this.results.filter(r => !r.valid).flatMap(r => r.errors)
    };

    // Ensure .citadel directory exists using mkdir command
    try {
      await Bun.$`mkdir -p .citadel`.quiet();
    } catch (error) {
      // Directory might already exist
    }
    
    await Bun.write('.citadel/ci-validation-report.json', JSON.stringify(report, null, 2));
    console.log('📄 CI validation report saved to .citadel/ci-validation-report.json');
  }
}

// Main execution
async function main() {
  try {
    const validator = new CIValidator();
    await validator.validateAll();
  } catch (error) {
    console.error(`❌ CI validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
