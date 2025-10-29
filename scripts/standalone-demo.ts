#!/usr/bin/env bun
// [STANDALONE][DEMO][STANDALONE-DEMO-001][v3.0][LIVE]
// Grepable: [standalone-demo-standalone-demo-001-v3.0-live]

import { spawn } from 'bun';
import { writeFile } from 'fs/promises';

/**
 * Citadel Standalone Executable Demo
 * Demonstrates BUN_BE_BUN functionality for compiled executables
 */

console.log('📦 Citadel Standalone Executable Demo v3.0');
console.log('==========================================');

// Create a simple main application for demonstration
async function createDemoApp() {
  console.log('📝 Creating demo application...');
  
  const demoApp = `#!/usr/bin/env bun
// [DEMO][APP][DEMO-APP-001][v3.0][LIVE]

console.log('🏰 Citadel Demo Application');
console.log('============================');
console.log('Version: 3.0.0');
console.log('Platform:', process.platform);
console.log('Bun Version:', process.version);
console.log('Arguments:', process.argv.slice(2));

// Handle version flag
if (process.argv.includes('--version')) {
  console.log('Citadel Demo App v3.0.0');
  process.exit(0);
}

// Handle help flag
if (process.argv.includes('--help')) {
  console.log('Usage: citadel-app [options]');
  console.log('Options:');
  console.log('  --version    Show version information');
  console.log('  --help       Show this help message');
  console.log('  --status     Show application status');
  process.exit(0);
}

// Handle status flag
if (process.argv.includes('--status')) {
  console.log('Application Status: 🟢 Running');
  console.log('Memory Usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB');
  console.log('Uptime:', Math.round(process.uptime()) + 's');
  process.exit(0);
}

console.log('Hello from Citadel Demo Application!');
`;

  await writeFile('./src/main.ts', demoApp);
  console.log('✅ Demo application created');
}

