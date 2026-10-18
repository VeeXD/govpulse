import { chromium } from 'playwright'; import AxeBuilder from '@axe-core/playwright'; import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4321';
const pages = ['/', '/india', '/india/agriculture', '/pricing', '/methodology', '/api', '/credits', '/privacy', '/404'];
const b = await chromium.launch(); const out = {};
for (const w of [1440, 375]) { const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
 for (const u of pages) { await p.goto(BASE + u, { waitUntil: 'networkidle' });
  const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  out[`${u}@${w}`] = r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(' '), msg: v.nodes[0]?.failureSummary?.slice(0, 160) })); }
 await ctx.close(); }
fs.writeFileSync('reports/axe.json', JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, v.length ? v.map(x => `${x.id}(${x.n}) ${x.sample}`).join(' | ') : 'PASS');
await b.close();
