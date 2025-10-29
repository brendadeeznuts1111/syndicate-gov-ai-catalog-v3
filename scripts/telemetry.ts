// scripts/telemetry.ts - Telemetry gate (respects DO_NOT_TRACK) (≤ 5 lines)
if (process.env.DO_NOT_TRACK === '1') return;

fetch(`${Bun.env.CITADEL_TELEMETRY_URL || 'https://telemetry.citadel.sh'}/install`, {
  method: 'POST',
  body: JSON.stringify({ 
    version: await Bun.file('package.json').json().then(p=>p.version),
    timestamp: Date.now()
  }),
  headers: { 'Content-Type': 'application/json' }
}).catch(()=>{});
