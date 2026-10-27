// Shared by Dashboard + /embed: parse compare state, build overlay series, CSV export.
export type Pt = [number, number];
export type Ref = { c: string; code: string };
export const PALETTE = ['#FFB224', '#FF6A45', '#E6E6E6', '#FFD27A', '#FFA58F', '#9A9A9A'];
export const MAX_SERIES = 6;
export const COUNTRY_NAMES: Record<string, string> = { india: 'India', usa: 'United States', china: 'China', uk: 'United Kingdom', germany: 'Germany', japan: 'Japan', brazil: 'Brazil', indonesia: 'Indonesia', nigeria: 'Nigeria', uae: 'UAE' };
/** World Bank indicator codes look like NY.GDP.MKTP.KD.ZG — reject anything else from the URL. */
export const isCode = (c: string | null | undefined) => !!c && /^[A-Z]{1,3}(?:\.[A-Z0-9]{1,12}){1,6}$/.test(c);
export const isCountry = (c: string | null | undefined): c is string => !!c && !!COUNTRY_NAMES[c];
export const parseCmp = (s: string | null): Ref[] => (s ?? '').split(',').map(x => x.split('~')).filter(x => x.length === 2 && isCountry(x[0]) && isCode(x[1])).map(([c, code]) => ({ c, code })).slice(0, MAX_SERIES - 1);
export const fmtCmp = (r: Ref[]) => r.map(x => `${x.c}~${x.code}`).join(',');
const cache: Record<string, Promise<Record<string, Pt[]>>> = {};
export const loadCountry = (c: string) => {
  if (!isCountry(c)) return Promise.reject(new Error('unknown country'));
  return (cache[c] ??= fetch(`/api/v1/${encodeURIComponent(c)}.json`).then(r => { if (!r.ok) throw new Error('load failed'); return r.json(); }).then(j => j.series));
};
export function seed(c: string, d: Record<string, Pt[]>) { cache[c] ??= Promise.resolve(d); }
export type Built = { name: string; data: Pt[]; unit: string };
/** Build chart series: filter to range; optional index (first in-range value = 100, needs positive base). */
export function build(items: { name: string; unit: string; data: Pt[] }[], range: [number, number], idx: boolean): { series: Built[]; skipped: string[] } {
  const skipped: string[] = []; const series: Built[] = [];
  for (const it of items) {
    let pts = it.data.filter(p => p[0] >= range[0] && p[0] <= range[1]);
    if (idx) { const b = pts[0]?.[1]; if (!b || b <= 0) { skipped.push(it.name); continue; } pts = pts.map(([y, v]) => [y, +(v / b * 100).toFixed(2)]); }
    series.push({ name: it.name, data: pts, unit: idx ? `index (${pts[0]?.[0]} = 100)` : it.unit });
  }
  return { series, skipped };
}
export const units = (s: Built[]) => [...new Set(s.map(x => x.unit))];
export function csv(s: Built[]) {
  const ys = [...new Set(s.flatMap(x => x.data.map(p => p[0])))].sort((a, b) => a - b);
  const q = (t: string) => `"${t.replace(/"/g, '""')}"`;
  return [['Year', ...s.map(x => `${x.name} (${x.unit})`)].map(q).join(','), ...ys.map(y => [y, ...s.map(x => x.data.find(p => p[0] === y)?.[1] ?? '')].join(','))].join('\n') + '\n';
}
export function download(name: string, href: string) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
