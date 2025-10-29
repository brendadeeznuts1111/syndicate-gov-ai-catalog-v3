#!/usr/bin/env bun
// scripts/gen-openapi-schemas.ts - Enterprise-hardened AI schema generator
import { file, YAML } from 'bun';
import { readdir } from 'fs/promises';
import { createHash } from 'crypto';

interface ZodSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: any[];
}

interface OpenAPISchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: any[];
  'x-ai-generated'?: boolean;
  'x-source-handler'?: string;
  'x-generated-at'?: string;
  'x-zod-raw'?: string;
  'x-ai-confidence'?: number;
  'x-last-validated'?: string;
}

class AISchemaGenerator {
  private zodTypeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'object',
    'array': 'array',
    'date': 'string',
    'uuid': 'string'
  };

  async extractZodSchemas(handlerPath: string): Promise<Record<string, ZodSchema>> {
    const schemas: Record<string, ZodSchema> = {};
    
    try {
      const code = await file(handlerPath).text();
      
      // Extract Zod schema definitions
      const schemaMatches = code.matchAll(/const\s+(\w+Schema)\s*=\s*z\.object\({([^}]+)}\)/gs);
      
      for (const match of schemaMatches) {
        const schemaName = match[1];
        const schemaBody = match[2];
        
        schemas[schemaName] = this.parseZodObject(schemaBody);
      }
      
      // Extract Response type definitions
      const responseMatches = code.matchAll(/type\s+(\w+Response)\s*=\s*z\.infer<typeof\s+(\w+Schema)>;/gs);
      
      for (const match of responseMatches) {
        const typeName = match[1];
        const schemaName = match[2];
        
        if (schemas[schemaName]) {
          schemas[typeName] = { ...schemas[schemaName] };
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not extract schemas from ${handlerPath}: ${error.message}`);
    }
    
    return schemas;
  }

  parseZodObject(zodBody: string): ZodSchema {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    // Parse individual fields
    const fieldMatches = zodBody.matchAll(/(\w+):\s*z\.(\w+)\([^)]*\)(?:\s*\.optional\(\))?/gs);
    
    for (const match of fieldMatches) {
      const fieldName = match[1];
      const zodType = match[2];
      const isOptional = match[0].includes('.optional()');
      
      if (!isOptional) {
        required.push(fieldName);
      }
      
      properties[fieldName] = this.mapZodToOpenAPI(zodType, match[0]);
    }
    
    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required })
    };
  }

  mapZodToOpenAPI(zodType: string, fullDefinition: string): any {
    const baseType = this.zodTypeMap[zodType] || 'string';
    
    if (zodType === 'array') {
      const itemMatch = fullDefinition.match(/z\.array\(([^)]+)\)/);
      if (itemMatch) {
        const itemType = this.mapZodToOpenAPI('string', itemMatch[1]);
        return {
          type: 'array',
          items: itemType
        };
      }
    }
    
    if (zodType === 'enum') {
      const enumMatch = fullDefinition.match(/z\.enum\(\[([^\]]+)\]\)/);
      if (enumMatch) {
        const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
        return {
          type: 'string',
          enum: enumValues
        };
      }
    }
    
    // Extract min/max constraints
    let schema: any = { type: baseType };
    
    if (fullDefinition.includes('.min(')) {
      const minMatch = fullDefinition.match(/\.min\((\d+)\)/);
      if (minMatch) schema.minimum = parseInt(minMatch[1]);
    }
    
    if (fullDefinition.includes('.max(')) {
      const maxMatch = fullDefinition.match(/\.max\((\d+)\)/);
      if (maxMatch) schema.maximum = parseInt(maxMatch[1]);
    }
    
    if (fullDefinition.includes('.email()')) {
      schema.format = 'email';
    }
    
    if (fullDefinition.includes('.uuid()')) {
      schema.format = 'uuid';
    }
    
    if (fullDefinition.includes('.datetime()')) {
      schema.format = 'date-time';
    }
    
    return schema;
  }

  async generateSchemasFromHandlers(): Promise<Record<string, OpenAPISchema>> {
    const allSchemas: Record<string, OpenAPISchema> = {};
    
    // Scan routes directory for handler files
    const routeFiles = await this.findHandlerFiles('./routes');
    
    for (const handlerPath of routeFiles) {
      const schemas = await this.extractZodSchemas(handlerPath);
      
      // Merge schemas with AI metadata
      for (const [name, schema] of Object.entries(schemas)) {
        allSchemas[name] = {
          ...schema,
          // Add AI generation metadata
          'x-ai-generated': true,
          'x-source-handler': handlerPath,
          'x-generated-at': new Date().toISOString()
        };
      }
    }
    
    return allSchemas;
  }

  async findHandlerFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        
        if (entry.isDirectory()) {
          files.push(...await this.findHandlerFiles(fullPath));
        } else if (entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  async updateOpenAPIWithSchemas() {
    console.log('🧠 AI generating OpenAPI schemas from handlers...');
    
    // Generate schemas from handlers
    const aiSchemas = await this.generateSchemasFromHandlers();
    
    // Load existing OpenAPI spec
    const openapiPath = './docs/08-api-reference/openapi.yaml';
    const openapiContent = await file(openapiPath).text();
    const openapi = YAML.parse(openapiContent);
    
    // Merge AI-generated schemas
    openapi.components.schemas = {
      ...openapi.components.schemas,
      ...aiSchemas
    };
    
    // Write updated OpenAPI spec
    const updatedYaml = YAML.stringify(openapi);
    await file(openapiPath).write(updatedYaml);
    
    console.log(`✅ AI generated ${Object.keys(aiSchemas).length} schemas`);
    console.log(`📄 OpenAPI spec updated: ${openapiPath} (${updatedYaml.length} bytes)`);
    
    return {
      schemasGenerated: Object.keys(aiSchemas).length,
      specPath: openapiPath,
      specSize: updatedYaml.length
    };
  }
}

// CLI execution
async function main() {
  const generator = new AISchemaGenerator();
  
  try {
    const result = await generator.updateOpenAPIWithSchemas();
    console.log(`🎉 AI schema generation complete!`);
    console.log(`   Schemas: ${result.schemasGenerated}`);
    console.log(`   Spec size: ${result.specSize} bytes`);
  } catch (error) {
    console.error(`❌ AI schema generation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { AISchemaGenerator };
