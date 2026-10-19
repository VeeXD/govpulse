import { COUNTRIES, INDUSTRIES, DATA, kpis, series, fmt } from './data';
import { SITE } from '../config/site';
/** lower-case words but keep acronyms (GDP, CPI, CO2) */
export const lc = (t: string) => t.replace(/\b([A-Z])([a-z]+)/g, (_, a, b) => a.toLowerCase() + b);
export const slug = (code: string) => code.toLowerCase().replace(/\./g, '-');
export const unslug = (s: string) => Object.keys(DATA.indicators).find(c => slug(c) === s)!;
const poss = (n: string) => n.endsWith('s') ? `${n}'` : `${n}'s`;
const the = (n: string) => /^(United|UAE)/.test(n) ? `the ${n}` : n;
export function valText(v: number | null, unit: string) {
  if (v == null) return 'not available';
  if (unit === 'US$') return `US$${Math.round(v).toLocaleString('en-US')}`;
  const s = fmt(v, unit);
  if (unit === '%') return s;
  if (unit.startsWith('% ')) return `${s} of ${unit.slice(2).replace(/^GDP$/, 'GDP')}`;
  if (unit.startsWith('%')) return s;
  return `${s} ${unit}`;
}
/** Factual sentence from data, e.g. "India's agriculture value added was 16.4% of GDP in 2024 (World Bank, NV.AGR.TOTL.ZS), down from 16.7% in 2023." */
export function sentence(country: string, k: any) {
  const C = COUNTRIES[country]; if (k.value == null) return null;
  const dir = k.delta == null ? '' : k.delta > 0 ? `, up from ${valText(k.value - k.delta, k.unit)} in ${k.prevYear}` : k.delta < 0 ? `, down from ${valText(k.value - k.delta, k.unit)} in ${k.prevYear}` : `, unchanged from ${k.prevYear}`;
  return `${poss(C.name).replace(/^(United|UAE)/, 'The $1')} ${lc(k.label)} was ${valText(k.value, k.unit)} in ${k.year} (World Bank, ${k.code})${dir}.`;
}
export function pageSeo(country: string, industry: string) {
  const C = COUNTRIES[country]; const ind = INDUSTRIES.find(i => i.id === industry)!; const ks = kpis(country, industry).filter((k: any) => k.value != null);
  const yr = Math.max(...ks.map((k: any) => k.year));
  const top = ks.slice(0, 3).map((k: any) => lc(k.label.replace(/ \(.*\)/, '')));
  const title = industry === 'overview'
    ? `${C.name} economy ${yr}: GDP growth, inflation, unemployment & debt`
    : `${C.name} ${ind.name.toLowerCase()} statistics ${yr}: ${top.join(', ')}`;
  const sentences = ks.map((k: any) => sentence(country, k)).filter(Boolean) as string[];
  const desc = (sentences[0] ?? '') + ` Free ${ind.name.toLowerCase()} indicators for ${the(C.name)} with charts, sources and data years.`;
  const faq = [
    ...ks.slice(0, 4).map((k: any) => [`What is ${poss(the(C.name))} ${lc(k.label.replace(/ \(.*\)/, ''))}?`, sentence(country, k)!]),
    [`Where does this ${C.name} data come from?`, `From the World Bank World Development Indicators (CC BY 4.0), refreshed nightly by an automated pipeline. Official statistics are usually published with a 1 to 2 year lag, so each figure shows its data year.`],
    [`Is GovPulse free?`, `Yes. All dashboards, filters and the JSON API (/api/v1/${country}.json) are free.`],
  ];
  const crumbs = [['Home', `${SITE}/`], [C.name, `${SITE}/${country}/`], ...(industry === 'overview' ? [] : [[ind.name, `${SITE}/${country}/${industry}/`]])];
  return { title, desc: desc.slice(0, 300), sentences, faq, crumbs, yr };
}
export const faqLd = (faq: string[][]) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
export const crumbLd = (c: string[][]) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: c.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) });
export function indicatorList() { return Object.entries(DATA.indicators).map(([code, m]: any) => ({ code, ...m })); }
export { series };
/** Latest value per country for an indicator, ranked (desc). */
export function ranked(code: string) {
  return Object.entries(COUNTRIES).map(([id, c]) => { const s = series(id, code); const l = s.at(-1); return { id, name: c.name, v: l?.[1] ?? null, y: l?.[0] ?? null }; })
    .filter(x => x.v != null).sort((a, b) => (b.v as number) - (a.v as number));
}
export const meta = (code: string) => (DATA.indicators as any)[code];
export const cell = (code: string, id: string) => { const l = series(id, code).at(-1); return l ? `${valText(l[1], meta(code).unit)} (${l[0]})` : '—'; };
export function moves(id: string, years = 5) {
  return Object.keys(DATA.indicators).map(code => { const s = series(id, code); const l = s.at(-1); const f = l ? [...s].reverse().find(p => p[0] <= l[0] - years) : undefined;
    return l && f ? { code, label: meta(code).label, unit: meta(code).unit, from: f, to: l, d: l[1] - f[1], rel: Math.abs((l[1] - f[1]) / (Math.abs(f[1]) || 1)) } : null; }).filter(Boolean) as any[];
}
