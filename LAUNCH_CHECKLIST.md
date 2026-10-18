# GovPulse launch checklist (v3, 2026-10-18)

Live: https://govpulse.pages.dev · Repo: VeeXD/govpulse · Reports: `reports/` (Lighthouse JSON, axe JSON)

## Bug fixes
| Item | Result |
|---|---|
| Claim card overflow (stacked year/value rows, tabular-nums, min-w-0, 1 column under 420px) | PASS: no overflow at 375/768/1024/1440 (automated bounding-box check on /, /india, /india/agriculture, /pricing, /credits, /api) |
| Charts: axes, axis names/units, gridlines, tooltips with year + exact values | PASS |
| Click chart or KPI sparkline opens an expanded modal (native `<dialog>`, Esc/close button, focus moves to close, dataZoom slider + wheel/pinch, hidden data table, source line) | PASS (verified live) |
| External links open in a new tab with `rel="noopener noreferrer"`, an icon and "(opens in new tab)" text | PASS (post-build pass over all HTML) |

## SEO
| Item | Result |
|---|---|
| Unique `<title>` + meta description per page (country/industry descriptions generated from KPIs) | PASS |
| Canonical URLs (trailing slash, matches Cloudflare and the sitemap) | PASS |
| Open Graph + Twitter `summary_large_image`; generated 1200×630 OG images (default + 10 countries) | PASS |
| sitemap (`@astrojs/sitemap`, `/sitemap-index.xml`) + robots.txt | PASS |
| JSON-LD: Organization, WebSite on every page; Dataset on every country/industry page | PASS |
| Semantic headings, alt text (decorative media `aria-hidden`), custom 404 (noindex) | PASS |
| Lighthouse SEO | 100 on all audited pages |

## Performance (Lighthouse, mobile emulation, headless Chromium)
| Page | Perf | A11y | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Live / | 96 | 100 | 100 | 100 | 2.8 s | 0 |
| Live /india/ | 99 | 100 | 100 | 100 | 2.0 s | 0 |
| Live /india/agriculture/ | 97 | 100 | 100 | 100 | 2.6 s | 0 |
| Local preview / | 92 | 100 | 100 | 100 | 3.4 s | 0 |
| Local /india | 98 | 100 | 100 | 100 | 2.3 s | 0 |
| Local /india/agriculture | 94 | 100 | 100 | 100 | 3.0 s | 0 |

Target ≥85 mobile: PASS. Measures: videos are 12 s, 1280px, no audio, webm (VP9) + mp4 (H.264 faststart), 0.1–4 MB each, `preload="none"`, loaded only when on screen; posters are WebP. Fonts self-hosted (latin subset WOFF2), 2 preloaded, `font-display: swap`. ECharts is lazy-loaded on first chart render. CSS inlined. Immutable caching for hashed assets via `public/_headers`.

## Accessibility (axe-core 4 via Playwright, WCAG 2.0/2.1/2.2 A+AA tags)
PASS: 0 violations on /, /india, /india/agriculture, /pricing, /methodology, /api, /credits, /privacy, /404 at 1440 and 375 (one `scrollable-region-focusable` on /api was fixed). Contrast tokens measured ≥4.5:1 on the darkest card. Up/down use arrows + sr-only text. Reduced motion disables videos, Ken Burns, parallax, reveals, view transitions and the cursor; Save-Data shows posters only. Manual screen-reader testing: NOT DONE.

