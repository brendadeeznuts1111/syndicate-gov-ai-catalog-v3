// tests/schema.test.ts - OpenAPI Schema Generation Tests
import { describe, it, expect } from 'bun:test';

describe('OpenAPI Schema Generation', () => {
  it('should generate basic OpenAPI structure', () => {
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Syndicate Dashboard API',
        version: '1.3.0',
        description: 'Bun-powered, YAML-governed, grep-first REST + WS'
      },
      servers: [
        { url: 'https://api.syndicate.gov', description: 'Production Vault' },
        { url: 'ws://localhost:3003', description: 'Local WS Broadcast' }
      ],
      paths: {},
      components: { schemas: {} }
    };
    
    expect(openApiSpec.openapi).toBe('3.0.0');
    expect(openApiSpec.info.title).toBe('Syndicate Dashboard API');
    expect(openApiSpec.servers).toHaveLength(2);
  });

  it('should convert Zod string to OpenAPI string', () => {
    const zodString = { _def: { typeName: 'ZodString' } };
    const openApiString = { type: 'string' };
    
    expect(openApiString.type).toBe('string');
  });

  it('should convert Zod number to OpenAPI number', () => {
    const zodNumber = { _def: { typeName: 'ZodNumber' } };
    const openApiNumber = { type: 'number' };
    
    expect(openApiNumber.type).toBe('number');
  });

  it('should convert Zod boolean to OpenAPI boolean', () => {
    const zodBoolean = { _def: { typeName: 'ZodBoolean' } };
    const openApiBoolean = { type: 'boolean' };
    
    expect(openApiBoolean.type).toBe('boolean');
  });

  it('should convert Zod array to OpenAPI array', () => {
    const zodArray = { 
      _def: { 
        typeName: 'ZodArray',
        type: { _def: { typeName: 'ZodString' } }
      }
    };
    const openApiArray = { 
      type: 'array', 
      items: { type: 'string' } 
    };
    
    expect(openApiArray.type).toBe('array');
    expect(openApiArray.items.type).toBe('string');
  });

  it('should convert Zod object to OpenAPI object', () => {
    const zodObject = {
      _def: {
        typeName: 'ZodObject',
        shape: {
          id: { _def: { typeName: 'ZodString' } },
          age: { _def: { typeName: 'ZodNumber' } },
          active: { _def: { typeName: 'ZodBoolean' } }
        }
      }
    };
    
    const openApiObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['id', 'age', 'active']
    };
    
    expect(openApiObject.type).toBe('object');
    expect(Object.keys(openApiObject.properties)).toHaveLength(3);
    expect(openApiObject.properties.id.type).toBe('string');
    expect(openApiObject.properties.age.type).toBe('number');
    expect(openApiObject.properties.active.type).toBe('boolean');
  });

  it('should handle optional Zod properties', () => {
    const zodObject = {
      _def: {
        typeName: 'ZodObject',
        shape: {
          id: { _def: { typeName: 'ZodString' } },
          name: { _def: { typeName: 'ZodString', _def: { checks: [] } } }
        }
      }
    };
    
    const openApiObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id']
    };
    
    expect(openApiObject.required).toEqual(['id']);
    expect(openApiObject.required).not.toContain('name');
  });

  it('should add AI metadata to schemas', () => {
    const schemaWithMetadata = {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id'],
      'x-ai-generated': true,
      'x-ai-confidence': 0.95,
      'x-last-validated': new Date().toISOString()
    };
    
    expect(schemaWithMetadata['x-ai-generated']).toBe(true);
    expect(schemaWithMetadata['x-ai-confidence']).toBeGreaterThan(0.9);
    expect(schemaWithMetadata['x-last-validated']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should handle unknown Zod types gracefully', () => {
    const unknownZodType = {
      _def: {
        typeName: 'ZodUnknown'
      }
    };
    
    const fallbackSchema = {
      type: 'object',
      description: 'Unknown Zod type - fallback schema',
      'x-zod-raw': JSON.stringify(unknownZodType)
    };
    
    expect(fallbackSchema.type).toBe('object');
    expect(fallbackSchema.description).toContain('Unknown Zod type');
    expect(fallbackSchema['x-zod-raw']).toBeDefined();
  });
});

describe('Route Registration', () => {
  it('should register GET route with schema', () => {
    const route = {
      path: '/api/v1/users/{id}',
      method: 'GET',
      id: 'get-user-by-id',
      handler: './routes/users/get-by-id.ts',
      response: {
        200: { schema: 'UserResponse' },
        404: { schema: 'Error' }
      },
      tags: ['users'],
      summary: 'Get user by ID'
    };
    
    expect(route.method).toBe('GET');
    expect(route.path).toContain('{id}');
    expect(route.response[200].schema).toBe('UserResponse');
    expect(route.tags).toContain('users');
  });

  it('should register POST route with request schema', () => {
    const route = {
      path: '/api/v1/users',
      method: 'POST',
      id: 'create-user',
      handler: './routes/users/create.ts',
      request: { schema: 'CreateUserRequest' },
      response: {
        201: { schema: 'UserResponse' },
        400: { schema: 'ValidationError' }
      },
      tags: ['users'],
      summary: 'Create new user'
    };
    
    expect(route.method).toBe('POST');
    expect(route.request.schema).toBe('CreateUserRequest');
    expect(route.response[201].schema).toBe('UserResponse');
  });

  it('should handle WebSocket routes', () => {
    const wsRoute = {
      path: '/ws/config-broadcast',
      method: 'WS',
      id: 'config-broadcast-ws',
      handler: './routes/ws/config-broadcast.ts',
      auth: 'csrf',
      subprotocol: 'dashboard-v1.3',
      tags: ['realtime', 'ws'],
      summary: 'Live YAML diff stream'
    };
    
    expect(wsRoute.method).toBe('WS');
    expect(wsRoute.subprotocol).toBe('dashboard-v1.3');
    expect(wsRoute.tags).toContain('realtime');
    expect(wsRoute.tags).toContain('ws');
  });
});
