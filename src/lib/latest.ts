import L from '../data/latest.json';
import { COUNTRIES } from './data';
export const LATEST = L as any;
export const KEYS = [
  { k: 'inflation', label: 'Inflation', unit: '% y/y', good: false, what: 'how fast consumer prices are rising compared with a year earlier' },
  { k: 'unemployment', label: 'Unemployment', unit: '% labour force', good: false, what: 'the share of people who want work but have none' },
  { k: 'policyRate', label: 'Policy interest rate', unit: '%', good: null, what: 'the central bank rate that steers borrowing costs' },
  { k: 'gdpGrowth', label: 'GDP growth', unit: '%', good: true, what: 'how fast the economy\'s real output is growing' },
] as const;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const period = (p: string) => /^\d{4}-\d{2}$/.test(p) ? `${MON[+p.slice(5) - 1]} ${p.slice(0, 4)}` : p.replace('-Q', ' Q');
export const n = (v: number) => v.toFixed(Math.abs(v) >= 10 ? 1 : 2).replace(/\.?0+$/, '') ;
/** One plain sentence built only from the numbers. */
export function explain(c: string, key: string) {
  const r = LATEST.countries[c]?.[key]; const K = KEYS.find(x => x.k === key)!; if (!r) return `No recent ${K.label.toLowerCase()} reading for ${COUNTRIES[c].name}.`;
  const d = r.change; const dir = Math.abs(d) < 0.005 ? 'was unchanged at' : d > 0 ? `rose ${n(Math.abs(d))} pts to` : `fell ${n(Math.abs(d))} pts to`;
  return `${COUNTRIES[c].name}'s ${r.note ? 'lending rate' : K.label.replace(/\b[A-Z][a-z]+/g, w => w.toLowerCase())} (${K.what}) ${dir} ${n(r.value)}% in ${period(r.period)}, from ${n(r.prev)}% in ${period(r.prevPeriod)}.`;
}
