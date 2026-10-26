/* Data-driven summary + FAQ for a country overview page. Every number comes from wb.json / deep.json at build time. */
import { COUNTRIES, series, meta } from './data';
import { D, hsName, top } from './deepdata';
const pct = (v: number, d = 1) => `${v.toFixed(d)}%`;
const usdB = (v: number) => v >= 1e12 ? `US$${(v / 1e12).toFixed(2)} trillion` : `US$${(v / 1e9).toFixed(1)} billion`;
export function countryFaq(country: string) {
  const C = COUNTRIES[country]; const n = C.name; const P = n.endsWith('s') ? `${n}'` : `${n}'s`;
  const get = (code: string) => { const s = series(country, code); const l = s.at(-1); const p = s.at(-2); return l ? { y: l[0], v: l[1], py: p?.[0], pv: p?.[1], code } : null; };
  const wb = (x: { y: number; code: string }) => `World Bank WDI, ${x.code}, ${x.y}`;
  const g = get('NY.GDP.MKTP.KD.ZG'), cpi = get('FP.CPI.TOTL.ZG'), un = get('SL.UEM.TOTL.ZS'), pop = get('SP.POP.TOTL'), pc = get('NY.GDP.PCAP.CD');
  const xg = get('NE.EXP.GNFS.ZS'), xm = get('TX.VAL.MRCH.CD.WT'), mm = get('TM.VAL.MRCH.CD.WT'), man = get('TX.VAL.MANF.ZS.UN'), ca = get('BN.CAB.XOKA.GD.ZS');
  const T = D.trade?.[country]; const tops = T ? top(T.X, () => true, 3) : [];
  const topTxt = tops.map(([h, v]) => `${hsName(h).toLowerCase()} (HS ${h}, ${usdB(v)})`).join('; ');
  const ctSrc = T ? `UN Comtrade, HS 2-digit, ${T.year}` : '';
  const trend = (x: any, unit = '%') => x?.pv == null ? '' : ` ${x.v > x.pv ? 'up' : x.v < x.pv ? 'down' : 'unchanged'} from ${unit === '%' ? pct(x.pv) : x.pv} in ${x.py}`;
  const summary: string[] = [];
  if (g && pc) summary.push(`${P} real GDP grew ${pct(g.v)} in ${g.y},${trend(g)}, according to the World Bank. GDP per capita was US$${Math.round(pc.v).toLocaleString('en-US')} in ${pc.y}.`);
  if (cpi) summary.push(`Consumer price inflation was ${pct(cpi.v)} in ${cpi.y},${trend(cpi)}${un ? `, and unemployment was ${pct(un.v)} of the labour force in ${un.y} (modelled ILO estimate)` : ''}.`);
  if (xg && xm && mm) summary.push(`Exports of goods and services equalled ${pct(xg.v)} of GDP in ${xg.y}. Merchandise exports were ${usdB(xm.v)} against merchandise imports of ${usdB(mm.v)}, a goods trade ${xm.v >= mm.v ? 'surplus' : 'deficit'} of ${usdB(Math.abs(xm.v - mm.v))}${ca ? `; the current account balance was ${pct(ca.v)} of GDP in ${ca.y}` : ''}.`);
  if (man) summary.push(`Manufactured goods made up ${pct(man.v)} of merchandise exports in ${man.y}.`);
  if (tops.length && T) summary.push(`By product, the largest export categories in ${T.year} were ${topTxt} (${ctSrc}).`);
  if (pop) summary.push(`The population was about ${(pop.v / 1e9).toFixed(2)} billion in ${pop.y}. Official statistics are published with a lag, so each figure carries its own data year; the page rebuilds whenever the data pipeline refreshes.`);
  const faq: [string, string][] = [];
  if (g) faq.push([`What is ${P} GDP growth in ${g.y}?`, `${P} real GDP growth was ${pct(g.v)} in ${g.y},${trend(g)} (${wb(g)}).`]);
  if (cpi) faq.push([`What is ${P} inflation rate?`, `Consumer price inflation (CPI, annual %) was ${pct(cpi.v)} in ${cpi.y},${trend(cpi)} (${wb(cpi)}).`]);
  if (tops.length && T) faq.push([`What are ${P} top exports?`, `The largest export categories in ${T.year} were ${topTxt} (${ctSrc}).${man ? ` Manufactures were ${pct(man.v)} of merchandise exports in ${man.y} (${wb(man)}).` : ''}`]);
  if (xm && mm) faq.push([`How much does ${n} export and import?`, `Merchandise exports were ${usdB(xm.v)} and merchandise imports ${usdB(mm.v)} in ${xm.y} (World Bank WDI, ${xm.code} and ${mm.code}).${xg ? ` Exports of goods and services were ${pct(xg.v)} of GDP in ${xg.y}.` : ''}`]);
  if (un) faq.push([`What is ${P} unemployment rate?`, `Unemployment was ${pct(un.v)} of the total labour force in ${un.y}, a modelled ILO estimate (${wb(un)}).`]);
  if (pop) faq.push([`What is ${P} population?`, `${n} had a population of ${Math.round(pop.v).toLocaleString('en-US')} in ${pop.y} (${wb(pop)}).`]);
  if (pc) faq.push([`What is ${P} GDP per capita?`, `GDP per capita was US$${Math.round(pc.v).toLocaleString('en-US')} (current US$) in ${pc.y} (${wb(pc)}).`]);
  faq.push([`Where does this ${n} data come from?`, `Macro indicators come from the World Bank World Development Indicators (CC BY 4.0) and product-level trade from the UN Comtrade public API, refreshed by an automated pipeline. Each answer above names its indicator code and data year.`]);
  const title = g && cpi ? `${n} GDP growth, inflation & exports ${g.y}: economy data` : `${n} economy data`;
  const desc = g && cpi && xm ? `${n} GDP growth was ${pct(g.v)} in ${g.y}, inflation ${pct(cpi.v)} (${cpi.y}) and merchandise exports ${usdB(xm.v)} (${xm.y}). Sourced charts, top exports, unemployment and population.` : '';
  return { summary: summary.join(' '), faq: faq.slice(0, 8), title, desc };
}
