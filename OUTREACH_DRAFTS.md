# GovPulse outreach drafts (not posted: owner reviews and posts from their own accounts)

Rules: post from your own account, follow each community's self-promotion rules, disclose that you built it, and space posts out across days. Nothing here has been submitted.

---
## 1. Show HN
**Title:** Show HN: GovPulse – free economic indicators by country and industry, with sources

**URL:** https://govpulse.pages.dev

**First comment:**
I built GovPulse because I was tired of seeing political claims quote a single flattering number. It's a static site (Astro + ECharts) that pulls 28 World Bank indicators for 10 economies every night and organises them by industry: macro, agriculture, healthcare, finance, energy and manufacturing.

Things that might interest HN:
- Pick a metric and the dashboard rebuilds around it: headline KPI, main chart, related metrics, and a "counter-metric" (e.g. health spending vs infant mortality).
- Every chart opens full screen with suggested next charts, and you can navigate with the keyboard.
- Every number shows its World Bank code and year. Nothing is modelled.
- Free static JSON API plus a CSV (CC BY 4.0), auto-generated monthly country reports, and /llms.txt.
- It costs $0 to run: GitHub Actions + Cloudflare Pages.

It's annual WDI data, so it isn't truly "daily" economics yet. I'd love feedback on which indicators or countries to add next.

---
## 2. r/dataisbeautiful
(OC posts must use the [OC] tag, include an image, and give source + tool in a top comment.)

**Title:** [OC] India: agriculture's share of GDP vs share of jobs, 2000–2025

**Image:** a screenshot of /india/agriculture with "Agriculture share of GDP" selected (full-screen view).

**Top comment:**
Source: World Bank World Development Indicators (NV.AGR.TOTL.ZS, SL.AGR.EMPL.ZS). Tools: Apache ECharts, Astro. The interactive version, where you can switch metrics, change the year range and see related charts, is at https://govpulse.pages.dev/india/agriculture/ (a free project I built).

---
## 3. r/economics
(r/economics restricts self-promotion and prefers articles. Post the report as discussion only if the rules allow it, or wait for a relevant thread and comment there.)

**Title:** Auto-generated country economic reports from World Bank data: India, US, China, Germany, Nigeria and more (free, sourced)

**Body:** I generate a monthly report per country directly from WDI data. It covers the five-year biggest movers, peer rankings and sector sections, and every sentence cites its indicator code and year. Example: https://govpulse.pages.dev/reports/india-economic-report-2025/. I'm looking for methodological criticism, especially on using lending rate minus CPI as a rough real-rate proxy (https://govpulse.pages.dev/policy-tracker/).

---
## 4. r/india
(Check the flair rules. Use [OC] or Non-Political flair if available.)

**Title:** Built a free dashboard for India's economy by sector: agriculture, healthcare, energy, manufacturing (World Bank data)

**Body:** India grew 7.6% in 2025 per the World Bank, but agriculture still employs a far larger share of workers than its share of GDP. I made a free site that puts numbers like these side by side, with sources: https://govpulse.pages.dev/india/. There are no ads or sign-up. Feedback is welcome on which Indian datasets (MOSPI, RBI) to add next.

---
## 5. LinkedIn post
Governments love quoting one number. I wanted to see the second number too.

So I built GovPulse, a free economic indicators dashboard by country and industry:
→ 28 World Bank indicators × 10 economies, refreshed nightly
→ Choose a metric and the dashboard rebuilds around it, with related metrics and a counter-metric
→ Monthly auto-generated country reports (e.g. India Economic Report 2025)
→ A free JSON API and CSV under CC BY 4.0

No paywall, no sign-up. It's sponsor-funded, and sponsors never touch the data.
👉 https://govpulse.pages.dev

If you work in policy, economics or data journalism, I'd value your feedback.
#economics #opendata #dataviz #publicpolicy

---
## 6. X thread
1/ I built GovPulse, a free dashboard of economic indicators by country and industry, sourced to the World Bank and refreshed nightly. https://govpulse.pages.dev
2/ Pick a metric, like GDP growth, and the dashboard rebuilds around it: the KPI, its trend, related metrics (inflation, unemployment, investment, exports) and a counter-metric to keep the claim honest.
3/ GDP by country, ranked: https://govpulse.pages.dev/gdp-by-country/
4/ Auto-generated monthly reports, e.g. India Economic Report 2025: https://govpulse.pages.dev/reports/india-economic-report-2025/
5/ The data is open: a JSON API plus CSV, CC BY 4.0. Code: https://github.com/VeeXD/govpulse. Which countries should I add next?

