#!/usr/bin/env bun
// scripts/ai-schedule.ts – One-line cron installer for AI suggester
import { $ } from 'bun';

async function scheduleAI() {
  try {
    // Check if already scheduled
    const existingCron = await $`crontab -l`.quiet().text();
    
    if (existingCron?.includes('ai-suggest.ts')) {
      console.log('✅ AI suggester already scheduled');
      return;
    }
    
    // Install cron job for 03:00 UTC daily
    const cronJob = '0 3 * * * cd $(pwd) && bun run scripts/ai-suggest.ts >> logs/ai-suggest.log 2>&1';
    
    // Add to crontab
    await $`echo "${cronJob}" | crontab -`;
    
    console.log('🕐 AI suggester scheduled for 03:00 UTC daily');
    console.log('📝 Logs will be written to: logs/ai-suggest.log');
  } catch (error) {
    console.error('❌ Failed to schedule AI suggester:', error.message);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.main) {
  await scheduleAI();
}

export { scheduleAI };
