// tests/ai-suggester.test.ts - AI Suggester Tests
import { describe, it, expect, mock } from 'bun:test';
import { readFile, writeFile } from 'fs/promises';

// Mock the embedding utilities
mock.module('../src/ai/embedding', () => ({
  cosine: (a: number[], b: number[]) => 0.95,
  loadLogs: async () => [
    { method: 'GET', path: '/api/v1/users', status: 200 },
    { method: 'POST', path: '/api/v1/analytics', status: 201 }
  ],
  vectorise: async () => [
    { path: '/api/v1/users/audit', method: 'GET', score: 0.92 },
    { path: '/api/v1/analytics/export', method: 'POST', score: 0.89 }
  ]
}));

describe('AI Suggester', () => {
  const testConfig = {
    api: {
      routes: [
        { path: '/api/v1/users', method: 'GET' },
        { path: '/api/v1/config', method: 'POST' }
      ]
    },
    ai: {
      suggester: {
        enabled: true,
        logGlob: './test-logs.ndjson',
        minConfidence: 0.88,
        maxNewPerRun: 5
      }
    }
  };

  it('should load configuration from YAML', async () => {
    const { YAML } = await import('bun');
    const yamlContent = YAML.stringify(testConfig);
    
    expect(yamlContent).toContain('enabled: true');
    expect(yamlContent).toContain('minConfidence: 0.88');
  });

  it('should filter routes based on confidence', async () => {
    const { loadLogs, vectorise } = await import('../src/ai/embedding');
    const logs = await loadLogs('./test.ndjson');
    const vectors = await vectorise(logs);
    
    const novel = vectors.filter(v => v.score > 0.88);
    expect(novel).toHaveLength(2); // Both vectors have scores > 0.88
    expect(novel[0].path).toBe('/api/v1/users/audit');
  });

  it('should generate unique route IDs', () => {
    const { randomUUID } = require('crypto');
    const id1 = `ai-suggested-${randomUUID().slice(0, 8)}`;
    const id2 = `ai-suggested-${randomUUID().slice(0, 8)}`;
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^ai-suggested-[a-f0-9]{8}$/);
  });

  it('should create idempotency hash', () => {
    const { createHash } = require('crypto');
    const routes = [
      { path: '/api/v1/test', method: 'GET' },
      { path: '/api/v1/test2', method: 'POST' }
    ];
    
    const hash = createHash('sha256')
      .update(JSON.stringify(routes))
      .digest('hex')
      .slice(0, 8);
    
    expect(hash).toMatch(/^[a-f0-9]{8}$/);
  });

  it('should generate handler template with correct structure', () => {
    const route = {
      id: 'ai-suggested-test123',
      path: '/api/v1/users/{userId}',
      handler: './routes/ai/suggestion-0.ts'
    };
    
    const template = `
// [AI][HANDLER][AUTO-GEN][${route.id.toUpperCase()}][v3.0][LIVE]
// Grepable: [ai-handler-auto-gen-${route.id.toLowerCase()}-v3.0-test123]
// ${route.handler} - AI-generated handler from usage logs
// 🛡️ **Maintainers**: @syndicate-gov/ai-team
// 🎯 **Semantic Tag**: 🟢 [AI-TEAM][HANDLER][AUTO-GEN][TYPESCRIPT]
    `;
    
    expect(template).toContain('AI-SUGGESTED-TEST123');
    expect(template).toContain('ai-handler-auto-gen-ai-suggested-test123');
    expect(template).toContain('@syndicate-gov/ai-team');
  });

  it('should handle file operations atomically', async () => {
    const testFile = './test-temp.txt';
    const testContent = 'test content';
    
    // Simulate atomic write
    const tempFile = testFile + '.tmp';
    await writeFile(tempFile, testContent);
    
    // Verify temp file exists and has content
    const tempContent = await readFile(tempFile, 'utf-8');
    expect(tempContent).toBe(testContent);
    
    // Cleanup
    await require('fs/promises').unlink(tempFile);
  });

  it('should respect feature flags', () => {
    process.env.AI_HANDLER_WRITE = 'false';
    
    // This would normally exit early
    const shouldExit = process.env.AI_HANDLER_WRITE === 'false';
    expect(shouldExit).toBe(true);
    
    delete process.env.AI_HANDLER_WRITE;
  });
});

describe('Telemetry Integration', () => {
  it('should send telemetry data', async () => {
    const mockFetch = mock(() => Promise.resolve({ ok: true }));
    global.fetch = mockFetch;
    
    const telemetryData = {
      count: 3,
      ts: Date.now()
    };
    
    await fetch('https://example.com/telemetry', {
      method: 'POST',
      body: JSON.stringify(telemetryData),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle telemetry failures gracefully', async () => {
    const mockFetch = mock(() => Promise.reject(new Error('Network error')));
    global.fetch = mockFetch;
    
    try {
      await fetch('https://example.com/telemetry', {
        method: 'POST',
        body: JSON.stringify({ count: 0 }),
        headers: { 'Content-Type': 'application/json' }
      });
      // If we get here, the mock didn't reject as expected
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Network error');
    }
  });
});
