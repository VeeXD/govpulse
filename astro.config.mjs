import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  site: 'https://govpulse.pages.dev', output: 'static', trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  integrations: [react(), sitemap({ filter: p => !p.includes('/404') })],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
