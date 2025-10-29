#!/usr/bin/env bun
/**
 * Repository Rituals v3.0 - AI-Powered GitHub Repository Management
 */

import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

interface RepositoryConfig {
  topics: {
    primary: string[];
    secondary: string[];
    technical: string[];
    compliance: string[];
    discovery: string[];
  };
  labels: {
    [key: string]: {
      name: string;
      color: string;
      description: string;
      category: string;
    };
  };
}

class RepositoryRituals {
  private config: RepositoryConfig;
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): RepositoryConfig {
    return {
      topics: {
        primary: ['syndicate-gov', 'bun-runtime', 'grepable-headers', 'ai-catalogs'],
        secondary: ['etl-pipeline', 'monorepo', 'typescript', 'yaml'],
        technical: ['regexp', 'nodejs', 'automation', 'validation'],
        compliance: ['gov-rules', 'audit-trail', 'enterprise-grade', 'security'],
        discovery: ['configuration-management', 'obsidian', 'ci-cd', 'performance']
      },
      labels: {
        'type:enhancement': {
          name: 'Type:Enhancement',
          color: '84b6eb',
          description: 'New feature or improvement',
          category: 'type'
        },
        'type:bug': {
          name: 'Type:Bug',
          color: 'd73a4a',
          description: 'Something isn\'t working',
          category: 'type'
        },
        'priority:critical': {
          name: 'Priority:Critical',
          color: 'b60205',
          description: 'Critical priority - immediate attention required',
          category: 'priority'
        },
        'priority:high': {
          name: 'Priority:High',
          color: 'ee0701',
          description: 'High priority - important to address soon',
          category: 'priority'
        },
        'scope:security': {
          name: 'Scope:Security',
          color: 'ee0701',
          description: 'Security related changes',
          category: 'scope'
        },
        'scope:performance': {
          name: 'Scope:Performance',
          color: '1d76db',
          description: 'Performance optimizations',
          category: 'scope'
        }
      }
    };
  }

  async analyzeRepository(): Promise<void> {
    console.log('🔍 Analyzing repository for AI optimization...');
    
    try {
      const codebaseAnalysis = await this.analyzeCodebase();
      const optimizedTopics = this.generateOptimizedTopics(codebaseAnalysis);
      const suggestedLabels = this.suggestLabels(codebaseAnalysis);
      
      console.log('📊 Repository Analysis Complete:');
      console.log(`   - Codebase Files: ${codebaseAnalysis.fileCount}`);
      console.log(`   - Languages: ${codebaseAnalysis.languages.join(', ')}`);
      console.log(`   - Suggested Topics: ${optimizedTopics.length}`);
      console.log(`   - Suggested Labels: ${suggestedLabels.length}`);
      
    } catch (error) {
      console.error('❌ Repository analysis failed:', error);
    }
  }

  private async analyzeCodebase(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const fileCount = parseInt(execSync('find . -type f -name "*.ts" -o -name "*.js" -o -name "*.yaml" -o -name "*.yml" -o -name "*.md" | wc -l', { 
        cwd: this.repoPath,
        encoding: 'utf8'
      }).trim());
      
      const typescriptFiles = execSync('find . -name "*.ts" | wc -l', { 
        cwd: this.repoPath,
        encoding: 'utf8'
      }).trim();
      
      const yamlFiles = execSync('find . -name "*.yaml" -o -name "*.yml" | wc -l', { 
        cwd: this.repoPath,
        encoding: 'utf8'
      }).trim();
      
      const languages = [];
      if (parseInt(typescriptFiles) > 0) languages.push('typescript');
      if (parseInt(yamlFiles) > 0) languages.push('yaml');
      
      return {
        fileCount,
        languages,
        analysisTime: Date.now() - startTime,
        hasPackageJson: await this.fileExists('package.json'),
        hasGitHubActions: await this.fileExists('.github/workflows'),
        hasTests: await this.fileExists('tests') || await this.fileExists('__tests__')
      };
    } catch (error) {
      return {
        fileCount: 0,
        languages: [],
        analysisTime: Date.now() - startTime,
        hasPackageJson: false,
        hasGitHubActions: false,
        hasTests: false
      };
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await readFile(join(this.repoPath, path));
      return true;
    } catch {
      return false;
    }
  }

  private generateOptimizedTopics(analysis: any): string[] {
    const topics = [...this.config.topics.primary];
    
    if (analysis.languages.includes('typescript')) {
      topics.push('typescript', 'typed');
    }
    
    if (analysis.hasGitHubActions) {
      topics.push('github-actions', 'ci-cd', 'automation');
    }
    
    if (analysis.hasTests) {
      topics.push('testing', 'unit-tests');
    }
    
    if (analysis.hasPackageJson) {
      topics.push('package-manager', 'npm', 'bun');
    }
    
    return [...new Set(topics)];
  }

  private suggestLabels(analysis: any): string[] {
    const labels = ['type:enhancement', 'type:bug', 'type:documentation'];
    
    if (analysis.languages.includes('typescript')) {
      labels.push('scope:typescript');
    }
    
    if (analysis.hasTests) {
      labels.push('scope:testing');
    }
    
    if (analysis.hasGitHubActions) {
      labels.push('scope:ci-cd');
    }
    
    return labels;
  }

  async setupTopics(): Promise<void> {
    console.log('🏷️ Setting up optimized GitHub topics...');
    
    const analysis = await this.analyzeCodebase();
    const optimizedTopics = this.generateOptimizedTopics(analysis);
    
    const topicsPath = join(this.repoPath, '.github', 'topics.txt');
    const topicsContent = `# AI-Optimized GitHub Topics for Syndicate GO v3.0
# Generated by Repository Rituals AI Analysis
${optimizedTopics.join('\n')}
`;
    
    await writeFile(topicsPath, topicsContent);
    console.log(`✅ Topics configured: ${optimizedTopics.length} topics optimized`);
  }

  async setupLabels(): Promise<void> {
    console.log('🏷️ Setting up intelligent GitHub labels...');
    
    const labelsPath = join(this.repoPath, '.github', 'labels.yml');
    const labelsConfig = {
      labels: Object.values(this.config.labels)
    };
    
    await writeFile(labelsPath, this.toYaml(labelsConfig));
    console.log(`✅ Labels configured: ${Object.keys(this.config.labels).length} labels created`);
  }

  private toYaml(obj: any): string {
    let yaml = '';
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${key}:\n`;
        for (const [subKey, subValue] of Object.entries(value as any)) {
          yaml += `  ${subKey}: "${subValue}"\n`;
        }
      } else if (Array.isArray(value)) {
        yaml += `${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `  - name: "${item.name}"\n`;
            yaml += `    color: "${item.color}"\n`;
            yaml += `    description: "${item.description}"\n`;
            yaml += `    category: "${item.category}"\n`;
          }
        }
      }
    }
    return yaml;
  }

  async runFullSetup(): Promise<void> {
    console.log('🚀 Starting Repository Rituals v3.0 full setup...');
    const startTime = Date.now();
    
    try {
      await this.analyzeRepository();
      await this.setupTopics();
      await this.setupLabels();
      
      const totalTime = Date.now() - startTime;
      
      console.log('🎉 Repository Rituals setup completed successfully!');
      console.log('📊 Setup Performance:');
      console.log(`   - Total Time: ${totalTime}ms`);
      console.log(`   - Topics Optimized: ${Object.values(this.config.topics).flat().length}`);
      console.log(`   - Labels Created: ${Object.keys(this.config.labels).length}`);
      
    } catch (error) {
      console.error('❌ Repository Rituals setup failed:', error);
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const rituals = new RepositoryRituals();
  
  switch (command) {
    case 'analyze':
      await rituals.analyzeRepository();
      break;
    case 'topics':
      await rituals.setupTopics();
      break;
    case 'labels':
      await rituals.setupLabels();
      break;
    case 'full':
    case 'setup':
      await rituals.runFullSetup();
      break;
    default:
      console.log(`
🌌 Repository Rituals v3.0 - AI-Powered GitHub Management

Usage: bun repo-rituals <command>

Commands:
  analyze       Analyze repository for AI optimization
  topics        Setup optimized GitHub topics
  labels        Setup intelligent labels system
  full/setup    Run complete repository rituals setup

Examples:
  bun repo-rituals analyze
  bun repo-rituals full
      `);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { RepositoryRituals };
