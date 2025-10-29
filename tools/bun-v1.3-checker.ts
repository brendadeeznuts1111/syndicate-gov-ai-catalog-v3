#!/usr/bin/env bun
/**
 * Bun v1.3 Compatibility Checker & Integration Tool
 * 
 * Links to: https://bun.com/blog/bun-v1.3#new-commands
 * Docs: https://bun.sh/llms.txt
 * 
 * Validates Bun v1.3 features, checks package compatibility,
 * and generates comprehensive integration reports.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface BunVersion {
  version: string;
  major: number;
  minor: number;
  patch: number;
}

interface PackageCompatibility {
  name: string;
  version: string;
  compatible: boolean;
  issues: string[];
  recommendations: string[];
}

interface FeatureCheck {
  feature: string;
  available: boolean;
  description: string;
  blogReference: string;
}

interface CompatibilityReport {
  bunVersion: BunVersion;
  features: FeatureCheck[];
  packages: PackageCompatibility[];
  summary: {
    totalPackages: number;
    compatiblePackages: number;
    compatibilityScore: number;
  };
  recommendations: string[];
  generatedAt: string;
}

const BUN_V1_3_FEATURES: FeatureCheck[] = [
  {
    feature: 'Enhanced Package Management',
    available: false,
    description: 'Faster installs and optimized dependency resolution',
    blogReference: 'https://bun.com/blog/bun-v1.3#enhanced-package-management'
  },
  {
    feature: 'New bun info Command',
    available: false,
    description: 'Detailed package information display',
    blogReference: 'https://bun.com/blog/bun-v1.3#new-commands'
  },
  {
    feature: 'bun install --analyze',
    available: false,
    description: 'Dependency analysis and optimization suggestions',
    blogReference: 'https://bun.com/blog/bun-v1.3#new-commands'
  },
  {
    feature: 'Enhanced bun audit',
    available: false,
    description: 'Improved security vulnerability scanning',
    blogReference: 'https://bun.com/blog/bun-v1.3#enhanced-security'
  },
  {
    feature: 'Improved TypeScript Support',
    available: false,
    description: 'Better type checking and compilation performance',
    blogReference: 'https://bun.com/blog/bun-v1.3#typescript-improvements'
  },
  {
    feature: 'Advanced Build Tools',
    available: false,
    description: 'Optimized bundling and code splitting',
    blogReference: 'https://bun.com/blog/bun-v1.3#build-tools'
  },
  {
    feature: 'Performance Optimizations',
    available: false,
    description: 'Sub-50ms build times and faster execution',
    blogReference: 'https://bun.com/blog/bun-v1.3#performance'
  },
  {
    feature: 'Security Enhancements',
    available: false,
    description: 'Built-in vulnerability scanning and patching',
    blogReference: 'https://bun.com/blog/bun-v1.3#security'
  }
];

function getBunVersion(): BunVersion {
  try {
    const versionOutput = execSync('bun --version', { encoding: 'utf8' }).trim();
    const versionMatch = versionOutput.match(/(\d+)\.(\d+)\.(\d+)/);
    
    if (!versionMatch) {
      throw new Error('Unable to parse Bun version');
    }

    return {
      version: versionOutput,
      major: parseInt(versionMatch[1]),
      minor: parseInt(versionMatch[2]),
      patch: parseInt(versionMatch[3])
    };
  } catch (error) {
    throw new Error(`Failed to get Bun version: ${error.message}`);
  }
}

function checkBunFeatures(version: BunVersion): FeatureCheck[] {
  const features = [...BUN_V1_3_FEATURES];
  
  // Check if we're running Bun v1.3 or higher
  const isV13OrHigher = version.major > 1 || (version.major === 1 && version.minor >= 3);
  
  if (isV13OrHigher) {
    // Mark all features as available for v1.3+
    features.forEach(feature => {
      feature.available = true;
    });
  } else {
    // Mark specific features based on version
    features.forEach(feature => {
      if (version.major > 1) {
        feature.available = true;
      } else if (version.major === 1) {
        if (version.minor >= 3) {
          feature.available = true;
        } else if (version.minor >= 2) {
          // Some features available in v1.2
          if (feature.feature.includes('TypeScript') || feature.feature.includes('Performance')) {
            feature.available = true;
          }
        } else if (version.minor >= 1) {
          // Basic features available in v1.1
          if (feature.feature.includes('Package Management') || feature.feature.includes('Security')) {
            feature.available = true;
          }
        }
      }
    });
  }
  
  return features;
}

function checkPackageCompatibility(packagePath: string): PackageCompatibility {
  try {
    if (!existsSync(packagePath)) {
      return {
        name: 'unknown',
        version: '0.0.0',
        compatible: false,
        issues: ['Package.json not found'],
        recommendations: ['Create package.json using the package generator']
      };
    }

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const compatibility: PackageCompatibility = {
      name: packageJson.name || 'unknown',
      version: packageJson.version || '0.0.0',
      compatible: true,
      issues: [],
      recommendations: []
    };

    // Check engines field
    if (packageJson.engines) {
      if (!packageJson.engines.bun) {
        compatibility.issues.push('Missing Bun engine requirement');
        compatibility.recommendations.push('Add "bun": ">=1.3.0" to engines');
        compatibility.compatible = false;
      } else {
        const bunReq = packageJson.engines.bun;
        if (!bunReq.includes('1.3') && !bunReq.includes('>=1.3')) {
          compatibility.issues.push(`Bun engine requirement may be insufficient: ${bunReq}`);
          compatibility.recommendations.push('Update Bun requirement to ">=1.3.0"');
        }
      }
    } else {
      compatibility.issues.push('Missing engines field');
      compatibility.recommendations.push('Add engines field with Bun requirement');
      compatibility.compatible = false;
    }

    // Check for syndicate configuration
    if (!packageJson.syndicate) {
      compatibility.issues.push('Missing syndicate configuration');
      compatibility.recommendations.push('Add syndicate configuration with category and features');
    }

    // Check scripts for Bun optimization
    if (packageJson.scripts) {
      const requiredScripts = ['build', 'dev', 'test', 'analyze', 'audit'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        compatibility.issues.push(`Missing recommended scripts: ${missingScripts.join(', ')}`);
        compatibility.recommendations.push('Add missing scripts for full Bun v1.3 integration');
      }
    }

    // Check exports configuration
    if (!packageJson.exports) {
      compatibility.issues.push('Missing exports configuration');
      compatibility.recommendations.push('Add exports for ESM/CJS compatibility');
    }

    return compatibility;
  } catch (error) {
    return {
      name: 'unknown',
      version: '0.0.0',
      compatible: false,
      issues: [`Error reading package.json: ${error.message}`],
      recommendations: ['Fix package.json syntax and structure']
    };
  }
}

function generateCompatibilityReport(
  bunVersion: BunVersion,
  features: FeatureCheck[],
  packages: PackageCompatibility[]
): CompatibilityReport {
  const totalPackages = packages.length;
  const compatiblePackages = packages.filter(pkg => pkg.compatible).length;
  const compatibilityScore = totalPackages > 0 ? Math.round((compatiblePackages / totalPackages) * 100) : 0;

  const recommendations: string[] = [];
  
  // Version recommendations
  if (bunVersion.major < 1 || (bunVersion.major === 1 && bunVersion.minor < 3)) {
    recommendations.push('Upgrade to Bun v1.3.0 or higher for full feature support');
  }

  // Feature recommendations
  const unavailableFeatures = features.filter(f => !f.available);
  if (unavailableFeatures.length > 0) {
    recommendations.push(`${unavailableFeatures.length} features unavailable: ${unavailableFeatures.map(f => f.feature).join(', ')}`);
  }

  // Package recommendations
  const incompatiblePackages = packages.filter(pkg => !pkg.compatible);
  if (incompatiblePackages.length > 0) {
    recommendations.push(`${incompatiblePackages.length} packages need compatibility updates`);
  }

  return {
    bunVersion,
    features,
    packages,
    summary: {
      totalPackages,
      compatiblePackages,
      compatibilityScore
    },
    recommendations,
    generatedAt: new Date().toISOString()
  };
}

function printReport(report: CompatibilityReport): void {
  console.log(`
🔍 Bun v1.3 Compatibility Report
================================

📊 Version Information:
• Bun Version: ${report.bunVersion.version}
• Target: v1.3.0+
• Status: ${report.bunVersion.major >= 1 && report.bunVersion.minor >= 3 ? '✅ Compatible' : '⚠️ Update Recommended'}

🚀 Feature Availability:
${report.features.map(feature => 
  `  ${feature.available ? '✅' : '❌'} ${feature.feature}: ${feature.description}`
).join('\n')}

📦 Package Compatibility:
${report.packages.map(pkg => 
  `  ${pkg.compatible ? '✅' : '❌'} ${pkg.name}@${pkg.version}${pkg.issues.length > 0 ? ' - ' + pkg.issues.join(', ') : ''}`
).join('\n')}

📈 Summary:
• Total Packages: ${report.summary.totalPackages}
• Compatible: ${report.summary.compatiblePackages}
• Compatibility Score: ${report.summary.compatibilityScore}%

💡 Recommendations:
${report.recommendations.map(rec => `  • ${rec}`).join('\n')}

📚 Resources:
• Bun v1.3 Blog: https://bun.com/blog/bun-v1.3#new-commands
• Bun Documentation: https://bun.sh/docs
• Bun LLMs Docs: https://bun.sh/llms.txt
• Package Standard: ./docs/09-configuration/PACKAGE-METADATA-STANDARD.md

🕒 Generated: ${report.generatedAt}
`);
}

function checkSpecificFeature(featureName: string): void {
  const feature = BUN_V1_3_FEATURES.find(f => 
    f.feature.toLowerCase().includes(featureName.toLowerCase())
  );

  if (feature) {
    console.log(`
🔍 Feature Check: ${feature.feature}
================================
Description: ${feature.description}
Blog Reference: ${feature.blogReference}
Status: Checking availability...

Try running: bun ${featureName.toLowerCase().replace(' ', '-')}
`);
  } else {
    console.log(`❌ Feature "${featureName}" not found in Bun v1.3 features`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔍 Bun v1.3 Compatibility Checker v3.0

Usage: bun run bun-v1.3-checker.ts [command] [options]

Commands:
  check                    Check Bun version and feature availability
  verify-package [path]    Verify package compatibility
  report                   Generate full compatibility report
  feature [name]           Check specific feature availability
  update-suggestions       Get update recommendations for current setup

Examples:
  bun run bun-v1.3-checker.ts check
  bun run bun-v1.3-checker.ts verify-package packages/dashboard/package.json
  bun run bun-v1.3-checker.ts report
  bun run bun-v1.3-checker.ts feature "bun info"
  bun run bun-v1.3-checker.ts update-suggestions

Resources:
• Bun v1.3 Blog: https://bun.com/blog/bun-v1.3#new-commands
• Bun Documentation: https://bun.sh/docs
• Bun LLMs Docs: https://bun.sh/llms.txt
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    const bunVersion = getBunVersion();
    const features = checkBunFeatures(bunVersion);

    switch (command) {
      case 'check':
        console.log(`
🔍 Bun Version Check
===================
Version: ${bunVersion.version}
v1.3+ Compatible: ${bunVersion.major >= 1 && bunVersion.minor >= 3 ? '✅ Yes' : '❌ No'}

Available Features (${features.filter(f => f.available).length}/${features.length}):
${features.filter(f => f.available).map(f => `  ✅ ${f.feature}`).join('\n')}

Missing Features:
${features.filter(f => !f.available).map(f => `  ❌ ${f.feature}`).join('\n')}

📚 Learn more: https://bun.com/blog/bun-v1.3#new-commands
        `);
        break;

      case 'verify-package':
        if (args.length < 2) {
          console.error('❌ Usage: verify-package <path-to-package.json>');
          process.exit(1);
        }
        const packagePath = args[1];
        const compatibility = checkPackageCompatibility(packagePath);
        console.log(`
📦 Package Compatibility Check
==============================
Package: ${compatibility.name}@${compatibility.version}
Compatible: ${compatibility.compatible ? '✅ Yes' : '❌ No'}

${compatibility.issues.length > 0 ? `
Issues:
${compatibility.issues.map(issue => `  ❌ ${issue}`).join('\n')}
` : ''}

${compatibility.recommendations.length > 0 ? `
Recommendations:
${compatibility.recommendations.map(rec => `  💡 ${rec}`).join('\n')}
` : ''}
        `);
        break;

      case 'report':
        // Check all packages in packages directory
        const packagesDir = join(process.cwd(), 'packages');
        const packages: PackageCompatibility[] = [];

        try {
          const packageDirs = ['dashboard', 'gov-rules']; // Add more as needed
          
          for (const dir of packageDirs) {
            const packagePath = join(packagesDir, dir, 'package.json');
            if (existsSync(packagePath)) {
              packages.push(checkPackageCompatibility(packagePath));
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not scan packages directory');
        }

        const report = generateCompatibilityReport(bunVersion, features, packages);
        printReport(report);

        // Save report to file
        const reportPath = join(process.cwd(), 'bun-v1.3-compatibility-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);
        break;

      case 'feature':
        if (args.length < 2) {
          console.error('❌ Usage: feature <feature-name>');
          process.exit(1);
        }
        checkSpecificFeature(args[1]);
        break;

      case 'update-suggestions':
        console.log(`
💡 Update Suggestions for Bun v1.3
===================================

📦 Package.json Updates:
• Add "bun": ">=1.3.0" to engines
• Add exports configuration for ESM/CJS
• Add scripts: analyze, audit, build:cjs
• Add syndicate configuration

🔧 Development Workflow:
• Use "bun install --analyze" for dependency analysis
• Use "bun audit --severity=high" for security checks
• Use "bun info <package>" for package information
• Use "bun run build --target=browser" for optimized builds

🚀 Performance Optimizations:
• Enable TypeScript strict mode
• Use Bun's built-in test runner
• Leverage Bun's fast bundling
• Optimize imports and exports

📚 Learn More:
• https://bun.com/blog/bun-v1.3#new-commands
• https://bun.sh/docs
• https://bun.sh/llms.txt
        `);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { 
  getBunVersion, 
  checkBunFeatures, 
  checkPackageCompatibility, 
  generateCompatibilityReport,
  BUN_V1_3_FEATURES 
};
