// src/env.d.ts - Type-safe environment map (≤ 15 lines)
declare module 'bun' {
  interface Env {
    // Core Citadel settings
    CITADEL_TELEMETRY_URL?: string;
    CITADEL_AGE_KEY?: string;
    CITADEL_VERSION?: string;
    
    // AI & Testing configuration
    AI_HANDLER_WRITE?: 'true' | 'false';
    CLAUDECODE?: '1';
    DO_NOT_TRACK?: '1';
    
    // Database & Infrastructure
    DB_URL?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_NAME?: string;
    
    // Performance & Runtime
    BUN_MAX_THREADS?: string;
    BUN_TEST_TIMEOUT?: string;
    BUN_TEST_MAX_CONCURRENCY?: string;
    
    // Security
    NODE_TLS_REJECT_UNAUTHORIZED?: '0' | '1';
  }
}
