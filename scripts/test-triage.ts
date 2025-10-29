#!/usr/bin/env bun
// scripts/test-triage.ts - Test Failure Triage & Pattern Detection v1.12

import { readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';

export interface TestFailure {
  file: string;
  testName: string;
  category: string;
  error: string;
  stack?: string;
  timestamp: Date;
  duration?: number;
}

export interface TriageResult {
  failures: TestFailure[];
  insights: {
    patterns: Record<string, number>;
    priorities: TestFailure[];
    rootCauses: string[];
    recommendations: string[];
  };
}

// Common failure patterns to detect
export const FAILURE_PATTERNS = {
  flaky: {
    pattern: /flaky|intermittent|unstable|racy/i,
    severity: 'medium',
    category: 'reliability'
  },
  timeout: {
    pattern: /timeout|timed out|exceeded.*ms|deadline/i,
    severity: 'high',
    category: 'performance'
  },
  memory: {
    pattern: /memory|leak|heap|gc.*pressure|out.*memory/i,
    severity: 'high',
    category: 'resources'
  },
  network: {
    pattern: /network|connection|socket|fetch|http.*error|connection.*refused/i,
    severity: 'medium',
    category: 'external'
  },
  database: {
    pattern: /database|postgres|redis|sqlite|connection.*pool|migration/i,
    severity: 'high',
    category: 'infrastructure'
  },
  auth: {
    pattern: /auth|authorization|permission|unauthorized|forbidden|token/i,
    severity: 'high',
    category: 'security'
  },
  assertion: {
    pattern: /assertion.*failed|expect.*failed|toBe|toEqual|toMatch/i,
    severity: 'medium',
    category: 'logic'
  }
} as const;

export async function loadTestFailures(): Promise<TestFailure[]> {
  const failures: TestFailure[] = [];

  // Scan for potential failure points in test files
  for (const category of ['unit', 'integration', 'performance', 'matrix']) {
    try {
      const testDir = join('tests', category);
      const files = await readdir(testDir);
      const testFiles = files.filter(f => f.endsWith('.test.ts'));

      for (const file of testFiles) {
        const content = await Bun.file(join(testDir, file)).text();

        // Extract test blocks that might fail
        const testBlocks = content.match(/test\(['"`](.*?)['"`]/g) || [];

        for (const testMatch of testBlocks) {
          const testName = testMatch.match(/test\(['"`](.*?)['"`]/)?.[1];

          if (testName) {
            // Check for failure-prone patterns
            const hasFailures = content.includes('.not.') ||
                              content.includes('toBeFalsy') ||
                              content.includes('throw');
            const hasTimeouts = content.includes('timeout') ||
                              content.includes('setTimeout');
            const hasAsync = content.includes('async') ||
                           content.includes('await');

            if (hasFailures || hasTimeouts || hasAsync) {
              failures.push({
                file: join(category, file),
                testName,
                category,
                error: hasFailures ? 'Potential assertion failure' :
                      hasTimeouts ? 'Timeout risk detected' :
                      'Async operation detected',
                timestamp: new Date()
              });
            }
          }
        }
      }
    } catch (e) {
      // Directory doesn't exist, continue
    }
  }

  return failures;
}

export function analyzeFailures(failures: TestFailure[]): TriageResult {
  const result: TriageResult = {
    failures,
    insights: {
      patterns: {},
      priorities: [],
      rootCauses: [],
      recommendations: []
    }
  };

  // Analyze failure patterns
  for (const failure of failures) {
    for (const [patternName, config] of Object.entries(FAILURE_PATTERNS)) {
      if (config.pattern.test(failure.error)) {
        result.insights.patterns[patternName] =
          (result.insights.patterns[patternName] || 0) + 1;
      }
    }

    // Prioritize by category and pattern severity
    const severity = Object.entries(FAILURE_PATTERNS)
      .find(([, config]) => config.pattern.test(failure.error))?.[1].severity;

    if (severity === 'high' || failure.category === 'integration') {
      result.insights.priorities.push(failure);
    }
  }

  // Generate root cause analysis
  if (result.insights.patterns.timeout) {
    result.insights.rootCauses.push('Network/database delays causing timeouts');
    result.insights.recommendations.push('Implement retry logic for external services');
  }

  if (result.insights.patterns.memory) {
    result.insights.rootCauses.push('Memory leaks in test cleanup or async operations');
    result.insights.recommendations.push('Add proper cleanup in afterEach blocks');
  }

  if (result.insights.patterns.flaky) {
    result.insights.rootCauses.push('Race conditions or timing dependencies');
    result.insights.recommendations.push('Use deterministic timeouts and mock unstable dependencies');
  }

  if (result.insights.patterns.database) {
    result.insights.rootCauses.push('Database connection issues or state pollution');
    result.insights.recommendations.push('Use isolated test databases and proper transaction management');
  }

  return result;
}

export async function generateTriageReport(): Promise<string> {
  const failures = await loadTestFailures();
  const triage = analyzeFailures(failures);

  const report = `
# 🚨 Test Failure Triage Report v1.12

## 📊 Failure Overview
- **Total Potential Failures**: ${failures.length}
- **High Priority**: ${triage.insights.priorities.length}
- **Categories**: ${Object.keys(triage.insights.patterns).join(', ') || 'None'}

## 🔍 Failure Pattern Analysis
${Object.entries(triage.insights.patterns)
  .map(([pattern, count]) =>
    `- **${pattern.charAt(0).toUpperCase() + pattern.slice(1)}**: ${count} occurrences`
  )
  .join('\n') || 'No specific patterns detected'}

## 🚨 High Priority Issues
${triage.insights.priorities.length > 0 ?
  triage.insights.priorities
    .map(failure => `- **${failure.category}/${basename(failure.file)}**: "${failure.testName}" - ${failure.error}`)
    .join('\n') :
  'No high-priority issues detected ✅'
}

## 🎯 Root Cause Analysis
${triage.insights.rootCauses.length > 0 ?
  triage.insights.rootCauses.map(cause => `- ${cause}`).join('\n') :
  'No specific root causes identified'
}

## 💡 Recommendations
${triage.insights.recommendations.length > 0 ?
  triage.insights.recommendations.map(rec => `- ${rec}`).join('\n') :
  '✨ Your tests look robust! Keep up the good work.'
}

## 📋 Detailed Failures
${failures.map(failure =>
  `### ${failure.category}/${basename(failure.file)} - ${failure.testName}
- **Error**: ${failure.error}
- **Category**: ${failure.category}
`
).join('\n') || 'No detailed failures to report'}

## 🛠️ Quick Fixes

### Timeout Issues
\`\`\`typescript
// Add retry logic for flaky network calls
test('api call', async () => {
  await retry(async () => {
    const response = await fetch('/api/data');
    expect(response.ok).toBe(true);
  }, { attempts: 3, delay: 1000 });
});
\`\`\`

### Memory Issues
\`\`\`typescript
// Ensure cleanup in afterEach
afterEach(async () => {
  await cleanupDatabase();
  mock.restore();
  // Clear any event listeners, timers, etc.
});
\`\`\`

### Race Conditions
\`\`\`typescript
// Use deterministic delays
await new Promise(resolve => setTimeout(resolve, 10));
expect(mockCallback).toHaveBeenCalled();
\`\`\`

---
*Generated by Citadel Test Triage • ${new Date().toISOString()}*
`;

  await Bun.write('tests/reports/test-triage-report.md', report);
  console.log('🚨 Test triage report generated: tests/reports/test-triage-report.md');

  return report;
}

// Run if called directly
if (import.meta.main) {
  console.log(await generateTriageReport());
}
