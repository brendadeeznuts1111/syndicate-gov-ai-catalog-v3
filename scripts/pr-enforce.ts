#!/usr/bin/env bun
// scripts/pr-enforce.js - PR enforcement automation for GIT-PR-001
import { execSync } from 'child_process';
import { file } from 'bun';

interface PREnforcementResult {
  branchName: string;
  compliant: boolean;
  violations: string[];
  suggestions: string[];
}

class PREnforcer {
  private violations: string[] = [];
  private suggestions: string[] = [];

  async enforcePR(prType: string = 'HEADER-LOGIC'): Promise<PREnforcementResult> {
    console.log(`🚀 Running PR enforcement for ${prType}...`);
    
    // Get current branch info
    const currentBranch = this.getCurrentBranch();
    const baseBranch = this.getBaseBranch();
    
    console.log(`📋 Current branch: ${currentBranch}`);
    console.log(`📋 Base branch: ${baseBranch}`);

    // Run all enforcement checks
    await this.checkHeaderCompliance();
    await this.checkGrepableTags();
    await this.checkSchemaValidation();
    await this.checkVersionConsistency();
    await this.checkSecurityCompliance();

    const result: PREnforcementResult = {
      branchName: currentBranch,
      compliant: this.violations.length === 0,
      violations: this.violations,
      suggestions: this.suggestions
    };

    // Generate report
    await this.generatePRReport(result);

    // Exit with error code if not compliant
    if (!result.compliant) {
      console.error('\n❌ PR enforcement failed with violations:');
      result.violations.forEach(violation => console.error(`   - ${violation}`));
      
      console.log('\n💡 Suggestions:');
      result.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
      
      process.exit(1);
    }

    console.log('\n✅ PR enforcement passed - Ready for merge!');
    return result;
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      throw new Error('Failed to get current branch');
    }
  }

  private getBaseBranch(): string {
    try {
      // Try to get the base branch from git configuration
      const mainBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD | sed \'s@^refs/remotes/origin/@@\'', { encoding: 'utf8' }).trim();
      return mainBranch || 'main';
    } catch (error) {
      return 'main';
    }
  }

  private async checkHeaderCompliance(): Promise<void> {
    console.log('🔍 Checking HEADER compliance...');
    
    try {
      // Run header validation
      execSync('bun run ci:validate', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ HEADER compliance check passed');
    } catch (error) {
      this.violations.push('HEADER validation failed - Missing or invalid headers in some files');
      this.suggestions.push('Run "bun run ci:validate" locally to fix header issues');
      this.suggestions.push('Ensure all files have proper [SCOPE][TYPE][VARIANT][ID][VERSION][STATUS] headers');
    }
  }

  private async checkGrepableTags(): Promise<void> {
    console.log('🏷️ Checking grepable tags...');
    
    try {
      // Count grepable tags
      const result = execSync('bun run grep:tags | rg -c "\\[" || echo "0"', { encoding: 'utf8' }).trim();
      const tagCount = parseInt(result);
      
      if (tagCount < 5) {
        this.violations.push(`Insufficient grepable tags found: ${tagCount} (minimum: 5)`);
        this.suggestions.push('Add grepable headers to more files');
        this.suggestions.push('Use "bun run header:generate" to create compliant headers');
      } else {
        console.log(`✅ Found ${tagCount} grepable tags`);
      }
    } catch (error) {
      this.violations.push('Failed to count grepable tags');
      this.suggestions.push('Check ripgrep installation and patterns');
    }
  }

  private async checkSchemaValidation(): Promise<void> {
    console.log('📋 Checking schema validation...');
    
    try {
      // Validate against bun.yaml schema
      execSync('bun run citadel pm:version:validate', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Schema validation passed');
    } catch (error) {
      this.violations.push('Schema validation failed - Version or format issues detected');
      this.suggestions.push('Check package.json version format');
      this.suggestions.push('Ensure catalog versions follow semver patterns');
    }
  }

  private async checkVersionConsistency(): Promise<void> {
    console.log('🔢 Checking version consistency...');
    
    try {
      // Check if version is properly bumped
      const packageJson = await file('package.json').json();
      const version = packageJson.version;
      
      if (!version || !version.match(/^\d+\.\d+\.\d+$/)) {
        this.violations.push(`Invalid package version: ${version}`);
        this.suggestions.push('Update package.json with valid semver version');
        this.suggestions.push('Use "bun run citadel pm:version patch/minor/major" to bump version');
      } else {
        console.log(`✅ Package version: ${version}`);
      }
    } catch (error) {
      this.violations.push('Failed to read package.json version');
      this.suggestions.push('Ensure package.json exists and is valid');
    }
  }

  private async checkSecurityCompliance(): Promise<void> {
    console.log('🛡️ Checking security compliance...');
    
    try {
      // Run security validation
      execSync('bun run ci:security', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Security compliance check passed');
    } catch (error) {
      this.violations.push('Security validation failed - Potential security issues detected');
      this.suggestions.push('Run "bun run validate:sandbox" to identify security issues');
      this.suggestions.push('Review and fix any security violations');
    }
  }

  private async generatePRReport(result: PREnforcementResult): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      branch: result.branchName,
      compliant: result.compliant,
      violations: result.violations,
      suggestions: result.suggestions,
      summary: {
        totalViolations: result.violations.length,
        totalSuggestions: result.suggestions.length,
        status: result.compliant ? 'READY_FOR_MERGE' : 'NEEDS_FIXES'
      }
    };

    // Ensure .citadel directory exists
    await Bun.mkdir('.citadel', { recursive: true });
    await Bun.write('.citadel/pr-enforcement-report.json', JSON.stringify(report, null, 2));
    console.log('📄 PR enforcement report saved to .citadel/pr-enforcement-report.json');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const prType = args[0] || 'HEADER-LOGIC';
  
  try {
    const enforcer = new PREnforcer();
    await enforcer.enforcePR(prType);
  } catch (error) {
    console.error(`❌ PR enforcement failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
