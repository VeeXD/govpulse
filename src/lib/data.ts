import wb from '../data/wb.json';
export type Series = [number, number][];
export const DATA = wb as any;
export const COUNTRIES: Record<string, { name: string; iso: string; flag: string; lat: number; lng: number; region: string }> = {
  india: { name: 'India', iso: 'IND', flag: 'IN', lat: 21, lng: 78, region: 'South Asia' },
  usa: { name: 'United States', iso: 'USA', flag: 'US', lat: 39, lng: -98, region: 'North America' },
  china: { name: 'China', iso: 'CHN', flag: 'CN', lat: 35, lng: 104, region: 'East Asia' },
  uk: { name: 'United Kingdom', iso: 'GBR', flag: 'GB', lat: 54, lng: -2, region: 'Europe' },
  germany: { name: 'Germany', iso: 'DEU', flag: 'DE', lat: 51, lng: 10, region: 'Europe' },
  japan: { name: 'Japan', iso: 'JPN', flag: 'JP', lat: 36, lng: 138, region: 'East Asia' },
  brazil: { name: 'Brazil', iso: 'BRA', flag: 'BR', lat: -10, lng: -52, region: 'Latin America' },
  indonesia: { name: 'Indonesia', iso: 'IDN', flag: 'ID', lat: -2, lng: 118, region: 'Southeast Asia' },
  nigeria: { name: 'Nigeria', iso: 'NGA', flag: 'NG', lat: 9, lng: 8, region: 'Sub-Saharan Africa' },
  uae: { name: 'United Arab Emirates', iso: 'ARE', flag: 'AE', lat: 24, lng: 54, region: 'Middle East' },
};
export const INDUSTRIES = [
  { id: 'overview', name: 'Overview', icon: 'LayoutDashboard' },
  { id: 'it', name: 'IT & digital', icon: 'Cpu' },
  { id: 'healthcare', name: 'Health', icon: 'HeartPulse' },
  { id: 'finance', name: 'Finance', icon: 'Landmark' },
  { id: 'agriculture', name: 'Agriculture', icon: 'Wheat' },
  { id: 'trade', name: 'Imports & exports', icon: 'ArrowLeftRight' },
  { id: 'energy', name: 'Energy', icon: 'Zap' },
  { id: 'manufacturing', name: 'Manufacturing', icon: 'Factory' },
  { id: 'other', name: 'Other (population, tourism, life)', icon: 'Globe' },
] as const;
export function series(c: string, code: string): Series { return DATA.countries[c]?.[code] ?? []; }
export function meta(code: string) { return DATA.indicators[code]; }
export function kpis(c: string, industry: string) {
  return Object.entries(DATA.indicators).filter(([, m]: any) => m.industry === industry).map(([code, m]: any) => {
    const s = series(c, code); const last = s.at(-1); const prev = s.at(-2);
    return { code, ...m, series: s, value: last?.[1] ?? null, year: last?.[0] ?? null, delta: last && prev ? last[1] - prev[1] : null, prevYear: prev?.[0] };
  });
}
export function fmt(v: number | null, unit = '') {
  if (v == null) return '—';
  const a = Math.abs(v);
  const s = a >= 1e4 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a >= 100 ? v.toFixed(0) : v.toFixed(1);
  return unit.startsWith('%') ? s + '%' : s;
}
/* OKLCH → sRGB hex so chart ramps are interpolated perceptually (color-expert skill) */
function oklchToHex(L: number, C: number, h: number) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  const t = (x: number) => { x = Math.min(1, Math.max(0, x)); x = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; return Math.round(x * 255).toString(16).padStart(2, '0'); };
  return '#' + t(r) + t(g) + t(bl);
}
/* blue(255°) → amber(75°) ramp via the long way through teal/green avoided: go through violet-free path by lerping L/C and hue through 255→435(75) */
/* teal(200°) → rust(40°) in OKLCH at constant L=0.78 so every step is text-safe on card */
export const RAMP = Array.from({ length: 6 }, (_, i) => { const k = i / 5; return oklchToHex(0.80 - 0.03 * k, 0.11, 200 - 160 * k); });
export const TOKENS = { surface: '#0A0A0A', card: '#141414', line: '#3A3A3A', primary: '#D4D4D4', link: '#FFFFFF', accent: '#FFB224', signal: '#FF6A45', cta: '#FFB224', text: '#E6E6E6', muted: '#A3A3A3', up: '#FFC857', down: '#FF6A45' };
export function change(c: string, code: string, span = 10) {
  const s = series(c, code); if (s.length < 2) return null;
  const last = s.at(-1)!; const base = s.find(([y]) => y >= last[0] - span) ?? s[0];
  return { from: base, to: last, diff: last[1] - base[1] };
}
/* Claim Check cards: claim text is a generic template; every number is computed from real WB series */
export function claims(c: string) {
  const n = COUNTRIES[c].name; const out: any[] = [];
  const add = (claim: string, code: string, counter: string, note: (x: any, y: any) => string) => {
    const a = change(c, code), b = change(c, counter); if (!a || !b) return;
    out.push({ claim, a: { ...a, ...meta(code), code }, b: { ...b, ...meta(counter), code: counter }, note: note(a, b) });
  };
  add(`"${n}'s exports are booming."`, 'NE.EXP.GNFS.ZS', 'NE.IMP.GNFS.ZS', (a, b) => `Exports moved ${a.diff >= 0 ? '+' : ''}${a.diff.toFixed(1)} pts of GDP; imports moved ${b.diff >= 0 ? '+' : ''}${b.diff.toFixed(1)} pts. Look at both before calling it a boom.`);
  add(`"We've massively increased health spending."`, 'SH.XPD.CHEX.GD.ZS', 'SP.DYN.IMRT.IN', (a, b) => `Spending share changed ${a.diff >= 0 ? '+' : ''}${a.diff.toFixed(1)} pts; infant mortality changed ${b.diff >= 0 ? '+' : ''}${b.diff.toFixed(1)} per 1,000. Outcomes are the counterweight to inputs.`);
  add(`"Manufacturing is the engine of growth."`, 'NV.IND.MANF.ZS', 'NV.IND.TOTL.ZS', (a, b) => `Manufacturing share of GDP changed ${a.diff >= 0 ? '+' : ''}${a.diff.toFixed(1)} pts vs industry overall ${b.diff >= 0 ? '+' : ''}${b.diff.toFixed(1)} pts.`);
  return out;
}
