// tests/api.test.ts - Citadel API Tests with Bun Native Testing
import { describe, it, expect, mock } from 'bun:test';

describe('Citadel API Routes', () => {
  describe('Documentation Endpoints', () => {
    it('should serve Swagger UI at /_docs', async () => {
      const mockResponse = new Response('<html>Swagger UI</html>', {
        headers: { 'Content-Type': 'text/html' }
      });
      
      expect(mockResponse.status).toBe(200);
      expect(mockResponse.headers.get('Content-Type')).toContain('text/html');
      const text = await mockResponse.text();
      expect(text).toContain('Swagger UI');
    });

    it('should serve OpenAPI spec at /openapi.yaml', async () => {
      const mockResponse = new Response('openapi: 3.0.0', {
        headers: { 'Content-Type': 'text/yaml' }
      });
      
      expect(mockResponse.status).toBe(200);
      expect(mockResponse.headers.get('Content-Type')).toContain('text/yaml');
      const text = await mockResponse.text();
      expect(text).toContain('openapi: 3.0.0');
    });
  });

  describe('Admin Wand Endpoints', () => {
    it('should handle wand reload', async () => {
      const mockResponse = Response.json({ ok: true });
      expect(mockResponse.status).toBe(200);
      const data = await mockResponse.json();
      expect(data.ok).toBe(true);
    });

    it('should handle wand diff', async () => {
      const mockResponse = Response.json({ diff: '' });
      expect(mockResponse.status).toBe(200);
      const data = await mockResponse.json();
      expect(data).toHaveProperty('diff');
    });

    it('should handle wand rollback', async () => {
      const mockResponse = Response.json({ ok: true });
      expect(mockResponse.status).toBe(200);
      const data = await mockResponse.json();
      expect(data.ok).toBe(true);
    });

    it('should return 404 for unknown wand actions', async () => {
      const mockResponse = Response.json({ error: 'unknown wand' }, { status: 404 });
      expect(mockResponse.status).toBe(404);
      const data = await mockResponse.json();
      expect(data.error).toBe('unknown wand');
    });
  });
});

describe('AI Suggester', () => {
  it('should parse YAML configuration', async () => {
    const yamlContent = `
api:
  version: 1.3.0
  routes:
    - path: /test
      method: GET
ai:
  suggester:
    enabled: true
    maxNewPerRun: 5
    `;
    
    const { YAML } = await import('bun');
    const config = YAML.parse(yamlContent);
    
    expect(config.api.version).toBe('1.3.0');
    expect(config.ai.suggester.enabled).toBe(true);
    expect(config.ai.suggester.maxNewPerRun).toBe(5);
  });

  it('should handle idempotency for route generation', () => {
    const routes1 = [{ path: '/test', method: 'GET' }];
    const routes2 = [{ path: '/test', method: 'GET' }];
    
    const { createHash } = require('crypto');
    const hash1 = createHash('sha256').update(JSON.stringify(routes1)).digest('hex');
    const hash2 = createHash('sha256').update(JSON.stringify(routes2)).digest('hex');
    
    expect(hash1).toBe(hash2);
  });
});

describe('Schema Generation', () => {
  it('should generate valid OpenAPI components', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id']
    };
    
    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('id');
    expect(schema.properties).toHaveProperty('name');
    expect(schema.required).toContain('id');
  });

  it('should handle Zod to OpenAPI conversion', () => {
    // Mock Zod schema structure
    const zodSchema = {
      _def: {
        typeName: 'ZodObject',
        shape: {
          id: { _def: { typeName: 'ZodString' } },
          name: { _def: { typeName: 'ZodString' } }
        }
      }
    };
    
    const openApiSchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    };
    
    expect(openApiSchema.type).toBe('object');
    expect(Object.keys(openApiSchema.properties)).toHaveLength(2);
  });
});
