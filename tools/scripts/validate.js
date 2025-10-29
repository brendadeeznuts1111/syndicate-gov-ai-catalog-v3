// scripts/validate.js - Enhanced HEADER Validation
import { file } from 'bun';
import { YAML } from 'bun';

class HeaderValidator {
  constructor() {
    this.config = null;
    this.schema = null;
    this.errors = [];
    this.warnings = [];
  }

  async loadConfig() {
    if (!this.config) {
      try {
        const yamlContent = await file('bun.yaml').text();
        this.config = YAML.parse(yamlContent);
        this.schema = this.config.rules.header.schema;
      } catch (error) {
        throw new Error(`Failed to load bun.yaml: ${error.message}`);
      }
    }
  }

  async validateHeaders() {
    await this.loadConfig();
    
    console.log('🔍 Validating headers across repository...');
    
    // Find all markdown files using Bun.file
    const files = await this.findMarkdownFiles();

    let validCount = 0;
    let totalCount = files.length;

    for (const filePath of files) {
      const isValid = await this.validateFile(filePath);
      if (isValid) validCount++;
    }

    this.printSummary(validCount, totalCount);
    
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  async findMarkdownFiles() {
    const files = [];
    
    // Simple recursive file finder
    async function scanDirectory(dir, basePath = '') {
      const entries = await Array.fromAsync(new Bun.Glob('**/*').scan({
        cwd: dir,
        absolute: false
      }));
      
      for (const entry of entries) {
        if (entry.startsWith('node_modules') || 
            entry.startsWith('.git') || 
            entry.startsWith('dist')) {
          continue;
        }
        
        if (entry.endsWith('.md')) {
          files.push(entry);
        }
      }
    }
    
    await scanDirectory('.');
    return files;
  }

  async validateFile(filePath) {
    try {
      const content = await file(filePath).text();
      
      // Look for header in both single-line and multi-line formats
      let tags = [];
      
      // Try single-line format: [SCOPE][TYPE][VARIANT][ID][VERSION][STATUS]
      const singleLineMatch = content.match(/^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m);
      if (singleLineMatch) {
        tags = [singleLineMatch[1], singleLineMatch[2], singleLineMatch[3], singleLineMatch[4], singleLineMatch[5], singleLineMatch[6]];
      } else {
        // Try multi-line format
        const headerLines = content.split('\n').slice(0, 10);
        for (const line of headerLines) {
          const match = line.match(/^\[([^\]]+)\]/);
          if (match) {
            tags.push(match[1]);
          }
        }
      }
      
      if (tags.length === 0) {
        this.warnings.push(`⚠️  No header found in ${filePath}`);
        return false;
      }

      if (tags.length < 6) {
        this.errors.push(`❌ Incomplete header in ${filePath}: found ${tags.length} tags, expected 6`);
        return false;
      }

      const [scope, type, variant, id, version, status] = tags;

      // Validate each component
      const validation = {
        scope: this.validateScope(scope, filePath),
        type: this.validateType(type, filePath),
        variant: this.validateVariant(variant, filePath),
        id: this.validateID(id, filePath),
        version: this.validateVersion(version, filePath),
        status: this.validateStatus(status, filePath)
      };

      const isValid = Object.values(validation).every(v => v);
      
      if (isValid) {
        console.log(`✅ ${filePath}: ${scope}-${type} [${status}]`);
        return true;
      }

      return false;
    } catch (error) {
      this.errors.push(`❌ Error processing ${filePath}: ${error.message}`);
      return false;
    }
  }

  validateScope(scope, filePath) {
    if (!scope) {
      this.errors.push(`❌ Missing scope in ${filePath}`);
      return false;
    }

    if (!this.schema.scope.includes(scope)) {
      this.errors.push(`❌ Invalid scope "${scope}" in ${filePath}. Must be one of: ${this.schema.scope.join(', ')}`);
      return false;
    }

    return true;
  }

  validateType(type, filePath) {
    if (!type) {
      this.errors.push(`❌ Missing type in ${filePath}`);
      return false;
    }

    if (!this.schema.type.includes(type)) {
      this.errors.push(`❌ Invalid type "${type}" in ${filePath}. Must be one of: ${this.schema.type.join(', ')}`);
      return false;
    }

    return true;
  }

