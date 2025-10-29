// templates/header-gen.js (Bun script for Templater or CLI)
import { file } from 'bun';
import { randomBytes } from 'crypto';
import { YAML } from 'bun';

class HeaderGenerator {
  constructor() {
    this.config = null;
    this.schema = null;
  }

  async loadConfig() {
    if (!this.config) {
      try {
        const yamlContent = await file('bun.yaml').text();
        this.config = YAML.parse(yamlContent);
        this.schema = this.config.rules.header.schema;
      } catch (error) {
        console.error('Failed to load bun.yaml:', error.message);
        process.exit(1);
      }
    }
    return this.config;
  }

  generateHeader(params = {}) {
    const defaults = this.config.rules.header.defaults;
    const {
      scope = defaults.scope,
      type = defaults.type,
      variant = defaults.variant,
      id = this.generateID(scope, type),
      version = defaults.version,
      status = defaults.status,
      title = ''
    } = params;

    // Validate against schema
    this.validateSchema({ scope, type, variant, id, version, status });

    const readable = `[${scope}][${type}][${variant.toUpperCase()}][${id}][${version}][${status}]`;
    const grepable = `[${scope.toLowerCase()}-rules-${variant.toLowerCase() || 'base'}-${id.toLowerCase()}-${version.toLowerCase()}-${status.toLowerCase()}]`;

    return {
      header: readable,
      grepable: grepable,
      full: this.generateFullTemplate(title, readable, grepable),
      metadata: { scope, type, variant, id, version, status, title }
    };
  }

  generateID(scope, type) {
    const typeCode = type.substring(0, 3).toUpperCase();
    const randomNum = Date.now().toString().slice(-3);
    return `${scope}-${typeCode}-${randomNum}`;
  }

  validateSchema(params) {
    const { scope, type, variant, id, version, status } = params;

    if (!this.schema.scope.includes(scope)) {
      throw new Error(`Invalid scope: ${scope}. Must be one of: ${this.schema.scope.join(', ')}`);
    }

    if (!this.schema.type.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${this.schema.type.join(', ')}`);
    }

    if (variant && !this.schema.variant.includes(variant)) {
      throw new Error(`Invalid variant: ${variant}. Must be one of: ${this.schema.variant.join(', ')}`);
    }

    const idPattern = new RegExp(this.schema.id.pattern);
    if (!idPattern.test(id)) {
      throw new Error(`Invalid ID format: ${id}. Must match pattern: ${this.schema.id.pattern}`);
    }

    const versionPattern = new RegExp(this.schema.version.semver);
    if (!versionPattern.test(version)) {
      throw new Error(`Invalid version: ${version}. Must match pattern: ${this.schema.version.semver}`);
    }

    if (!this.schema.status.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${this.schema.status.join(', ')}`);
    }
  }

  generateFullTemplate(title, readable, grepable) {
    return `# ${title || 'New Rule'}

${readable}
# Grepable: ${grepable}

## Trigger
*Describe the trigger conditions for this rule*

## Action
*Describe the actions to take when triggered*

## Priority
${readable.includes('[REQUIRED]') ? 'REQUIRED' : 'STANDARD'}

## Validation
- [ ] Schema validated
- [ ] Grepable tag test passed
- [ ] Peer review completed

---
*Generated via Syndicate GOV Header Generator v3.0*
`;
  }

  parseArgs(args) {
    const params = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[++i];
        
        if (value && !value.startsWith('--')) {
          params[key] = value;
        } else {
          params[key] = true;
          i--; // Don't skip the next argument if it's another flag
        }
      }
    }
    
    return params;
  }
}

// CLI Usage
async function main() {
  const generator = new HeaderGenerator();
  await generator.loadConfig();

  const args = process.argv.slice(2);
  const params = generator.parseArgs(args);

  try {
    const result = generator.generateHeader(params);
    
    if (params.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (params.header) {
      console.log(result.header);
    } else if (params.grepable) {
      console.log(result.grepable);
    } else {
      console.log(result.full);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in other modules
export default HeaderGenerator;

// CLI execution
if (import.meta.main) {
  main();
}
