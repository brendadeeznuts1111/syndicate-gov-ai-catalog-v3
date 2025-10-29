// [GOV][SCRAPER][SPORTS-DATA][SPORTS-DATA-001][v3.0][LIVE]
// Grepable: [gov-scraper-sports-data-sports-data-001-v3.0-live]
// scripts/scrape-sports-data.ts - Fetch sports betting data from external API
// 🛡️ **Maintainers**: @syndicate-gov/betting-team
// 🎯 **Semantic Tag**: 🟢 [GOV][SCRAPER][SPORTS-DATA][TYPESCRIPT]
// 📊 **Coverage**: External API integration for live sports betting data

import { z } from 'zod';

// Response schema for the external API
const SportsDataResponseSchema = z.object({
  countries: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string()
  })),
  leagues: z.array(z.object({
    id: z.string(),
    name: z.string(),
    country_id: z.string(),
    sport_id: z.string()
  })),
  sports: z.array(z.object({
    id: z.string(),
    name: z.string()
  }))
});

type SportsDataResponse = z.infer<typeof SportsDataResponseSchema>;

export async function scrapeSportsData(): Promise<SportsDataResponse> {
  const response = await fetch("https://plive.sportswidgets.pro/live/data?countries=true&leagues=true&sports=true", {
    "headers": {
      "accept": "application/json, gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-gs-session": "56b3436e3267577bbc8979fa",
      "cookie": "GSID=bm291su14adrubhguum84j5qll; _gid=GA1.2.431380059.1761739106; _ga_ZG771CWJR1=GS2.1.s1761756832$o5$g1$t1761758194$j58$l0$h0; _ga=GA1.1.1745949441.1761633376",
      "Referer": "https://plive.sportswidgets.pro/manager-tools/"
    },
    "body": null,
    "method": "GET"
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return SportsDataResponseSchema.parse(data);
}

// CLI execution
if (import.meta.main) {
  scrapeSportsData()
    .then(data => {
      console.log('✅ Sports data scraped successfully');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('❌ Failed to scrape sports data:', error.message);
      process.exit(1);
    });
}
