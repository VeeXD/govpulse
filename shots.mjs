import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const pages = [['v2-home', '/'], ['v2-india', '/india'], ['v2-usa', '/usa'], ['v2-india-agriculture', '/india/agriculture'], ['v2-pricing', '/pricing'], ['v2-methodology', '/methodology'], ['v2-india-mobile', '/india', 375]];
for (const [n, u, w] of pages) {
  await p.setViewportSize({ width: w || 1440, height: 900 });
  await p.goto('http://localhost:4321' + u, { waitUntil: 'networkidle' });
  for (let y = 0; y < 6000; y += 500) { await p.mouse.wheel(0, 500); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(2500);
  await p.screenshot({ path: `shots/${n}.png`, fullPage: true });
}
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto('http://localhost:4321/'); await p.waitForTimeout(1500); console.log('errors',errs);
await b.close();
