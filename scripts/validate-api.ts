#!/usr/bin/env bun
// scripts/validate-api.ts - Cross-validate bun.yaml vs handler exports
import { file, YAML } from 'bun';
import { $ } from 'bun';

interface RouteDecl {
  path: string;
  method: string | 'WS';
  id: string;
  handler: string;
  sourcemap?: boolean;
}

async function validateAPI() {
  console.log('🔍 Validating API routes...');
  
  const config = YAML.parse(await file('config/bun.yaml').text());
  const routes: RouteDecl[] = config.api.routes || [];
  
  let validCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  for (const route of routes) {
    if (!route.sourcemap) {
      console.log(`⚠️ Skipping ${route.id}: no sourcemap`);
      continue;
    }

    try {
      const handlerCode = await file(route.handler).text();
      
      // Check for handle export
      if (!handlerCode.includes('export const handle') && !handlerCode.includes('export function handle')) {
        errors.push(`${route.id}: Missing handle export in ${route.handler}`);
        invalidCount++;
        continue;
      }

      // Check for Zod schemas
      if (!handlerCode.includes('z.') && !handlerCode.includes('import { z }')) {
        console.log(`⚠️ ${route.id}: No Zod validation found`);
      }

      console.log(`✅ ${route.id}: Valid handler`);
      validCount++;
      
    } catch (error) {
      errors.push(`${route.id}: Cannot load ${route.handler} - ${error.message}`);
      invalidCount++;
    }
  }

  // Generate OpenAPI spec as part of validation
  try {
    await import('./gen-openapi.ts').then(m => m.generateOpenAPI());
    console.log('✅ OpenAPI spec generated successfully');
  } catch (error) {
    errors.push(`OpenAPI generation failed: ${error.message}`);
  }

  console.log(`\n📊 Validation Results:`);
  console.log(`   Valid: ${validCount}`);
  console.log(`   Invalid: ${invalidCount}`);
  console.log(`   Success Rate: ${((validCount / (validCount + invalidCount)) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }

  console.log(`\n🎉 API validation complete!`);
}

if (import.meta.main) {
  validateAPI().catch(console.error);
}

export { validateAPI };
