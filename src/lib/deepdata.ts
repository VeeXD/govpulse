import raw from '../data/deep.json';
import { DATA, COUNTRIES } from './data';
import { CM, cropName } from './commodity';
export const D: any = raw;
export const CS = Object.keys(COUNTRIES);
export const nm = (c: string) => COUNTRIES[c]?.name ?? c;
export const wb = (c: string, code: string): [number, number][] => DATA.countries[c]?.[code] ?? [];
export const last = (s: [number, number][]) => s.at(-1);
export const scale = (s: [number, number][], k: number, d = 2) => s.map(([y, v]) => [y, +(v / k).toFixed(d)] as [number, number]);
export const hsName = (h: string) => { const s = (D.hs2?.[h] ?? `HS ${h}`).split(';')[0]; return s.length > 70 ? s.slice(0, 68).replace(/[ ,]+\S*$/, '') + '…' : s; };
export const MANUF = (h: string) => +h >= 28 && +h <= 96 && h !== '71';
export const AGRI = (h: string) => +h >= 1 && +h <= 24;
export const top = (o: Record<string, number> = {}, f = (_: string) => true, n = 10) => Object.entries(o).filter(([h]) => f(h)).sort((a, b) => b[1] - a[1]).slice(0, n);
/** For one HS chapter, values for every tracked country (flow X or M), largest first. */
export const across = (h: string, fl: 'X' | 'M') => CS.map(c => ({ c, v: D.trade[c]?.[fl]?.[h] ?? 0, y: D.trade[c]?.year })).filter(r => r.v).sort((a, b) => b.v - a.v);
export const SRC = {
  ct: 'UN Comtrade public preview API, HS 2-digit, reported values (US$)',
  wb: 'World Bank WDI (CC BY 4.0)',
  fao: 'FAOSTAT QCL and Food Balance Sheets, FAO (CC BY 4.0)',
  owid: 'Our World in Data energy dataset (Energy Institute Statistical Review, Ember), CC BY 4.0',
};
export const cropSlug = (item: string) => Object.keys(CM.crops).find(k => CM.crops[k].item === item || cropName(k) === item);
export const TWH = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(2)} PWh` : `${v.toFixed(0)} TWh`;
