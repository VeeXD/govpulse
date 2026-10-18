import { COUNTRIES, INDUSTRIES, DATA, kpis } from '../lib/data'; import { SITE } from '../config/site'; import { sentence, slug } from '../lib/seo';
export function GET() {
  let out = `# GovPulse: full data summary\n\nGenerated ${DATA.generated} UTC from World Bank World Development Indicators (CC BY 4.0). Each line: latest value, data year, previous year, indicator code and page URL.\n\n## Indicators\n${Object.entries(DATA.indicators).map(([code, m]: any) => `- ${code}: ${m.label} (${m.unit}), industry: ${m.industry}`).join('\n')}\n`;
  for (const [id, c] of Object.entries(COUNTRIES)) {
    out += `\n## ${c.name} (${c.iso}, ${c.region})\n`;
    for (const ind of INDUSTRIES) { const ks = kpis(id, ind.id).filter((k: any) => k.value != null); if (!ks.length) continue;
      out += `\n### ${c.name}: ${ind.name}\n` + ks.map((k: any) => `- ${sentence(id, k)} ${SITE}/${id}/indicator/${slug(k.code)}/`).join('\n') + '\n'; }
  }
  return new Response(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
