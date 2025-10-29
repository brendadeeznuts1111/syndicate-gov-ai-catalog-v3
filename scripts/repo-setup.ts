#!/usr/bin/env bun
// [GOV][REPO][SCRIPT][REPO-SETUP-001][v3.0][ACTIVE]
// Grepable: [gov-repo-script-repo-setup-001-v3.0-active]

import { spawn } from 'bun';
import { readFileSync } from 'fs';

/**
 * GitHub Repository Setup Script
 * Configures topics, labels, and protection rules for Syndicate GOV repos
 */

interface RepoConfig {
  name: string;
  description: string;
  topics: string[];
  isPrivate: boolean;
}

async function executeCommand(cmd: string[], options: { cwd?: string } = {}): Promise<{ stdout: string; stderr: string; success: boolean }> {
  try {
    const result = spawn({
      cmd,
      cwd: options.cwd || process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    const stdout = await result.stdout.text();
    const stderr = await result.stderr.text();
    const success = result.exitCode === 0;
    
    return { stdout, stderr, success };
  } catch (error) {
    return { stdout: '', stderr: String(error), success: false };
  }
}

async function getRepoConfig(): Promise<RepoConfig> {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const topicsContent = readFileSync('.github/topics.txt', 'utf-8');
  
  const topics = topicsContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .slice(0, 20); // GitHub limits to 20 topics
  
  return {
    name: packageJson.name || 'syndicate-gov-monorepo',
    description: packageJson.description || 'Syndicate GOV Monorepo with Header Validation',
    topics,
    isPrivate: false
  };
}

async function setupRepository(): Promise<boolean> {
  console.log('🚀 Setting up GitHub repository...');
  
  const config = await getRepoConfig();
  console.log(`📋 Repository: ${config.name}`);
  console.log(`📝 Description: ${config.description}`);
  console.log(`🏷️ Topics: ${config.topics.join(', ')}`);
  
  // Check if repository exists
  const repoCheck = await executeCommand(['gh', 'repo', 'view', '--json', 'name']);
  
  if (!repoCheck.success) {
    console.log('📝 Creating new repository...');
    const createCmd = ['gh', 'repo', 'create', config.name, 
      '--description', config.description,
      '--public',
      '--source=.',
      '--push'];
    
    const createResult = await executeCommand(createCmd);
    if (!createResult.success) {
      console.error('❌ Failed to create repository:', createResult.stderr);
      return false;
    }
    console.log('✅ Repository created successfully');
  } else {
    console.log('ℹ️ Repository already exists');
  }
  
  return true;
}

async function setupTopics(): Promise<boolean> {
  console.log('🏷️ Setting up repository topics...');
  
  const config = await getRepoConfig();
  
  // Add topics to repository
  for (const topic of config.topics) {
    const result = await executeCommand(['gh', 'repo', 'edit', '--add-topic', topic]);
    if (result.success) {
      console.log(`✅ Added topic: ${topic}`);
    } else {
      console.warn(`⚠️ Failed to add topic ${topic}:`, result.stderr);
    }
  }
  
  return true;
}

async function setupLabels(): Promise<boolean> {
  console.log('🏷️ Setting up repository labels...');
  
  try {
    const labelsConfig = JSON.parse(readFileSync('.github/labels.json', 'utf-8'));
    
    for (const label of labelsConfig.labels) {
      // Delete existing label if it exists
      await executeCommand(['gh', 'label', 'delete', label.name, '--yes'], { cwd: process.cwd() });
      
      // Create new label
      const createCmd = ['gh', 'label', 'create', label.name,
        '--color', label.color,
        '--description', label.description];
      
      const result = await executeCommand(createCmd);
      if (result.success) {
        console.log(`✅ Created label: ${label.name}`);
      } else {
        console.warn(`⚠️ Failed to create label ${label.name}:`, result.stderr);
      }
    }
    
    console.log('✅ Labels setup completed');
    return true;
  } catch (error) {
    console.error('❌ Failed to setup labels:', error);
    return false;
  }
}

async function setupBranchProtection(): Promise<boolean> {
  console.log('🛡️ Setting up branch protection rules...');
  
  try {
    const protectionConfig = readFileSync('.github/branch-protection.json', 'utf-8');
    
    // Apply branch protection using GitHub CLI
    const result = await executeCommand([
      'gh', 'api', 
      'repos/:owner/:repo/branches/main/protection',
      '--method', 'PUT',
      '--field', 'required_status_checks={"strict":true,"contexts":["ci/validation","ci/security"]}',
      '--field', 'enforce_admins=true',
      '--field', 'required_pull_request_reviews={"required_approving_review_count":1}',
      '--field', 'restrictions=null'
    ]);
    
    if (result.success) {
      console.log('✅ Branch protection rules applied');
      return true;
    } else {
      console.warn('⚠️ Failed to apply branch protection:', result.stderr);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to setup branch protection:', error);
    return false;
  }
}

async function generateSetupReport(results: { [key: string]: boolean }): Promise<void> {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(Boolean).length,
      failed: Object.values(results).filter(v => !v).length
    }
  };
  
  // Ensure .citadel directory exists
  await executeCommand(['mkdir', '-p', '.citadel']);
  
  const reportPath = '.citadel/repo-setup-report.json';
  await Bun.write(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Setup report saved to ${reportPath}`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  
  console.log('🚀 Syndicate GOV Repository Setup');
  console.log(`📋 Command: ${command || 'full setup'}`);
  
  const results: { [key: string]: boolean } = {};
  
  switch (command) {
    case 'labels':
      results.labels = await setupLabels();
      break;
      
    case 'topics':
      results.topics = await setupTopics();
      break;
      
    case 'protection':
      results.protection = await setupBranchProtection();
      break;
      
    default:
      // Full setup
      results.repository = await setupRepository();
      results.topics = await setupTopics();
      results.labels = await setupLabels();
      results.protection = await setupBranchProtection();
      break;
  }
  
  // Generate report
  await generateSetupReport(results);
  
  // Summary
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  if (passed === total) {
    console.log('🎉 Repository setup completed successfully!');
    process.exit(0);
  } else {
    console.log(`⚠️ Repository setup completed with ${total - passed} failures`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Repository setup failed:', error);
    process.exit(1);
  });
}
