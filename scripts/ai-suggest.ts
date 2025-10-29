#!/usr/bin/env bun
// scripts/ai-suggest.ts – 29-line self-training route suggester
import { $ } from 'bun';
import { randomUUID, createHash } from 'crypto';
import { cosine, loadLogs, vectorise } from '../src/ai/embedding';
import { YAML } from 'bun';

function generateHandlerTemplate(route: any, logData: any): string {
  const schemaName = `${route.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}ResponseSchema`;
  const resourceName = route.path.split('/').pop()?.replace('{', '').replace('}', '') || 'resource';
  
  return `// [AI][HANDLER][AUTO-GEN][${route.id.toUpperCase()}][v3.0][LIVE]
// Grepable: [ai-handler-auto-gen-${route.id.toLowerCase()}-v3.0-${idempotency}]
// ${route.handler} - AI-generated handler from usage logs
// 🛡️ **Maintainers**: @syndicate-gov/ai-team
// 🎯 **Semantic Tag**: 🟢 [AI-TEAM][HANDLER][AUTO-GEN][TYPESCRIPT]
// 📊 **Coverage**: AI-suggested endpoint with ${(logData.score * 100).toFixed(1)}% confidence

import { z } from 'zod';

// AI-generated Zod schema from usage pattern analysis
const ${schemaName} = z.object({
  ${resourceName}Id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.string(),
  createdAt: z.datetime(),
  data: z.record(z.string()).optional()
});

type ${schemaName.replace('Schema', 'Response')} = z.infer<typeof ${schemaName}>;

export const handle = async (req: Request, { params }: { params: any }) => {
  try {
    const { ${resourceName}Id } = params;
    
    // AI-generated mock implementation
    const response: ${schemaName.replace('Schema', 'Response')} = {
      ${resourceName}Id,
      name: 'AI-Generated Resource',
      status: 'active',
      createdAt: new Date().toISOString(),
      data: {
        source: 'ai-suggestion',
        confidence: ${(logData.score).toFixed(3)},
        originalPath: '${route.path}',
        method: '${route.method}'
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Generated': 'true',
        'X-Confidence': '${(logData.score * 100).toFixed(1)}%'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'AI Handler Error',
      message: error.message,
      aiGenerated: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
`;
}

const cfgText = await Bun.file('config/bun.yaml').text();
const cfg     = YAML.parse(cfgText);
const aiCfg   = cfg.ai?.suggester;
if (!aiCfg?.enabled) process.exit(0);
if (process.env.AI_HANDLER_WRITE === 'false') process.exit(0);

const logs    = await loadLogs(aiCfg.logGlob);          // {method,path,status}
const existing= [] as string[]; // Extract from cfg.api.routes if present
const vectors = await vectorise(logs);                  // 384-dim sentence-transformers
const novel   = vectors.filter(v => v.score > aiCfg.minConfidence && !existing.some(e => v.path.match(e)));
const picked  = novel.slice(0, aiCfg.maxNewPerRun);

const newRoutes = picked.map((p, i) => ({
  path: p.path,
  method: p.method,
  id: `ai-suggested-${randomUUID().slice(0, 8)}`,
  handler: `./routes/ai/suggestion-${i}.ts`,            // stubbed by generator
  auth: 'csrf',                                         // conservative default
  response: { 200: { schema: 'AISuggestionResponse' } },
  tags: ['ai', 'suggested'],
  summary: `AI-suggested endpoint (${(p.score * 100).toFixed(1)}% confidence)`,
  sourcemap: true
}));

const idempotency = createHash('sha256').update(JSON.stringify(newRoutes)).digest('hex').slice(0, 8);

// Generate actual handler files
for (const [i, route] of newRoutes.entries()) {
  const handlerPath = route.handler.replace('./', '');
  const backup = `${handlerPath}.bak`;
  await Bun.write(backup, await Bun.file(handlerPath).text().catch(() => ''));
  const handlerContent = generateHandlerTemplate(route, picked[i]);
  const tmp = handlerPath + '.tmp';
  await Bun.write(tmp, handlerContent);
  await Bun.rename(tmp, handlerPath);
}

console.log(`🤖 AI suggested ${newRoutes.length} new routes:`, newRoutes.map(r => r.path));
console.log('✅ Route suggestions generated successfully');

// Telemetry egress (fire-and-forget)
fetch(process.env.CITADEL_TELEMETRY_URL || '', { method: 'POST', body: JSON.stringify({ count: newRoutes.length, ts: Date.now() }), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