// Build standalone executable
async function buildExecutable() {
  console.log('🔨 Building standalone executable...');
  
  try {
    const buildProcess = spawn({
      cmd: ['bun', 'build', '--compile', './src/main.ts', '--outfile', 'citadel-app'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    const stdout = await buildProcess.stdout.text();
    const stderr = await buildProcess.stderr.text();
    const exitCode = await buildProcess.exited;
    
    if (exitCode === 0) {
      console.log('✅ Standalone executable built successfully');
      
      // Make executable (on Unix systems)
      if (process.platform !== 'win32') {
        const chmodProcess = spawn({
          cmd: ['chmod', '+x', 'citadel-app'],
          stdout: 'pipe',
          stderr: 'pipe'
        });
        await chmodProcess.exited;
        console.log('✅ Executable permissions set');
      }
      
      return true;
    } else {
      console.error('❌ Build failed:', stderr);
      return false;
    }
  } catch (error) {
    console.error('❌ Build error:', error);
    return false;
  }
}

// Run the embedded application (default behavior)
async function runEmbeddedApp() {
  console.log('🚀 Running embedded application...');
  
  try {
    const runProcess = spawn({
      cmd: ['./citadel-app', '--version'],
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    const stdout = await runProcess.stdout.text();
    const stderr = await runProcess.stderr.text();
    const exitCode = await runProcess.exited;
    
    if (exitCode === 0) {
      console.log('✅ Embedded app output:', stdout.trim());
    } else {
      console.error('❌ Embedded app failed:', stderr);
    }
  } catch (error) {
    console.error('❌ Failed to run embedded app:', error);
  }
}

// Run Bun binary instead of embedded app (BUN_BE_BUN=1)
async function runBunBinary() {
  console.log('🔧 Running Bun binary instead of embedded app...');
  
  try {
    const runProcess = spawn({
      cmd: ['./citadel-app', '--version'],
      stdout: 'pipe',
      stderr: 'pipe',
      env: { ...process.env, BUN_BE_BUN: '1' }
    });
    
    const stdout = await runProcess.stdout.text();
    const stderr = await runProcess.stderr.text();
    const exitCode = await runProcess.exited;
    
    if (exitCode === 0) {
      console.log('✅ Bun binary output:', stdout.trim());
    } else {
      console.error('❌ Bun binary failed:', stderr);
    }
  } catch (error) {
    console.error('❌ Failed to run Bun binary:', error);
  }
}

// Compare executable sizes
async function showExecutableInfo() {
  console.log('📊 Executable Information:');
  
  try {
    const statResult = await spawn(['ls', '-lh', 'citadel-app'], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    if (statResult.exitCode === 0) {
      console.log('📦 File info:', statResult.stdout.toString().trim());
    }
    
    // Show file type
    const typeResult = await spawn(['file', 'citadel-app'], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    if (typeResult.exitCode === 0) {
      console.log('🔍 File type:', typeResult.stdout.toString().trim());
    }
  } catch (error) {
    console.log('⚠️ Could not get file information:', error);
  }
}

// Demonstrate different usage patterns
async function demonstrateUsage() {
  console.log('🎯 Demonstrating usage patterns...');
  
  console.log('\n1️⃣ Default behavior (embedded app):');
  await runEmbeddedApp();
  
  console.log('\n2️⃣ BUN_BE_BUN=1 behavior (Bun binary):');
  await runBunBinary();
  
  console.log('\n3️⃣ Other embedded app commands:');
  try {
    const helpResult = await spawn(['./citadel-app', '--help'], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    if (helpResult.exitCode === 0) {
      console.log('📖 Help output:');
      console.log(helpResult.stdout.toString());
    }
  } catch (error) {
    console.error('❌ Help command failed:', error);
  }
}

// Cleanup demo files
async function cleanup() {
  console.log('🧹 Cleaning up demo files...');
  
  try {
    await spawn(['rm', '-f', 'citadel-app', './src/main.ts']);
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup failed:', error);
  }
}

// Main demo execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      await createDemoApp();
      const buildSuccess = await buildExecutable();
      if (buildSuccess) {
        await showExecutableInfo();
      }
      break;
      
    case 'run-embedded':
      await runEmbeddedApp();
      break;
      
    case 'run-bun':
      await runBunBinary();
      break;
      
    case 'demo':
      await createDemoApp();
      const demoBuildSuccess = await buildExecutable();
      if (demoBuildSuccess) {
        await showExecutableInfo();
        await demonstrateUsage();
      }
      break;
      
    case 'cleanup':
      await cleanup();
      break;
      
    case 'full-demo':
      console.log('🚀 Running full standalone executable demo...\n');
      await createDemoApp();
      const fullDemoSuccess = await buildExecutable();
      if (fullDemoSuccess) {
        await showExecutableInfo();
        await demonstrateUsage();
        console.log('\n🎉 Full demo completed successfully!');
        console.log('💡 The executable "citadel-app" is ready for use');
        console.log('🔧 Try: BUN_BE_BUN=1 ./citadel-app --version');
      }
      break;
      
    default:
      console.log('📦 Citadel Standalone Executable Demo v3.0');
      console.log('');
      console.log('Usage: bun run scripts/standalone-demo.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  build         - Build standalone executable');
      console.log('  run-embedded  - Run embedded application');
      console.log('  run-bun       - Run Bun binary (BUN_BE_BUN=1)');
      console.log('  demo          - Build and demonstrate usage');
      console.log('  cleanup       - Remove demo files');
      console.log('  full-demo     - Complete demonstration');
      console.log('');
      console.log('BUN_BE_BUN Environment Variable:');
      console.log('  When set to 1, runs the Bun binary instead of');
      console.log('  the embedded application entry point.');
      console.log('');
      console.log('Example:');
      console.log('  # Build executable');
      console.log('  bun build --compile ./app.ts --outfile myapp');
      console.log('  # Run embedded app (default)');
      console.log('  ./myapp');
      console.log('  # Run Bun binary instead');
      console.log('  BUN_BE_BUN=1 ./myapp --version');
      break;
  }
}

// Execute if run directly
if (import.meta.main) {
  main().catch(console.error);
}

export { createDemoApp, buildExecutable, runEmbeddedApp, runBunBinary, demonstrateUsage };
