#!/usr/bin/env bun
// Alias CLI - v3.0 Command Arsenal Implementation
import { generateAIEnhancedAlias, validateAlias } from '../src/ai-generator.js';
import SemanticQueryEngine from '../src/query-engine.js';

const queryEngine = new SemanticQueryEngine();

// CLI Commands
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  try {
    switch (command) {
      case 'generate':
        await handleGenerate(args);
        break;
      case 'validate':
        await handleValidate(args);
        break;
      case 'query':
        await handleQuery(args);
        break;
      case 'fuzzy':
        await handleFuzzy(args);
        break;
      case 'complex':
        await handleComplex(args);
        break;
      case 'search':
        await handleSearch(args);
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleGenerate(args: string[]) {
  const options = parseArgs(args, {
    scope: { type: 'string', required: true },
    type: { type: 'string', required: true },
    variant: { type: 'string', required: true }
  });
  
  const result = await generateAIEnhancedAlias({
    scope: options.scope,
    type: options.type,
    variant: options.variant,
    metadata: {
      priority: 'high',
      audience: 'developers',
      complexity: 'advanced'
    }
  });
  
  console.log(`Generated Alias: ${result.alias}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log('\nSuggestions:');
  result.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
}

async function handleValidate(args: string[]) {
  const options = parseArgs(args, {
    alias: { type: 'string', required: true },
    strict: { type: 'boolean', default: false },
    'ai-enhanced': { type: 'boolean', default: false }
  });
  
  const result = validateAlias(options.alias);
  
  if (result.valid) {
    console.log(`✅ Alias "${options.alias}" is valid`);
  } else {
    console.log(`❌ Alias "${options.alias}" is invalid:`);
    result.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
  
  if (options['ai-enhanced']) {
    const parsed = parseAlias(options.alias);
    const enhanced = await generateAIEnhancedAlias({
      scope: parsed.scope,
      type: parsed.type,
      variant: parsed.variant.split('/')[0],
      metadata: {
        priority: 'high',
        audience: 'developers',
        complexity: 'advanced'
      }
    });
    
    console.log(`\nAI-Optimized suggestion: ${enhanced.alias}`);
  }
}

async function handleQuery(args: string[]) {
  const options = parseArgs(args, {
    query: { type: 'string', required: true },
    semantic: { type: 'boolean', default: false },
    explain: { type: 'boolean', default: false }
  });
  
  const result = await queryEngine.semanticQuery(options.query, {
    semantic: options.semantic,
    explain: options.explain
  });
  
  console.log(`Found ${result.matches.length} matches (${result.queryTime.toFixed(2)}ms):`);
  result.matches.forEach(match => console.log(`  - ${match}`));
  
  if (result.explanation) {
    console.log(`\nExplanation: ${result.explanation}`);
  }
}

async function handleFuzzy(args: string[]) {
  const options = parseArgs(args, {
    query: { type: 'string', required: true },
    confidence: { type: 'number', default: 0.85 }
  });
  
  const result = await queryEngine.fuzzySearch(options.query, options.confidence);
  
  console.log(`Fuzzy matches for "${options.query}" (confidence ≥ ${options.confidence}):`);
  result.matches.forEach(match => console.log(`  - ${match}`));
  console.log(`\nQuery time: ${result.queryTime.toFixed(2)}ms`);
}

async function handleComplex(args: string[]) {
  const options = parseArgs(args, {
    pattern: { type: 'string', required: true },
    explain: { type: 'boolean', default: false }
  });
  
  const result = await queryEngine.complexQuery(options.pattern, {
    explain: options.explain
  });
  
  console.log(`Complex pattern matches for "${options.pattern}":`);
  result.matches.forEach(match => console.log(`  - ${match}`));
  
  if (result.explanation) {
    console.log(`\nExplanation: ${result.explanation}`);
  }
}

async function handleSearch(args: string[]) {
  const options = parseArgs(args, {
    query: { type: 'string', required: true },
    json: { type: 'boolean', default: false }
  });
  
  if (options.json) {
    const results = await queryEngine.searchAsJSON(options.query);
    console.log(JSON.stringify(results, null, 2));
  } else {
    const result = await queryEngine.semanticQuery(options.query);
    result.matches.forEach(match => console.log(match));
  }
}

function parseArgs(args: string[], schema: any): any {
  const options: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const definition = schema[key];
      
      if (!definition) continue;
      
      if (definition.type === 'boolean') {
        options[key] = true;
      } else {
        options[key] = args[++i];
      }
    } else {
      // Positional arguments - map to required fields
      const requiredFields = Object.keys(schema).filter(k => schema[k].required);
      if (requiredFields.length > 0) {
        const field = requiredFields.shift();
        options[field] = arg;
      }
    }
  }
  
  // Check required fields
  for (const [key, definition] of Object.entries(schema)) {
    if (definition.required && !options[key]) {
      throw new Error(`Missing required argument: --${key}`);
    }
  }
  
  return options;
}

function parseAlias(alias: string) {
  const pattern = /^([^#]+)#([^:]+):([^@]+)(@([^~]+))?(~(.+))?$/;
  const match = alias.match(pattern);
  
  if (!match) {
    throw new Error(`Invalid alias format: ${alias}`);
  }
  
  return {
    scope: match[1],
    type: match[2],
    variant: match[3],
    version: match[5],
    status: match[7]
  };
}

function showHelp() {
  console.log(`
🚀 v3.0 Alias CLI - Semantic Delimiter System

Usage: bun alias-cli.ts <command> [options]

Commands:
  generate --scope <scope> --type <type> --variant <variant>
    Generate AI-enhanced aliases
    
  validate --alias <alias> [--strict] [--ai-enhanced]
    Validate alias structure and suggest improvements
    
  query --query <pattern> [--semantic] [--explain]
    Perform semantic searches
    
  fuzzy --query <pattern> [--confidence <number>]
    Fuzzy search with confidence threshold
    
  complex --pattern <pattern> [--explain]
    Complex pattern matching
    
  search --query <pattern> [--json]
    Search aliases with JSON output

Examples:
  bun alias-cli.ts generate --scope GOV --type RULES --variant expanded
  bun alias-cli.ts query 'gov#rules:expanded@~active' --semantic --explain
  bun alias-cli.ts fuzzy 'rules@~active' --confidence 0.85
  bun alias-cli.ts search 'gov#rules' --json | jq '.[] | select(.variant == "expanded")'
`);
}

if (import.meta.main) {
  main();
}