  validateVariant(variant, filePath) {
    if (variant && !this.schema.variant.includes(variant)) {
      this.errors.push(`❌ Invalid variant "${variant}" in ${filePath}. Must be one of: ${this.schema.variant.join(', ')}`);
      return false;
    }

    return true;
  }

  validateID(id, filePath) {
    if (!id) {
      this.errors.push(`❌ Missing ID in ${filePath}`);
      return false;
    }

    const idPattern = new RegExp(this.schema.id.pattern);
    if (!idPattern.test(id)) {
      this.errors.push(`❌ Invalid ID "${id}" in ${filePath}. Must match pattern: ${this.schema.id.pattern}`);
      return false;
    }

    return true;
  }

  validateVersion(version, filePath) {
    if (!version) {
      this.errors.push(`❌ Missing version in ${filePath}`);
      return false;
    }

    const versionPattern = new RegExp(this.schema.version.semver);
    if (!versionPattern.test(version)) {
      this.errors.push(`❌ Invalid version "${version}" in ${filePath}. Must match pattern: ${this.schema.version.semver}`);
      return false;
    }

    return true;
  }

  validateStatus(status, filePath) {
    if (!status) {
      this.errors.push(`❌ Missing status in ${filePath}`);
      return false;
    }

    if (!this.schema.status.includes(status)) {
      this.errors.push(`❌ Invalid status "${status}" in ${filePath}. Must be one of: ${this.schema.status.join(', ')}`);
      return false;
    }

    return true;
  }

  generateGrepable(scope, type, variant, id, version, status) {
    return `[${scope.toLowerCase()}-rules-${variant.toLowerCase() || 'base'}-${id.toLowerCase()}-${version.toLowerCase()}-${status.toLowerCase()}]`;
  }

  testGrepable(content, expectedGrepable) {
    return content.includes(expectedGrepable);
  }

  async buildGrepIndex() {
    console.log('📝 Building grep index...');
    
    const files = await this.findMarkdownFiles();
    const index = [];
    
    for (const filePath of files) {
      try {
        const content = await file(filePath).text();
        
        // Look for header in both single-line and multi-line formats
        let tags = [];
        
        // Try single-line format
        const singleLineMatch = content.match(/^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]*)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/m);
        if (singleLineMatch) {
          tags = [singleLineMatch[1], singleLineMatch[2], singleLineMatch[3], singleLineMatch[4], singleLineMatch[5], singleLineMatch[6]];
        } else {
          // Try multi-line format
          const headerLines = content.split('\n').slice(0, 10);
          for (const line of headerLines) {
            const match = line.match(/^\[([^\]]+)\]/);
            if (match) {
              tags.push(match[1]);
            }
          }
        }
        
        if (tags.length >= 6) {
          const [scope, type, variant, id, version, status] = tags;
          
          index.push({
            file: filePath,
            scope,
            type,
            variant,
            id,
            version,
            status,
            grepable: this.generateGrepable(scope, type, variant, id, version, status)
          });
        }
      } catch (error) {
        this.warnings.push(`⚠️  Could not index ${filePath}: ${error.message}`);
      }
    }

    // Write index file
    await Bun.write('.citadel/indexes/.tags.index', JSON.stringify(index, null, 2));
    console.log(`✅ Indexed ${index.length} files to .citadel/indexes/.tags.index`);
  }

  printSummary(validCount, totalCount) {
    console.log('\n📊 Validation Summary:');
    console.log(`   Total files: ${totalCount}`);
    console.log(`   Valid files: ${validCount}`);
    console.log(`   Invalid files: ${totalCount - validCount}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log('\n🟢 All headers valid & grepable!');
    }
  }
}

// CLI execution
async function main() {
  const validator = new HeaderValidator();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'headers':
        await validator.validateHeaders();
        break;
      case 'index':
        await validator.buildGrepIndex();
        break;
      case 'all':
        await validator.validateHeaders();
        await validator.buildGrepIndex();
        break;
      default:
        console.log('Usage: bun scripts/validate.js [headers|index|all]');
        console.log('  headers - Validate all headers');
        console.log('  index   - Build grep index');
        console.log('  all     - Validate headers and build index');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
