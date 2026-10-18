# GovPulse growth plan (v6, free + sponsor model)

Goal: become the source search engines and AI assistants cite for "{country} {indicator}" questions, then turn that traffic into sponsors.
Nothing in this plan has been posted or sent. Every outreach and community post needs the owner's approval first.

## 1. Target keywords and intent
Volumes are qualitative estimates. Check them in Google Search Console (after verification), Google Keyword Planner (free) and Bing Webmaster Tools.

| Keyword pattern | Example | Intent | Page that targets it |
|---|---|---|---|
| {country} GDP growth rate | india gdp growth rate 2025 | Informational, quick fact | /{country}/indicator/ny-gdp-mktp-kd-zg/ |
| {country} inflation rate | india inflation rate | Informational | /{country}/indicator/fp-cpi-totl-zg/ |
| {country} unemployment rate | nigeria unemployment rate | Informational | /{country}/indicator/sl-uem-totl-zs/ |
| {country} GDP per capita | indonesia gdp per capita | Informational | /{country}/indicator/ny-gdp-pcap-cd/ |
| {country} GDP by industry / sector | india gdp by sector | Research | /{country}/ (overview) plus industry pages |
| {country} agriculture statistics | india agriculture statistics | Research (students, analysts) | /{country}/agriculture/ |
| agriculture share of GDP {country} | agriculture share of gdp india | Quick fact | /{country}/indicator/nv-agr-totl-zs/ |
| {country} healthcare spending % of GDP | us health expenditure % gdp | Quick fact | /{country}/indicator/sh-xpd-chex-gd-zs/ |
| {country} renewable energy share | china renewable energy share | Quick fact | /{country}/indicator/eg-fec-rnew-zs/ |
| {country} government debt to GDP | japan debt to gdp | Quick fact | /{country}/indicator/gc-dod-totl-gd-zs/ |
| economic indicators by country dashboard | economic indicators dashboard | Navigational/tool | / |
| compare economies / country comparison | india vs china economy | Comparison | "Other countries" tables on indicator pages (dedicated vs pages later) |
| government policy tracker | economic policy tracker india | Tool | Policy feed (placeholder, see content plan) |
| free economic data API | world bank data api json | Developer | /api/ |

GEO (AI search): the factual one-sentence summaries ("India's X was Y in YEAR (World Bank, CODE)"), the FAQPage JSON-LD, /llms.txt and /llms-full.txt are written so assistants can quote GovPulse with a source and year.

## 2. Content plan (free, mostly automated)
1. **Done in v6:** 260 indicator pages (10 countries × 26 indicators) with a summary, a chart, peer countries, related indicators and an FAQ.
2. **Next:** "{A} vs {B} economy" comparison pages for the 45 country pairs, generated from the same data and linked from the indicator peer tables.
3. **Monthly "What changed" post** from the nightly pipeline diff (new data years, biggest moves), published at /updates/ with an RSS feed.
4. **Policy feed:** connect GDELT and official gazettes (still a placeholder) and tag each item to an industry. This is the "government policy tracker" keyword.
5. **Expand countries** towards the G20, then all World Bank economies. Each country adds about 33 pages.
6. **Explainers:** "How to read cereal yield", "Why debt-to-GDP lags by 2 years". Evergreen and easy to link to.
7. Track results in Search Console: impressions by query, then improve the titles of pages that get impressions but low CTR.

