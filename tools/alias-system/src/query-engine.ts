// Advanced Query Engine for Semantic Alias System
import { parseAlias } from './ai-generator.js';

interface QueryOptions {
  semantic?: boolean;
  fuzzy?: boolean;
  confidence?: number;
  explain?: boolean;
}

interface QueryResult {
  matches: string[];
  confidence: number;
  explanation?: string;
  queryTime: number;
}

interface AliasIndex {
  [key: string]: {
    aliases: string[];
    metadata: any;
    lastUpdated: Date;
  };
}

class SemanticQueryEngine {
  private aliasIndex: AliasIndex = {};
  private semanticCache = new Map<string, QueryResult>();
  
  constructor() {
    this.initializeIndex();
  }
  
  private initializeIndex() {
    // Sample alias data - in production this would come from registry
    this.aliasIndex = {
      'gov': {
        aliases: [
          'gov#rules:expanded/full@v3.0~active',
          'gov#rules:summary@v3.0~active',
          'gov#rules:expanded/dev@v3.0~active',
          'gov#summary:compact@v2.9~draft',
          'gov#policy:full@v3.0~active'
        ],
        metadata: { scope: 'gov', description: 'Government rules and policies' },
        lastUpdated: new Date()
      },
      'sec': {
        aliases: [
          'sec#rules:expanded@v3.0~active',
          'sec#policy:full@v2.9~deprecated'
        ],
        metadata: { scope: 'sec', description: 'Security rules and policies' },
        lastUpdated: new Date()
      }
    };
  }
  
  // Semantic query with meaning understanding
  async semanticQuery(query: string, options: QueryOptions = {}): Promise<QueryResult> {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = `semantic:${query}:${JSON.stringify(options)}`;
    if (this.semanticCache.has(cacheKey)) {
      const cached = this.semanticCache.get(cacheKey)!;
      return { ...cached, queryTime: performance.now() - startTime };
    }
    
    const matches = this.performSemanticSearch(query, options);
    const confidence = this.calculateConfidence(matches, query);
    const explanation = options.explain ? this.generateExplanation(query, matches) : undefined;
    
    const result: QueryResult = {
      matches,
      confidence,
      explanation,
      queryTime: performance.now() - startTime
    };
    
    // Cache result
    this.semanticCache.set(cacheKey, result);
    
    return result;
  }
  
  // Fuzzy search with confidence threshold
  async fuzzySearch(query: string, confidence: number = 0.85): Promise<QueryResult> {
    const startTime = performance.now();
    const matches = this.performFuzzySearch(query, confidence);
    
    return {
      matches,
      confidence: this.calculateConfidence(matches, query),
      queryTime: performance.now() - startTime
    };
  }
  
  // Complex pattern matching
  async complexQuery(pattern: string, options: QueryOptions = {}): Promise<QueryResult> {
    const startTime = performance.now();
    const matches = this.performComplexPatternMatch(pattern);
    
    return {
      matches,
      confidence: this.calculateConfidence(matches, pattern),
      explanation: options.explain ? `Pattern matched: ${pattern}` : undefined,
      queryTime: performance.now() - startTime
    };
  }
  
  // JSON export for pipeline integration
  async searchAsJSON(query: string, options: QueryOptions = {}): Promise<any[]> {
    const result = await this.semanticQuery(query, options);
    return result.matches.map(alias => {
      const parsed = parseAlias(alias);
      return {
        alias,
        parsed,
        match: true
      };
    });
  }
  
  private performSemanticSearch(query: string, options: QueryOptions): string[] {
    const allAliases = Object.values(this.aliasIndex).flatMap(index => index.aliases);
    const matches: string[] = [];
    
    // Parse the query to extract components
    try {
      const queryParts = this.parseQuery(query);
      
      for (const alias of allAliases) {
        if (this.matchesSemantic(alias, queryParts, options)) {
          matches.push(alias);
        }
      }
    } catch (error) {
      // Fallback to simple string matching
      return allAliases.filter(alias => 
        alias.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return matches;
  }
  
  private performFuzzySearch(query: string, minConfidence: number): string[] {
    const allAliases = Object.values(this.aliasIndex).flatMap(index => index.aliases);
    const matches: string[] = [];
    
    for (const alias of allAliases) {
      const similarity = this.calculateSimilarity(query.toLowerCase(), alias.toLowerCase());
      if (similarity >= minConfidence) {
        matches.push(alias);
      }
    }
    
    return matches.sort((a, b) => 
      this.calculateSimilarity(query.toLowerCase(), b.toLowerCase()) - 
      this.calculateSimilarity(query.toLowerCase(), a.toLowerCase())
    );
  }
  
  private performComplexPatternMatch(pattern: string): string[] {
    const allAliases = Object.values(this.aliasIndex).flatMap(index => index.aliases);
    
    // Convert pattern to regex
    // Example: 'gov#*:full@v2.*~(active|required)' 
    const regexPattern = pattern
      .replace(/\*/g, '[^:]+')
      .replace(/v2\.\*/g, 'v2\\.[0-9]+')
      .replace(/\(active\|required\)/g, '(active|required)')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    
    return allAliases.filter(alias => regex.test(alias));
  }
  
  private parseQuery(query: string): any {
    // Simple query parsing - can be enhanced with NLP
    const parts = query.split(/[#:~@]/);
    return {
      scope: parts[0],
      type: parts[1],
      variant: parts[2],
      version: parts[3],
      status: parts[4]
    };
  }
  
  private matchesSemantic(alias: string, queryParts: any, options: QueryOptions): boolean {
    try {
      const aliasParts = parseAlias(alias);
      
      // Check each component if specified in query
      if (queryParts.scope && !aliasParts.scope.includes(queryParts.scope)) {
        return false;
      }
      
      if (queryParts.type && !aliasParts.type.includes(queryParts.type)) {
        return false;
      }
      
      if (queryParts.variant && !aliasParts.variant.includes(queryParts.variant)) {
        return false;
      }
      
      if (queryParts.status && aliasParts.status !== queryParts.status) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  private calculateConfidence(matches: string[], query: string): number {
    if (matches.length === 0) return 0;
    
    // Simple confidence calculation based on match specificity
    const queryComplexity = query.split(/[#:~@]/).filter(Boolean).length;
    const baseConfidence = Math.min(queryComplexity / 5, 0.9);
    
    return baseConfidence + (matches.length > 0 ? 0.1 : 0);
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private generateExplanation(query: string, matches: string[]): string {
    return `Found ${matches.length} matches for semantic query "${query}". ` +
           `Matches include aliases across multiple scopes and variants.`;
  }
}

export default SemanticQueryEngine;
