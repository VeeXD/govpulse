import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
const lastmod = JSON.parse(fs.readFileSync('./src/data/wb.json', 'utf8')).generated;
export default defineConfig({
  site: 'https://govpulse.pages.dev', output: 'static', trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  integrations: [react(), sitemap({ filter: p => !p.includes('/404') && !p.includes('/pricing') && !p.includes('/embed'), serialize: item => ({ ...item, lastmod: new Date(lastmod.endsWith('Z') ? lastmod : lastmod + 'Z').toISOString() }) })],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
