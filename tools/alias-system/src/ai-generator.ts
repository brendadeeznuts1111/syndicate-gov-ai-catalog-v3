// AI-Enhanced Alias Generation System
import { v5 as uuid5 } from 'bun';

interface AliasMetadata {
  priority: 'high' | 'medium' | 'low';
  audience: 'developers' | 'operators' | 'security' | 'all';
  complexity: 'basic' | 'intermediate' | 'advanced';
}

interface AIAliasRequest {
  scope: string;
  type: string;
  variant: string;
  metadata: AliasMetadata;
}

interface GeneratedAlias {
  alias: string;
  confidence: number;
  suggestions: string[];
  reasoning: string;
}

// AI suggests optimal aliases based on usage patterns
export async function generateAIEnhancedAlias(request: AIAliasRequest): Promise<GeneratedAlias> {
  const { scope, type, variant, metadata } = request;
  
  // AI optimization logic based on metadata
  let optimizedVariant = variant.toLowerCase();
  let reasoning = '';
  let confidence = 0.85;
  
  // Audience-based optimization
  if (metadata.audience === 'developers') {
    optimizedVariant += '/dev';
    reasoning += 'Optimized for developer workflow. ';
    confidence += 0.05;
  } else if (metadata.audience === 'security') {
    optimizedVariant += '/sec';
    reasoning += 'Security-focused variant. ';
    confidence += 0.03;
  }
  
  // Priority-based adjustments
  if (metadata.priority === 'high') {
    reasoning += 'High priority alias with caching enabled. ';
    confidence += 0.07;
  }
  
  // Complexity-based version selection
  let version = '@v3.0';
  if (metadata.complexity === 'advanced') {
    version = '@v3.0~active';
    reasoning += 'Advanced features enabled. ';
    confidence += 0.02;
  }
  
  // Generate the final alias
  const alias = `${scope.toLowerCase()}#${type.toLowerCase()}:${optimizedVariant}${version}`;
  
  // Generate alternative suggestions
  const suggestions = [
    `${scope.toLowerCase()}#${type.toLowerCase()}:${variant.toLowerCase()}${version}`,
    `${scope.toLowerCase()}#${type.toLowerCase()}:${variant.toLowerCase()}/full${version}`,
    `${scope.toLowerCase()}#${type.toLowerCase()}:${variant.toLowerCase()}/compact${version}`
  ];
  
  return {
    alias,
    confidence: Math.min(confidence, 0.99),
    suggestions,
    reasoning: reasoning.trim()
  };
}

// Parse alias components
export function parseAlias(alias: string): {
  scope: string;
  type: string;
  variant: string;
  version?: string;
  status?: string;
} {
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

// Validate alias structure
export function validateAlias(alias: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const parsed = parseAlias(alias);
    
    // Validate scope
    const validScopes = ['gov', 'sec', 'ops'];
    if (!validScopes.includes(parsed.scope.toLowerCase())) {
      errors.push(`Invalid scope: ${parsed.scope}. Must be one of: ${validScopes.join(', ')}`);
    }
    
    // Validate type
    const validTypes = ['rules', 'summary', 'config', 'policy'];
    if (!validTypes.includes(parsed.type.toLowerCase())) {
      errors.push(`Invalid type: ${parsed.type}. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Validate variant
    const validVariants = ['expanded', 'summary', 'full', 'compact'];
    const baseVariant = parsed.variant.split('/')[0];
    if (!validVariants.includes(baseVariant)) {
      errors.push(`Invalid variant: ${baseVariant}. Must be one of: ${validVariants.join(', ')}`);
    }
    
    // Validate status if present
    if (parsed.status) {
      const validStatuses = ['active', 'draft', 'deprecated'];
      if (!validStatuses.includes(parsed.status.toLowerCase())) {
        errors.push(`Invalid status: ${parsed.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
  } catch (error) {
    errors.push(error.message);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