## Security
| Item | Result |
|---|---|
| CSP: `script-src 'self'` + sha256 hashes of inline scripts (no `unsafe-inline` for scripts), `frame-ancestors 'none'`, `object-src 'none'` | PASS (live header verified; 0 console errors live) |
| `style-src 'unsafe-inline'` | ACCEPTED RISK: Astro/ECharts inline styles |
| HSTS (2 years, preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP | PASS (live) |
| `/.well-known/security.txt` | PASS (contact address is a placeholder) |
| Secret scan of tracked files (GitHub/Cloudflare tokens, Stripe keys, AWS keys, private keys) | PASS: none found |
| `npm audit --omit=dev` | FAIL/PARTIAL: Astro ≤7.2.7 (critical), sharp (high), esbuild (low). The site ships static files only (no Astro server runtime, no image service at runtime), so exposure is build-time. Fix = upgrade to Astro 7, which needs Node ≥22 (box has 20). Do this in CI (Node 22) next. |

## Legal and compliance
| Page | Status |
|---|---|
| /privacy (GDPR bases table, CCPA rights, processors) | DONE, template: review before launch |
| /cookies (no cookies, so no banner) | DONE, template |
| /terms | DONE, template (refunds, governing law left for owner) |
| /disclaimer (not financial advice, data lag, sample content) | DONE, template |
| /credits (World Bank CC BY 4.0, every video/photo with author + licence + source, fonts OFL) | DONE |
| /contact, /accessibility | DONE |

**Cookie banner choice:** none needed. The site sets no cookies and no localStorage IDs. Analytics are Cloudflare Web Analytics (cookieless, no fingerprinting), switched on by setting `PUBLIC_CF_BEACON` at build time; CSP already allows it. If sign-in launches, only a strictly necessary session cookie is planned (no consent required, but list it).

## Payments (superseded in v6)
(v6) No paid plans: GovPulse is free; funding is through sponsorship (/sponsor, Zelle).

## Public API
Static JSON generated at build: `/api/v1/index.json`, `/api/v1/countries.json`, `/api/v1/indicators.json`, `/api/v1/{country}.json`, `/api/v1/{country}/{indicator}.json` (~250 series). CORS `*`, 1 h cache, `license` and `attribution` fields. Documented at /api. PASS.

## Ops
| Item | Status |
|---|---|
| Nightly workflow `.github/workflows/nightly.yml` (refresh World Bank → commit → build → wrangler deploy) | READY, needs repo secrets |
| Error pages (404) | PASS |
| Analytics | READY (needs beacon token) |
| Favicon SVG, PNG icons 180/192/512, manifest.webmanifest | PASS |
| Uptime monitoring | IDEA: free UptimeRobot/Better Stack check on `/` and `/api/v1/index.json` every 5 min, alerts to email |

## Needs owner
1. (v6: no longer needed, the site is free.) Payment merchant account.
2. Legal review of Privacy, Cookies, Terms and Disclaimer; legal entity name, address, governing law, refund policy.
3. Real contact inbox (replace `hello@govpulse.example` in `src/config/site.ts`) and security contact in `security.txt`.
4. Cloudflare Web Analytics token → `PUBLIC_CF_BEACON`.
5. GitHub repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` so the nightly workflow can deploy (it will fail until set).
6. Custom domain (optional, ~$10/yr); then update `SITE` in `astro.config.mjs` and `src/config/site.ts`.
7. Approve upgrading to Node 22 / Astro 7 to clear the audit findings.

## v4 update (2026-10-18)
| Item | Result |
|---|---|
| Node 22 + Astro 7.4 (nightly workflow on Node 22) | PASS. `npm audit --omit=dev`: 0 vulnerabilities |
| Warm accents: amber #FFB224 (10.2:1 on cards), signal red-orange #FF6A45 (6.5:1) | PASS |
| Media shown in natural colour with a warm grade (no grayscale) | PASS |
| India hero + every India tab use new aerial, timelapse and interior clips (Wikimedia Commons, recorded in media.json + /credits) | PASS |
| Sticky filter bar (year range, industry, metric A vs B on dual axes, country vs country): locked for free users; `?pro=1` preview works on localhost only | PASS |
| Live WebGL Earth (three.js, NASA Blue Marble + Black Marble), poster fallback for no WebGL, reduced motion and Save-Data | PASS (renders in headless SwiftShader) |
| axe WCAG 2.2 AA: 13 pages × 2 widths | PASS, 0 violations |
| Lighthouse mobile: home 87, /india 97, /india/agriculture 92, /india/healthcare 95, /pricing 96. A11y, best practices and SEO: 100 | PASS |
| Overflow at 375/768/1024/1440 | PASS, none |

## v5 update (2026-10-18)
| Item | Result |
|---|---|
| Home hero: no clipping at 1024×666, 1280×720, 1440×900, 375×667 (buttons sit inside hero) | PASS |
| Industry video backgrounds removed, replaced by an interactive dot field that changes formation per industry, with a static version for reduced motion | PASS |
| India hero: owner-supplied Himalaya photo, warm grade, WebP 1920/960 | PASS |
| Industry tabs removed; the industry filter is free; other filters show a "Pro" tooltip on hover/focus | PASS |
| Credits and sources moved to the footer of every page; inline credit captions removed | PASS |
| Plans: Free (10 countries) and Pro $9.99/mo; Analyst, Enterprise and yearly billing removed | PASS |
| Contact sadam.veekshtih007@gmail.com (contact, footer, privacy, terms, security.txt) | PASS |

## v6 update (2026-10-18): free + growth mode
| Item | Result |
|---|---|
| Paid plans removed; /pricing returns 301 to /sponsor (`public/_redirects`); payments and entitlement config deleted | PASS |
| Basic filters (industry, year range, single metric chart) free for everyone; advanced comparisons marked "coming soon" | PASS |
| /sponsor: tiers, Zelle instructions (sadam.veekshith01@gmail.com), disclosure policy, FAQ JSON-LD; sponsor slots driven by `src/config/sponsors.ts` (empty) | PASS |
| Terms, privacy, cookies, contact and JSON-LD updated for a free service (WebSite isAccessibleForFree) | PASS |
| SEO/GEO: data-driven titles and meta, H1 with page intent, factual summary sentences, FAQPage, BreadcrumbList and Dataset JSON-LD, 260 per-indicator pages, internal links | PASS |
| /llms.txt and /llms-full.txt; robots.txt allows the major search and AI crawlers; sitemap lastmod | PASS |
| IndexNow key file and ping after deploy | PASS |
| Optional GSC (`PUBLIC_GSC_VERIFICATION`) and GA4 (`PUBLIC_GA4_ID`): gtag and consent banner load only when set (Consent Mode default denied); CSP widened only then | PASS (off by default) |

**Needs owner:** set `PUBLIC_GSC_VERIFICATION` and/or `PUBLIC_GA4_ID` as GitHub/Cloudflare build env vars if wanted; verify the site in Bing Webmaster Tools (it can import from GSC); confirm Zelle details; legal review of the sponsorship wording in the terms.
