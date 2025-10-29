// src/ai/embedding.ts – Vector utilities for AI route suggester
export interface LogEntry {
  method: string;
  path: string;
  status: number;
  vector?: number[];
  score?: number;
}

export interface VectorizedLog extends LogEntry {
  vector: number[];
  score: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosine(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Load and parse access logs from NDJSON files
 */
export async function loadLogs(glob: string): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  
  try {
    // Find matching log files
    const files = await Array.fromAsync(
      new Bun.Glob(glob).scan()
    );
    
    for (const file of files) {
      const content = await Bun.file(file).text();
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const entry = JSON.parse(line);
            logs.push({
              method: entry.method || 'GET',
              path: entry.path || entry.url || '/',
              status: entry.status || 200
            });
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not load logs, using synthetic data:', error.message);
    
    // Fallback to synthetic data for demo
    return [
      { method: 'GET', path: '/api/v1/users/audit', status: 200 },
      { method: 'POST', path: '/api/v1/analytics/export', status: 201 },
      { method: 'GET', path: '/api/v1/dashboard/metrics', status: 200 },
      { method: 'PUT', path: '/api/v1/config/toggle', status: 200 },
      { method: 'GET', path: '/api/v1/reports/generate', status: 200 }
    ];
  }
  
  return logs;
}

/**
 * Vectorize log entries using sentence transformer embeddings
 * In production, this would use actual ML models
 */
export async function vectorise(logs: LogEntry[]): Promise<VectorizedLog[]> {
  return logs.map(log => {
    // Mock 384-dim vector - in production would use sentence-transformers
    const vector = Array.from({ length: 384 }, () => Math.random());
    
    // Mock confidence score based on path patterns
    const hasApiPrefix = log.path.startsWith('/api/');
    const hasVersion = log.path.includes('/v');
    const isPlural = log.path.endsWith('s');
    
    let score = 0.85;
    if (hasApiPrefix) score += 0.05;
    if (hasVersion) score += 0.05;
    if (isPlural) score += 0.03;
    
    return {
      ...log,
      vector,
      score: Math.min(score + Math.random() * 0.1, 0.99)
    };
  });
}
