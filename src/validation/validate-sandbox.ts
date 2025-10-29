#!/usr/bin/env bun
// validate-sandbox.ts - Sandboxed header validation with node:vm
import { file, YAML, v5 as uuid5 } from 'bun';
import vm from 'node:vm';
import { performance } from 'perf_hooks';

interface SandboxResult {
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
  sandboxTime: number;
  processingTime: number;
  security: {
    validated: boolean;
    threats: string[];
  };
}

class SandboxValidator {
  private config: any;
  private startTime: number;
  private sandboxCount = 0;

  constructor() {
    this.startTime = performance.now();
  }

  async loadConfig(): Promise<void> {
    try {
      const configContent = await file('config/bun.yaml').text();
      this.config = YAML.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load bun.yaml: ${error.message}`);
    }
  }

  async validateSandbox(globPattern: string[] = ['examples/headers/*.sh']): Promise<SandboxResult[]> {
    console.log(`🛡️  Starting sandboxed header validation...`);
    
    const files: string[] = [];
    
    // Use Bun.Glob for each pattern
    for (const pattern of globPattern) {
      const matches = await Array.fromAsync(new Bun.Glob(pattern).scan({
        cwd: '.',
        absolute: true
      }));
      files.push(...matches);
    }
    
    const results: SandboxResult[] = [];
    let validCount = 0;

    for (const filePath of files) {
      const result = await this.validateFileInSandbox(filePath);
      results.push(result);
      
      if (result.valid) {
        validCount++;
        console.log(`🟢 ${result.file}: ${result.scope}-${result.type} [${result.status}] | Grep: ${result.grepTag} | Sandbox: ${result.sandboxTime.toFixed(2)}ms`);
      } else {
        console.error(`❌ ${result.file}: ${result.errors.join(', ')}`);
      }
    }

    const totalTime = performance.now() - this.startTime;
    const avgTime = totalTime / files.length;
    const avgSandboxTime = results.reduce((sum, r) => sum + r.sandboxTime, 0) / results.length;

    console.log(`\n📊 Sandbox Validation Summary:`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Valid files: ${validCount}`);
    console.log(`   Invalid files: ${files.length - validCount}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per file`);
    console.log(`   Average sandbox time: ${avgSandboxTime.toFixed(2)}ms per file`);
    console.log(`   Sandbox overhead: ${((avgSandboxTime / avgTime) * 100).toFixed(1)}%`);
    console.log(`   Performance: ${(1000 / avgTime).toFixed(0)} files/second`);
    console.log(`   Security threats detected: ${results.reduce((sum, r) => sum + r.security.threats.length, 0)}`);

    if (results.some(r => !r.valid)) {
      console.error(`\n❌ Sandbox validation failed with ${results.filter(r => !r.valid).length} errors`);
      process.exit(1);
    }

    console.log(`\n🎉 All ${validCount} headers validated securely in sandbox!`);
    return results;
  }

  private async validateFileInSandbox(filePath: string): Promise<SandboxResult> {
    const fileStartTime = performance.now();
    const result: SandboxResult = {
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
      sandboxTime: 0,
      processingTime: 0,
      security: {
        validated: false,
        threats: []
      }
    };

    try {
      const content = await file(filePath).text();
      const headerMatch = content.match(/\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m);

      if (!headerMatch) {
        result.errors.push('Missing/incomplete header');
        result.processingTime = performance.now() - fileStartTime;
        return result;
      }

      const [scope, type, variant, id, version, status] = 
        [headerMatch[1], headerMatch[2], headerMatch[3], headerMatch[4], headerMatch[5], headerMatch[6]];

      // Security scan before sandbox
      const securityScan = await this.performSecurityScan(content);
      result.security = securityScan;

      if (securityScan.threats.length > 0) {
        result.errors.push(`Security threats detected: ${securityScan.threats.join(', ')}`);
        result.processingTime = performance.now() - fileStartTime;
        return result;
      }

      // Run validation in sandbox
      const sandboxStartTime = performance.now();
      const sandboxResult = await this.runInSandbox(scope, type, variant, id, version, status, filePath);
      result.sandboxTime = performance.now() - sandboxStartTime;

      if (sandboxResult.errors.length > 0) {
        result.errors.push(...sandboxResult.errors);
      }

      // Set results
      result.scope = scope;
      result.type = type;
      result.variant = variant;
      result.id = id;
      result.version = version;
      result.status = status;
      result.grepTag = this.generateGrepTag(scope, type, variant, id, version, status);
      result.valid = result.errors.length === 0 && sandboxResult.valid;

      // Validate grepable tag
      if (!this.validateGrepTag(result.grepTag)) {
        result.errors.push('Grepable tag pattern mismatch');
        result.valid = false;
      }

    } catch (error) {
      result.errors.push(`Processing error: ${error.message}`);
    }

    result.processingTime = performance.now() - fileStartTime;
    return result;
  }

