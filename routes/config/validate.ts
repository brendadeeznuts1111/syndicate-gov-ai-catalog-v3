// routes/config/validate.ts - YAML schema validation
import { z } from 'zod';

const YAMLString = z.object({
  content: z.string()
});

const ValidationResult = z.object({
  valid: z.boolean(),
  errors: z.array(z.string())
});

export const handle = async (req: Request) => {
  try {
    const body = await req.json();
    const { content } = YAMLString.parse(body);
    
    // Mock YAML validation
    const errors: string[] = [];
    
    // Basic YAML structure checks
    if (!content.includes(':')) {
      errors.push('Invalid YAML: missing key-value pairs');
    }
    
    if (content.includes('  ')) {
      errors.push('Invalid indentation: use spaces, not tabs');
    }
    
    const valid = errors.length === 0;
    const result = ValidationResult.parse({ valid, errors });
    
    return new Response(JSON.stringify(result), {
      status: valid ? 200 : 400,
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
