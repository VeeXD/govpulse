import { COUNTRIES, INDUSTRIES, DATA } from '../lib/data'; import { SITE } from '../config/site';
export function GET() {
  const c = Object.entries(COUNTRIES);
  const body = `# GovPulse

> Free, open economic analytics by country and industry. ${c.length} countries, ${Object.keys(DATA.indicators).length} World Bank indicators, refreshed nightly (last run ${DATA.generated} UTC). Every number carries its source code and data year. Data licence: CC BY 4.0 (World Bank WDI). Not financial advice.

## Key pages
- [Home](${SITE}/): overview, GDP growth leaderboard, claim checks
- [Dashboards](${SITE}/dashboards/): prebuilt country, industry and commodity dashboards plus a builder; download any dashboard as PNG or PDF with optional Excel (.xlsx) data, shareable by link
- [Methodology](${SITE}/methodology/): sources, refresh schedule, claim-check rules
- [Public JSON API](${SITE}/api/): /api/v1/countries.json, /api/v1/{country}.json, /api/v1/{country}/{indicator}.json
- [Full data summary for LLMs](${SITE}/llms-full.txt): latest value and year for every country × indicator

## Countries
${c.map(([id, x]) => `- [${x.name} economy](${SITE}/${id}/): ${INDUSTRIES.slice(1).map(i => `[${i.name.toLowerCase()}](${SITE}/${id}/${i.id}/)`).join(', ')}`).join('\n')}

## Citation
Cite as: "GovPulse (${SITE}), data from World Bank World Development Indicators, CC BY 4.0", with the indicator code and data year.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
