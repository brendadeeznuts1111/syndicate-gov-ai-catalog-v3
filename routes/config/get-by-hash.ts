// routes/config/get-by-hash.ts - Async handler with Zod validation
import { z } from 'zod';

const Params = z.object({ hash: z.string().length(6) });
const Response = z.object({ 
  hash: z.string(), 
  data: z.string(), 
  interpolated: z.boolean() 
});

export const handle = async (req: Request, { params }: { params: any }) => {
  try {
    const { hash } = Params.parse(params);
    
    // Mock registry retrieval
    const config = `# Config for ${hash}\ndata: example\ninterpolated: true`;
    
    if (!config) {
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const responseData = Response.parse({ 
      hash, 
      data: config, 
      interpolated: true 
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Validation Error', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
