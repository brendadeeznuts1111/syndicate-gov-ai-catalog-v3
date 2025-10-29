// routes/config/store.ts - Store YAML config with validation
import { z } from 'zod';

const StoreRequest = z.object({
  yaml: z.string(),
  interpolate: z.boolean().optional().default(false)
});

const StoreResponse = z.object({
  id: z.string(),
  hash: z.string(),
  path: z.string()
});

export const handle = async (req: Request) => {
  try {
    const body = await req.json();
    const { yaml, interpolate } = StoreRequest.parse(body);
    
    // Mock storage logic
    const id = `config-${Date.now()}`;
    const hash = Math.random().toString(36).substring(0, 6);
    const path = `./rules/${id}.yaml`;
    
    // Mock file write
    console.log(`Storing config: ${path}`);
    
    const response = StoreResponse.parse({
      id,
      hash,
      path
    });

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Store Error', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
