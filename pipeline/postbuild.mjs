// Post-build: external links -> new tab + rel + sr-only/icon hint. Idempotent.
import fs from 'node:fs'; import path from 'node:path';
const SITE = 'govpulse.pages.dev';
const icon = '<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-left:2px"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg><span class="sr-only"> (opens in new tab)</span>';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
let n = 0;
for (const f of walk('dist')) {
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<a\b([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (m, a, href, b, inner) => {
    if (href.includes(SITE) || /data-ext/.test(a + b)) return m; n++;
    return `<a${a}href="${href}"${b} target="_blank" rel="noopener noreferrer" data-ext>${inner}${icon}</a>`;
  });
  fs.writeFileSync(f, h);
}
console.log('external links processed:', n);
// CSP: hash every inline executable <script> so script-src needs no 'unsafe-inline'.
import crypto from 'node:crypto';
const hashes = new Set();
for (const f of walk('dist')) {
  const h = fs.readFileSync(f, 'utf8');
  for (const m of h.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || ''; if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs) || !m[2].trim()) continue;
    hashes.add(`'sha256-${crypto.createHash('sha256').update(m[2]).digest('base64')}'`);
  }
}
const hp = 'dist/_headers'; fs.writeFileSync(hp, fs.readFileSync(hp, 'utf8').replace('__SCRIPT_HASHES__', [...hashes].join(' ')));
console.log('CSP inline script hashes:', hashes.size);