## 3. Free distribution channels
| Channel | How (no spam) | Asset |
|---|---|---|
| Reddit r/dataisbeautiful | Post one striking chart, [OC] tag, source in comment, follow the sub's rules | e.g. a 2000–2025 agriculture-share-of-GDP comparison |
| Reddit r/economics, r/IndiaInvestments, r/geography | Answer questions with a link only where it fits; read each sub's self-promotion rules | Indicator pages |
| Hacker News, Show HN | "Show HN: Free open-source economic dashboards with a static JSON API" | GitHub repo plus /api |
| Product Hunt | Launch on a Tuesday to Thursday, with a maker comment explaining the free + sponsor model | Screenshots, demo GIF |
| LinkedIn | Weekly chart post from the owner's profile; tag economists and data journalists | Monthly "What changed" |
| X / Twitter | Daily auto-chart thread (#dataviz #economics) | OG images |
| Kaggle | Publish the nightly dataset (CSV/Parquet) with a link back | pipeline output |
| GitHub awesome lists | PR to awesome-public-datasets, awesome-json-datasets, awesome-economics, awesome-dataviz | /api docs |
| Wikipedia | **Do not add links to our site.** Only cite primary sources (World Bank). Wikipedia is useful for research, not promotion | n/a |
| Newsletters | Pitch Data Is Plural, Python Weekly, Indian fintech newsletters | Free API angle |
| University courses | Email economics lecturers: "free, citable dashboards for class" | Methodology page |
| Bing Webmaster and Google Search Console | Submit the sitemap; IndexNow is already wired | sitemap-index.xml |

## 4. Sponsor prospects (research shortlist)
| # | Organisation | URL | Why they might sponsor |
|---|---|---|---|
| 1 | Rainmatter Foundation (Zerodha) | https://rainmatter.org | Funds public-interest and open-ecosystem projects in India; India is our lead country |
| 2 | Razorpay | https://razorpay.com | Indian fintech that invests in SME and economy education; a natural fit for the India industry dashboards |
| 3 | Groww | https://groww.in | Investor-education focus; macro context for retail investors |
| 4 | smallcase | https://www.smallcase.com | Sector-themed investing; fits our industry dashboards |
| 5 | Tickertape | https://www.tickertape.in | Indian market data and analysis platform; audience overlap |
| 6 | Koyfin | https://www.koyfin.com | Macro and markets dashboards for investors; brand fit with "Presented by" on finance |
| 7 | Wise | https://wise.com | Cross-border money; audiences researching other countries' economies |
| 8 | Stripe | https://stripe.com | Supports economics and open-internet work (Stripe Press, Atlas); global SMB audience |
| 9 | Datawrapper | https://www.datawrapper.de | Chart tool for journalists; sponsors data-journalism projects |
| 10 | Flourish (Canva) | https://flourish.studio | Data-visualisation brand; open-data storytelling |
| 11 | Observable | https://observablehq.com | Open data notebooks; developer audience from our API |
| 12 | Snowflake Marketplace | https://www.snowflake.com/en/data-cloud/marketplace/ | Promotes public datasets; possible data-partner listing |
| 13 | Databricks | https://www.databricks.com | Open-data and community programmes; Delta Sharing public datasets |
| 14 | Hugging Face | https://huggingface.co | Hosts open datasets; GEO/LLM angle via llms.txt and the data |
| 15 | DataCamp (DataCamp Donates) | https://www.datacamp.com | Data-literacy edtech; classroom use of real economic data |
| 16 | Marginal Revolution University | https://mru.org | Economics edtech; free teaching data |
| 17 | Nasdaq Data Link | https://data.nasdaq.com | Data marketplace; attracts users interested in macro data |
| 18 | Observer Research Foundation | https://www.orfonline.org | Indian think tank on economy and policy; policy-tracker fit |
| 19 | Carnegie India | https://carnegieindia.org | Tech and economic policy research in India |
| 20 | Brookings Institution | https://www.brookings.edu | Global economy and development research; open-data advocacy |
| 21 | Peterson Institute (PIIE) | https://www.piie.com | International economics; country comparisons |
| 22 | Omidyar Network India | https://www.omidyarnetwork.in | Backs digital public goods and open data in India |
| 23 | Alfred P. Sloan Foundation | https://sloan.org | Grants for economics research and open data infrastructure (grant rather than logo sponsor) |

Think tanks and foundations usually fund through **grants or partnerships** rather than logo sponsorship. Pitch them a "funded data source" (for example "OECD data integration, funded by X"), and keep the no-influence disclosure.

## 5. Outreach email template (draft only, do not send without owner approval)
**Subject:** Sponsor free, open economic data for {country/industry}?

Hi {First name},

I run GovPulse (https://govpulse.pages.dev), a free dashboard of economic indicators by country and industry, built on World Bank data. Every number shows its source and year, and it has a free public JSON API.

{One line on why them, e.g. "Your investor-education work at Groww and our India finance and industry dashboards reach the same people."}

We're funded by sponsors instead of paywalls. A {Silver/Gold} sponsorship ({$250/$1,000} a month) would fund {specific item: adding OECD data / 10 more countries / the policy tracker} and show a clearly labelled "{Supported by / Presented by} {Company}" on {placement}. Sponsors never influence data or content. Our disclosure policy is at https://govpulse.pages.dev/sponsor/#disclosure.

Could we have a 15-minute call next week? I'm happy to share traffic numbers once Search Console data comes in.

Thanks,
{Owner name}
GovPulse · sadam.veekshtih007@gmail.com

## 6. Metrics to watch
Search Console impressions and clicks per page type, top queries, AI-referral traffic (referrers chatgpt.com, perplexity.ai, copilot), API hits, /sponsor visits, and sponsor conversions.