---
## 7. Product Hunt
- **Name:** GovPulse
- **Tagline (≤60):** Free economic indicators by country & industry, sourced
- **Topics:** Data & Analytics, Open Source, Fintech, Education
- **Description:** GovPulse turns World Bank data into metric-driven dashboards for 10 economies across macro, agriculture, healthcare, finance, energy and manufacturing. Choose a metric and get its trend, related metrics, a counter-metric check and a full-screen explorer. It also includes monthly country reports and a free JSON API and CSV. No sign-up, sponsor-funded.
- **Maker comment:** reuse the Show HN first comment.
- **Gallery:** shots/v7-metric-gdp.png, v7-fullscreen.png, v7-metric-agri.png, v6-sponsor.png.

---
## 8. Free directory / list submissions (owner account needed for each)
| Where | How | Notes |
|---|---|---|
| awesome-public-datasets | PR to https://github.com/awesomedata/apd-core (the README list is generated from apd-core YAML files). Add `core/Economics/govpulse.yml` pointing at the CSV/API | Dataset-focused; link the datasets/ folder and API |
| Other GitHub awesome lists | awesome-dataviz, awesome-economics (check each CONTRIBUTING file) | One PR each, and only where it fits |
| Kaggle Datasets | kaggle.com/datasets/new + datasets/README.md | Kaggle account |
| Hugging Face Datasets | new dataset repo; the card is already in datasets/README.md | HF account |
| data.world | create a dataset from the GitHub folder | account |
| AlternativeTo | alternativeto.net, "Suggest new application"; list as an alternative to Trading Economics / Our World in Data | account |
| BetaList | betalist.com/submit (free queue is slow) | account |
| SaaSHub | saashub.com/submit | account |
| Product Hunt | see section 7 | account; launch on a Tue–Thu |
| Google Search Console | add the property, verify (set the PUBLIC_GSC_VERIFICATION env var and redeploy), submit /sitemap-index.xml | Google no longer accepts sitemap pings |
| Bing Webmaster Tools | import from GSC, submit the sitemap (IndexNow is already wired) | Microsoft account |

---
## 9. Sponsor emails (send from sadam.veekshith007@gmail.com)

### a) Rainmatter Foundation
- **To:** info@rainmatter.org (verified in the rainmatter.org site footer; grants info at https://rainmatter.org)
- **Fit note:** Rainmatter Foundation funds climate, environment and livelihood work. Pitch the energy and agriculture data (renewables share, cereal yield, rural electrification), not generic finance.

**Subject:** Open, sourced energy & agriculture data for India: sponsorship / grant enquiry

Hi Rainmatter team,

I run GovPulse (https://govpulse.pages.dev), a free, open dashboard of official economic indicators. Its India pages track renewable energy share, electricity access, cereal yield, agricultural employment and rural population, all sourced to the World Bank and refreshed nightly. The data is also available as a free CC BY 4.0 API and CSV.

I'd like to expand the climate and agriculture coverage: Indian state-level data, emissions, and water and land-use indicators. I'm looking for a supporter for that work. Sponsors are credited, but under our disclosure policy (https://govpulse.pages.dev/sponsor/) they never influence the data.

Would a grant or sponsorship conversation be possible? Happy to share usage numbers and a roadmap.

Thanks,
Veekshith
GovPulse, https://govpulse.pages.dev

### b) smallcase
- **To:** partnerships@smallcase.com (the partnerships address a smallcase leader published on LinkedIn); fallback press@smallcase.com (listed on https://www.smallcase.com/about)

**Subject:** Sponsoring free macro data for Indian investors: GovPulse

Hi smallcase team,

GovPulse (https://govpulse.pages.dev) is a free dashboard of macro and sector indicators for India and 9 other economies: GDP growth, inflation, lending rates, private credit, market cap/GDP and manufacturing. Every number is sourced and refreshed nightly.

Our audience is the same curious retail investor who wants to understand the macro story behind a theme. A Gold sponsorship ("Presented by smallcase" on the India finance section) or a Silver logo on country pages would put smallcase next to that context. Sponsors never influence data: https://govpulse.pages.dev/sponsor/

Open to a quick call?

Best,
Veekshith

### c) Koyfin
- **To:** help@koyfin.com (published contact on https://www.koyfin.com/help/faq/how-do-i-give-feedback/ and in the Koyfin privacy policy). Ask for the request to be routed to marketing/partnerships.

**Subject:** Partnership / sponsorship: free global macro dashboard (GovPulse)

Hi Koyfin team (please route to marketing or partnerships),

I built GovPulse (https://govpulse.pages.dev), a free, sourced dashboard of World Bank macro indicators by country and industry, with a public JSON API and monthly country reports. Its readers are early-stage investors and students who often graduate to tools like Koyfin.

Would Koyfin consider a sponsorship, such as a Silver logo across country pages or "Presented by Koyfin" on finance sections? Our disclosure policy keeps sponsors away from the data (https://govpulse.pages.dev/sponsor/).

Thanks for considering,
Veekshith
