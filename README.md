# GovPulse: free economic indicators dashboard by country & industry

**Live site → [govpulse.pages.dev](https://govpulse.pages.dev)**

GovPulse is a free, sponsor-funded analytics site. It shows official macro and sector economic indicators (GDP growth, inflation, unemployment, government debt, agriculture, healthcare, finance, energy, manufacturing) for major economies. Data comes from the World Bank, refreshes nightly, and every number carries its source and year.

- 📊 [Economic indicators dashboard](https://govpulse.pages.dev/economic-indicators-dashboard/): 28 indicators × 10 countries
- 🌍 [GDP by country](https://govpulse.pages.dev/gdp-by-country/): growth and per-capita rankings
- 🏛️ [Government analytics](https://govpulse.pages.dev/government-analytics/): debt, inflation, jobs, health spending
- 📰 [Policy tracker](https://govpulse.pages.dev/policy-tracker/): monetary, fiscal and sector policy outcomes
- 📄 [Economic reports](https://govpulse.pages.dev/reports/): monthly auto-generated country reports (e.g. [India Economic Report 2025](https://govpulse.pages.dev/reports/india-economic-report-2025/))
- 🇮🇳 Example dashboard: [India agriculture statistics](https://govpulse.pages.dev/india/agriculture/)
- 🔌 [Free JSON API](https://govpulse.pages.dev/api/) and [CSV dataset](datasets/) (CC BY 4.0)

## Stack
Astro 7 (static) + React islands, Tailwind, Apache ECharts, three.js. Python data pipeline (World Bank API). Nightly GitHub Action, hosted on Cloudflare Pages. Cookieless analytics.

## Develop
```bash
npm ci && python pipeline/fetch.py && npm run build   # output in dist/
```

## Data licence
World Bank WDI, CC BY 4.0. Code © GovPulse. Sponsors never influence data ([disclosure](https://govpulse.pages.dev/sponsor/)).

**Suggested repo topics** (set these in repo settings): economics, open-data, gdp, government-analytics, dashboard, world-bank, economic-indicators, data-visualization
