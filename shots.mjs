import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
async function go(u, w = 1440) {
  await p.setViewportSize({ width: w, height: 900 }); await p.goto(BASE + u, { waitUntil: 'networkidle' });
  for (let y = 0; y < 9000; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(90); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(2500);
}
for (const [n, u, w] of [['home', '/'], ['india', '/india'], ['india-agriculture', '/india/agriculture'], ['pricing', '/pricing'], ['mobile-india', '/india', 375], ['mobile-home', '/', 375]]) {
  await go(u, w); await p.screenshot({ path: `shots/v3-${n}.png`, fullPage: true });
}
await go('/'); const card = p.locator('[data-claim]').first(); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200); await card.screenshot({ path: 'shots/v3-claim-card.png' });
await go('/', 375); const c2 = p.locator('[data-claim]').first(); await c2.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200); await c2.screenshot({ path: 'shots/v3-claim-card-375.png' });
await go('/india/agriculture'); await p.getByRole('button', { name: /Expand chart/ }).first().click(); await p.waitForTimeout(2500);
await p.mouse.move(720, 450); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/v3-chart-modal.png' });
console.log('errors', errs); await b.close();