  private async performSecurityScan(content: string): Promise<{ validated: boolean; threats: string[] }> {
    const threats: string[] = [];
    
    // Check for dangerous patterns (more restrictive)
    const dangerousPatterns = [
      /eval\s*\(\s*['"]\$\{/gi,  // Only dangerous eval with variable expansion
      /exec\s*\(\s*['"]\$\{/gi,  // Only dangerous exec with variable expansion
      /system\s*\(\s*['"]\$\{/gi, // Only dangerous system with variable expansion
      /rm\s+-rf\s+\//gi,         // Only dangerous rm with absolute paths
      /curl\s+.*\|\s*(sh|bash|exec)/gi, // Only dangerous curl piped to shell
      /wget\s+.*\|\s*(sh|bash|exec)/gi  // Only dangerous wget piped to shell
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        threats.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check for suspicious imports (only if they're being used dangerously)
    const suspiciousImports = [
      /require\s*\(\s*['"]child_process['"]\s*\)\.exec/gi,
      /require\s*\(\s*['"]fs['"]\)\.unlink/gi,
      /import.*child_process.*exec/gi,
      /import.*fs.*unlink/gi
    ];

    for (const imp of suspiciousImports) {
      if (imp.test(content)) {
        threats.push(`Suspicious import detected: ${imp.source}`);
      }
    }

    return {
      validated: threats.length === 0,
      threats
    };
  }

  private async runInSandbox(scope: string, type: string, variant: string, id: string, version: string, status: string, filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const sandboxStartTime = performance.now();
    
    // Create secure sandbox context
    const sandbox = {
      // Only expose necessary validation functions
      config: this.config.rules.header.schema,
      errors: [] as string[],
      result: { valid: false },
      
      // Safe utility functions
      validateScope: (s: string) => {
        if (!sandbox.config.scope.includes(s)) {
          sandbox.errors.push(`Invalid scope '${s}'`);
        }
      },
      validateType: (t: string) => {
        if (!sandbox.config.type.includes(t)) {
          sandbox.errors.push(`Invalid type '${t}'`);
        }
      },
      validateVariant: (v: string) => {
        if (v && !sandbox.config.variant.includes(v)) {
          sandbox.errors.push(`Invalid variant '${v}'`);
        }
      },
      validateId: (i: string) => {
        if (!i.match(sandbox.config.id.pattern)) {
          sandbox.errors.push(`Malformed ID '${i}'`);
        }
      },
      validateVersion: (v: string) => {
        if (!v.match(sandbox.config.version.semver)) {
          sandbox.errors.push(`Invalid version '${v}'`);
        }
      },
      validateStatus: (s: string) => {
        if (!sandbox.config.status.includes(s)) {
          sandbox.errors.push(`Invalid status '${s}'`);
        }
      }
    };

    // Create validation script
    const validationScript = `
      (function() {
        try {
          validateScope('${scope}');
          validateType('${type}');
          validateVariant('${variant}');
          validateId('${id}');
          validateVersion('${version}');
          validateStatus('${status}');
          result.valid = errors.length === 0;
        } catch (error) {
          errors.push('Sandbox execution error: ' + error.message);
        }
        return { valid: result.valid, errors: errors };
      })();
    `;

    try {
      // Execute in sandbox with security constraints
      const script = new vm.Script(validationScript, {
        filename: 'sandbox-validation.js',
        lineOffset: 0,
        columnOffset: 0,
        displayErrors: true,
        timeout: 1000, // 1 second timeout
        breakOnSigint: false
      });

      // Run in isolated context
      const context = vm.createContext(sandbox, {
        name: `sandbox-${this.sandboxCount++}`,
        origin: 'file://',
        codeGeneration: { strings: false, wasm: false }
      });

      const validation = script.runInContext(context, {
        filename: 'sandbox-validation.js',
        lineOffset: 0,
        columnOffset: 0,
        displayErrors: true,
        timeout: 1000,
        breakOnSigint: false
      });

      return validation;
      
    } catch (error) {
      return {
        valid: false,
        errors: [`Sandbox execution failed: ${error.message}`]
      };
    } finally {
      const sandboxTime = performance.now() - sandboxStartTime;
      if (sandboxTime > 500) {
        console.warn(`⚠️  Slow sandbox execution: ${sandboxTime.toFixed(2)}ms for ${filePath}`);
      }
    }
  }

  private generateGrepTag(scope: string, type: string, variant: string, id: string, version: string, status: string): string {
    const v = variant || 'base';
    return `[${scope.toLowerCase()}-${type.toLowerCase()}-${v.toLowerCase()}-${id.toLowerCase()}-${version.toLowerCase()}-${status.toLowerCase()}]`;
  }

  private validateGrepTag(grepTag: string): boolean {
    const pattern = /^\[[a-z0-9.-]+\]$/;
    return pattern.test(grepTag);
  }

  async generateSecurityReport(results: SandboxResult[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        threatsDetected: results.reduce((sum, r) => sum + r.security.threats.length, 0),
        averageSandboxTime: results.reduce((sum, r) => sum + r.sandboxTime, 0) / results.length
      },
      security: {
        totalThreats: results.reduce((sum, r) => sum + r.security.threats.length, 0),
        threatTypes: this.categorizeThreats(results),
        filesWithThreats: results.filter(r => r.security.threats.length > 0).length
      },
      performance: {
        averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
        averageSandboxTime: results.reduce((sum, r) => sum + r.sandboxTime, 0) / results.length,
        sandboxOverhead: ((results.reduce((sum, r) => sum + r.sandboxTime, 0) / results.reduce((sum, r) => sum + r.processingTime, 0)) * 100)
      },
      threats: results.filter(r => r.security.threats.length > 0).map(r => ({
        file: r.file,
        threats: r.security.threats
      }))
    };

    await Bun.write('.citadel/sandbox-security-report.json', JSON.stringify(report, null, 2));
    console.log(`🛡️  Security report saved to .citadel/sandbox-security-report.json`);
  }

  private categorizeThreats(results: SandboxResult[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const result of results) {
      for (const threat of result.security.threats) {
        const category = threat.split(':')[0] || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
      }
    }
    
    return categories;
  }
}

// CLI interface
async function main() {
  const startTime = performance.now();
  
  try {
    const validator = new SandboxValidator();
    await validator.loadConfig();

    // Parse command line arguments
    const args = process.argv.slice(2);
    let globPattern: string[] = ['rules/*.sh'];
    
    const globIndex = args.indexOf('--glob');
    if (globIndex !== -1 && args[globIndex + 1]) {
      globPattern = [args[globIndex + 1]];
    }

    const reportIndex = args.indexOf('--security-report');
    const generateSecurityReport = reportIndex !== -1;

    // Run sandbox validation
    const results = await validator.validateSandbox(globPattern);

    // Generate security report if requested
    if (generateSecurityReport) {
      await validator.generateSecurityReport(results);
    }

    const totalTime = performance.now() - startTime;
    console.log(`\n⚡ Total execution time: ${totalTime.toFixed(2)}ms`);

  } catch (error) {
    console.error(`❌ Sandbox validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
