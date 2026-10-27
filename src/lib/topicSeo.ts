/* Build-time SEO copy for programmatic topic landing pages. Every number from wb.json / deep.json. */
import { COUNTRIES, DATA, series, TOKENS } from './data';
import { D, hsName, top } from './deepdata';
import { ranked, valText, slug, faqLd, crumbLd, lc } from './seo';
import { SITE } from '../config/site';

const pct = (v: number, d = 1) => `${v.toFixed(d)}%`;
const usdB = (v: number) => v >= 1e12 ? `US$${(v / 1e12).toFixed(2)} trillion` : v >= 1e9 ? `US$${(v / 1e9).toFixed(1)} billion` : `US$${(v / 1e6).toFixed(0)} million`;
const popTxt = (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(2)} billion` : `${(v / 1e6).toFixed(1)} million`;
const poss = (n: string) => n.endsWith('s') ? `${n}'` : `${n}'s`;
const the = (n: string) => /^(United|UAE)/.test(n) ? `the ${n}` : n;

export type TopicId = 'gdp-growth' | 'inflation-rate' | 'unemployment-rate' | 'top-exports' | 'population' | 'health-statistics';

export const TOPICS: { id: TopicId; path: string; h1Tpl: (n: string, y: number) => string; queryTpl: (n: string) => string; code?: string; dots: string; industry: string }[] = [
  { id: 'gdp-growth', path: 'gdp-growth', h1Tpl: (n, y) => `${n} GDP growth ${y}`, queryTpl: n => `${n} GDP growth`, code: 'NY.GDP.MKTP.KD.ZG', dots: 'finance', industry: 'overview' },
  { id: 'inflation-rate', path: 'inflation-rate', h1Tpl: (n, y) => `${n} inflation rate ${y}`, queryTpl: n => `${n} inflation rate`, code: 'FP.CPI.TOTL.ZG', dots: 'finance', industry: 'finance' },
  { id: 'unemployment-rate', path: 'unemployment-rate', h1Tpl: (n, y) => `${n} unemployment rate ${y}`, queryTpl: n => `${n} unemployment rate`, code: 'SL.UEM.TOTL.ZS', dots: 'overview', industry: 'overview' },
  { id: 'top-exports', path: 'top-exports', h1Tpl: (n, y) => `${n} top exports ${y}`, queryTpl: n => `${n} top exports`, dots: 'manufacturing', industry: 'manufacturing' },
  { id: 'population', path: 'population', h1Tpl: (n, y) => `${n} population ${y}`, queryTpl: n => `${n} population`, code: 'SP.POP.TOTL', dots: 'overview', industry: 'overview' },
  { id: 'health-statistics', path: 'health-statistics', h1Tpl: (n, y) => `${n} health statistics ${y}`, queryTpl: n => `${n} health statistics`, dots: 'healthcare', industry: 'healthcare' },
];

export const RANKINGS = [
  { id: 'inflation-by-country', path: '/inflation-by-country/', code: 'FP.CPI.TOTL.ZG', h1: 'Inflation by country', title: (y: number) => `Inflation by country ${y}: CPI rates ranked`, dots: 'finance' },
  { id: 'gdp-growth-by-country', path: '/gdp-growth-by-country/', code: 'NY.GDP.MKTP.KD.ZG', h1: 'GDP growth by country', title: (y: number) => `GDP growth by country ${y}: real growth rates ranked`, dots: 'finance' },
  { id: 'unemployment-by-country', path: '/unemployment-by-country/', code: 'SL.UEM.TOTL.ZS', h1: 'Unemployment by country', title: (y: number) => `Unemployment by country ${y}: labour force rates ranked`, dots: 'overview' },
] as const;

function get(country: string, code: string) {
  const s = series(country, code);
  const l = s.at(-1); const p = s.at(-2);
  return l ? { y: l[0], v: l[1], py: p?.[0], pv: p?.[1], s, code } : null;
}
function trend(x: { v: number; pv?: number; py?: number } | null, asPct = true) {
  if (!x || x.pv == null) return '';
  const a = asPct ? pct(x.pv) : String(x.pv);
  return x.v > x.pv ? ` up from ${a} in ${x.py}` : x.v < x.pv ? ` down from ${a} in ${x.py}` : ` unchanged from ${a} in ${x.py}`;
}
function peers(code: string, country: string, n = 3) {
  return ranked(code).filter(x => x.id !== country).slice(0, n);
}

export function topicPage(country: string, topic: TopicId) {
  const C = COUNTRIES[country]; const n = C.name; const P = poss(n); const T = the(n);
  const def = TOPICS.find(t => t.id === topic)!;
  const related = TOPICS.filter(t => t.id !== topic).map(t => ({ href: `/${country}/${t.path}/`, label: t.queryTpl(n) }));
  const rankLinks = RANKINGS.map(r => ({ href: r.path, label: r.h1 }));
  const dashHref = `/dashboards/?c=${country}&industry=${def.industry}`;
  const countryHref = `/${country}/`;
  const gen = DATA.generated;

  if (topic === 'gdp-growth') {
    const g = get(country, 'NY.GDP.MKTP.KD.ZG')!; const pc = get(country, 'NY.GDP.PCAP.CD'); const inv = get(country, 'NE.GDI.TOTL.ZS');
    const r = ranked('NY.GDP.MKTP.KD.ZG'); const rank = r.findIndex(x => x.id === country) + 1;
    const first = g.s[0]; const hi = g.s.reduce((a: any, b: any) => b[1] > a[1] ? b : a); const lo = g.s.reduce((a: any, b: any) => b[1] < a[1] ? b : a);
    const summary = `${P} real GDP grew ${pct(g.v)} in ${g.y},${trend(g)}, according to the World Bank World Development Indicators (series NY.GDP.MKTP.KD.ZG, annual %, constant prices). That places ${T} ${rank} of ${r.length} economies on GovPulse for growth in the latest year — behind ${r[0].name} at ${pct(r[0].v as number)} (${r[0].y}) and ahead of ${r.at(-1)!.name} at ${pct(r.at(-1)!.v as number)} (${r.at(-1)!.y}). Across the charted window from ${first[0]} to ${g.y}, growth ranged from a low of ${pct(lo[1])} in ${lo[0]} to a high of ${pct(hi[1])} in ${hi[0]}.${pc ? ` GDP per capita was US$${Math.round(pc.v).toLocaleString('en-US')} (current US$) in ${pc.y}.` : ''}${inv ? ` Gross capital formation, a proxy for investment, equalled ${pct(inv.v)} of GDP in ${inv.y}.` : ''} Official annual figures arrive with a lag of one to two years, so every number on this page carries its own data year; the HTML rebuilds whenever the nightly pipeline refreshes from the World Bank API under CC BY 4.0.`;
    const faq: [string, string][] = [
      [`What is ${P} GDP growth in ${g.y}?`, `${P} real GDP growth was ${pct(g.v)} in ${g.y},${trend(g)} (World Bank WDI, NY.GDP.MKTP.KD.ZG).`],
      [`How does ${n} compare on GDP growth?`, `Among ${r.length} GovPulse economies, ${n} ranks ${rank}. Fastest is ${r[0].name} at ${pct(r[0].v as number)} (${r[0].y}); slowest is ${r.at(-1)!.name} at ${pct(r.at(-1)!.v as number)}.`],
      [`What is the source?`, `World Bank World Development Indicators, series NY.GDP.MKTP.KD.ZG (annual %, constant prices), licence CC BY 4.0. Pipeline run ${gen} UTC.`],
      [`Where can I chart ${P} GDP growth?`, `Open the free dashboards builder with ${n} preselected, or download JSON at ${SITE}/api/v1/${country}/NY.GDP.MKTP.KD.ZG.json.`],
    ];
    const h1 = def.h1Tpl(n, g.y);
    const title = `${n} GDP growth ${g.y}: ${pct(g.v)} real growth · World Bank data`;
    const desc = `${P} real GDP grew ${pct(g.v)} in ${g.y}${trend(g)}. Rank ${rank}/${r.length} on GovPulse. Chart, FAQ and downloadable World Bank series.`.slice(0, 300);
    return pack({ country, topic, def, h1, title, desc, summary, faq, code: 'NY.GDP.MKTP.KD.ZG', unit: '%', seriesData: g.s, year: g.y, value: g.v, related, rankLinks, dashHref, countryHref, chartKind: 'area' as const, chartTitle: `${n}: real GDP growth (%)` });
  }

  if (topic === 'inflation-rate') {
    const cpi = get(country, 'FP.CPI.TOTL.ZG')!; const r = ranked('FP.CPI.TOTL.ZG'); const rank = r.findIndex(x => x.id === country) + 1;
    const low = [...r].sort((a, b) => (a.v as number) - (b.v as number));
    const first = cpi.s[0]; const hi = cpi.s.reduce((a: any, b: any) => b[1] > a[1] ? b : a); const lo = cpi.s.reduce((a: any, b: any) => b[1] < a[1] ? b : a);
    const summary = `Consumer price inflation in ${T} was ${pct(cpi.v)} in ${cpi.y},${trend(cpi)}, based on the World Bank CPI series FP.CPI.TOTL.ZG (annual %). Among the ${r.length} economies tracked here, ${n} ranks ${rank} by the latest inflation reading; the softest print in the set is ${low[0].name} at ${pct(low[0].v as number)} (${low[0].y}) and the strongest is ${r[0].name} at ${pct(r[0].v as number)} (${r[0].y}). From ${first[0]} to ${cpi.y} the annual rate ranged between ${pct(lo[1])} (${lo[0]}) and ${pct(hi[1])} (${hi[0]}). Inflation measures the annual percentage change in consumer prices, so a fall in the rate still means prices rose, just more slowly than before. These figures are annual WDI releases under CC BY 4.0; higher-frequency BIS monthly CPI for the same economies appears on the Latest trends page when the BIS feed has coverage. Use the peer table below or Open in Dashboards to compare ${n} with peers.`;
    const faq: [string, string][] = [
      [`What is ${P} inflation rate?`, `CPI inflation was ${pct(cpi.v)} in ${cpi.y},${trend(cpi)} (World Bank WDI, FP.CPI.TOTL.ZG).`],
      [`Which country has the highest inflation?`, `In our set, ${r[0].name} at ${pct(r[0].v as number)} (${r[0].y}). ${n} is ${rank} of ${r.length}.`],
      [`What is the source?`, `World Bank WDI FP.CPI.TOTL.ZG (annual %). Licence CC BY 4.0. See also BIS monthly CPI on ${SITE}/latest-trends/.`],
      [`How do I compare inflation across countries?`, `Use the inflation-by-country ranking table, or open ${n} in the dashboards builder.`],
    ];
    const h1 = def.h1Tpl(n, cpi.y);
    const title = `${n} inflation rate ${cpi.y}: ${pct(cpi.v)} CPI · World Bank data`;
    const desc = `${P} CPI inflation was ${pct(cpi.v)} in ${cpi.y}${trend(cpi)}. Rank ${rank}/${r.length}. Chart, peer comparison and JSON download.`.slice(0, 300);
    return pack({ country, topic, def, h1, title, desc, summary, faq, code: 'FP.CPI.TOTL.ZG', unit: '%', seriesData: cpi.s, year: cpi.y, value: cpi.v, related, rankLinks, dashHref, countryHref, chartKind: 'area' as const, chartTitle: `${n}: inflation (CPI, %)` });
  }

  if (topic === 'unemployment-rate') {
    const un = get(country, 'SL.UEM.TOTL.ZS')!; const r = ranked('SL.UEM.TOTL.ZS'); const rank = r.findIndex(x => x.id === country) + 1;
    const low = [...r].sort((a, b) => (a.v as number) - (b.v as number));
    const first = un.s[0]; const hi = un.s.reduce((a: any, b: any) => b[1] > a[1] ? b : a); const lo = un.s.reduce((a: any, b: any) => b[1] < a[1] ? b : a);
    const summary = `${P} unemployment rate was ${pct(un.v)} of the total labour force in ${un.y},${trend(un)}, a modelled ILO estimate published via the World Bank (SL.UEM.TOTL.ZS). That ranks ${T} ${rank} of ${r.length} on GovPulse when sorted by the latest rate (higher unemployment ranks higher); the lowest rate in the set is ${low[0].name} at ${pct(low[0].v as number)} (${low[0].y}) and the highest is ${r[0].name} at ${pct(r[0].v as number)} (${r[0].y}). Over ${first[0]}–${un.y} the series moved between ${pct(lo[1])} (${lo[0]}) and ${pct(hi[1])} (${hi[0]}). Modelled estimates fill gaps where national labour-force surveys are incomplete and can differ from a country’s preferred headline release. For the United States, Latest trends also surfaces the monthly FRED/BLS UNRATE series alongside this annual WDI print. Licence: CC BY 4.0; pipeline refreshes nightly.`;
    const faq: [string, string][] = [
      [`What is ${P} unemployment rate?`, `Unemployment was ${pct(un.v)} of the labour force in ${un.y},${trend(un)} (World Bank / ILO modelled estimate, SL.UEM.TOTL.ZS).`],
      [`How does ${n} compare?`, `${n} ranks ${rank} of ${r.length} by unemployment rate. Lowest: ${low[0].name} (${pct(low[0].v as number)}); highest: ${r[0].name} (${pct(r[0].v as number)}).`],
      [`What is the source?`, `World Bank WDI SL.UEM.TOTL.ZS, modelled ILO estimate, CC BY 4.0. Pipeline ${gen} UTC.`],
      [`Where is the ranking table?`, `See unemployment by country, or open ${n} in Dashboards.`],
    ];
    const h1 = def.h1Tpl(n, un.y);
    const title = `${n} unemployment rate ${un.y}: ${pct(un.v)} of labour force`;
    const desc = `${P} unemployment was ${pct(un.v)} in ${un.y}${trend(un)}. ILO modelled estimate via World Bank. Chart and peer ranking.`.slice(0, 300);
    return pack({ country, topic, def, h1, title, desc, summary, faq, code: 'SL.UEM.TOTL.ZS', unit: '%', seriesData: un.s, year: un.y, value: un.v, related, rankLinks, dashHref, countryHref, chartKind: 'area' as const, chartTitle: `${n}: unemployment (% labour force)` });
  }

  if (topic === 'population') {
    const pop = get(country, 'SP.POP.TOTL')!; const pc = get(country, 'NY.GDP.PCAP.CD'); const r = ranked('SP.POP.TOTL'); const rank = r.findIndex(x => x.id === country) + 1;
    const delta = pop.pv != null ? pop.v - pop.pv : null;
    const first = pop.s[0];
    const summary = `${n} had a population of about ${popTxt(pop.v)} — ${Math.round(pop.v).toLocaleString('en-US')} people — in ${pop.y}${pop.pv != null ? `, ${pop.v > pop.pv ? 'up' : 'down'} from ${popTxt(pop.pv)} in ${pop.py}${delta != null ? ` (a change of about ${Math.round(delta).toLocaleString('en-US')} people year-on-year)` : ''}` : ''}, according to the World Bank population series SP.POP.TOTL. Among the ${r.length} GovPulse economies, ${n} ranks ${rank} by population; the largest is ${r[0].name} at about ${popTxt(r[0].v as number)} (${r[0].y}) and the smallest is ${r.at(-1)!.name} at about ${popTxt(r.at(-1)!.v as number)} (${r.at(-1)!.y}). The charted series starts in ${first[0]} at about ${popTxt(first[1])} and ends at the latest WDI release.${pc ? ` Dividing national output by people, GDP per capita was US$${Math.round(pc.v).toLocaleString('en-US')} (current US$) in ${pc.y}.` : ''} Population estimates underpin every per-capita indicator on the ${n} country page and in the dashboards builder. The series is annual under CC BY 4.0; this landing page rebuilds when the nightly pipeline refreshes.`;
    const faq: [string, string][] = [
      [`What is ${P} population?`, `${n} had ${Math.round(pop.v).toLocaleString('en-US')} people in ${pop.y} (World Bank WDI, SP.POP.TOTL).`],
      [`How does ${n} rank by population?`, `${rank} of ${r.length} on GovPulse. Largest: ${r[0].name}; smallest: ${r.at(-1)!.name}.`],
      [`What is the source?`, `World Bank WDI SP.POP.TOTL, CC BY 4.0. Updated in the ${gen.slice(0, 10)} pipeline run.`],
      [`How is population used on GovPulse?`, `It denominates GDP per capita and contextualises health and labour indicators on the ${n} country page.`],
    ];
    const h1 = def.h1Tpl(n, pop.y);
    const title = `${n} population ${pop.y}: ${popTxt(pop.v)} people · World Bank`;
    const desc = `${P} population was ${popTxt(pop.v)} in ${pop.y}. Rank ${rank}/${r.length}. Chart, FAQ and JSON API.`.slice(0, 300);
    return pack({ country, topic, def, h1, title, desc, summary, faq, code: 'SP.POP.TOTL', unit: 'people', seriesData: pop.s, year: pop.y, value: pop.v, related, rankLinks, dashHref, countryHref, chartKind: 'area' as const, chartTitle: `${n}: population` });
  }

  if (topic === 'top-exports') {
    const tr = D.trade?.[country]; const tops = tr ? top(tr.X, () => true, 8) : [];
    const xm = get(country, 'TX.VAL.MRCH.CD.WT'); const man = get(country, 'TX.VAL.MANF.ZS.UN'); const xg = get(country, 'NE.EXP.GNFS.ZS');
    const topTxt = tops.slice(0, 5).map(([h, v]) => `${hsName(h)} (HS ${h}, ${usdB(v)})`).join('; ');
    const yr = tr?.year ?? xm?.y ?? 0;
    const summary = tr && tops.length
      ? `${P} largest merchandise export categories in ${tr.year} were ${topTxt}, drawn from the UN Comtrade public preview API at HS 2-digit level (partner World).${xm ? ` On the World Bank aggregate, merchandise exports totalled ${usdB(xm.v)} in ${xm.y} (TX.VAL.MRCH.CD.WT).` : ''}${man ? ` Manufactured goods made up ${pct(man.v)} of merchandise exports in ${man.y}.` : ''}${xg ? ` Exports of goods and services equalled ${pct(xg.v)} of GDP in ${xg.y}.` : ''} Top destinations by export value include ${(tr.Xp || []).slice(0, 3).map((p: any) => `${p.name} (${p.share}% share)`).join(', ') || 'see the country trade dashboard'}. Values are reported US dollars at the chapter level; open ${n} in Dashboards or the manufacturing industry view for related production KPIs. Comtrade and WDI licences are noted in the FAQ and methodology.`
      : `${P} merchandise trade series come from the World Bank${xm ? `: exports were ${usdB(xm.v)} in ${xm.y}` : ''}. Product-level Comtrade detail is not available for this country in the current build.`;
    const barData: [number, number][] = tops.slice(0, 8).map(([h, v], i) => [i + 1, v / 1e9]);
    const barLabels = tops.slice(0, 8).map(([h]) => `HS ${h}`);
    const faq: [string, string][] = [
      [`What are ${P} top exports?`, tops.length ? `In ${tr.year} the largest HS chapters were ${topTxt} (UN Comtrade).` : `Product-level export ranks are not in this build; see merchandise totals on the ${n} country page.`],
      [`How much does ${n} export?`, xm ? `Merchandise exports were ${usdB(xm.v)} in ${xm.y} (World Bank TX.VAL.MRCH.CD.WT).` : `See the ${n} economy page for available trade indicators.`],
      [`What is the source?`, `UN Comtrade public preview API (HS 2-digit) and World Bank WDI trade series. Pipeline ${gen} UTC.`],
      [`Can I rebuild this chart?`, `Yes — open ${n} manufacturing in the dashboards builder, or call the JSON API.`],
    ];
    const h1 = def.h1Tpl(n, yr || new Date().getFullYear());
    const title = `${n} top exports ${yr || ''}: products, values & destinations`.replace(/\s+/g, ' ').trim();
    const desc = (tops.length ? `${P} top exports in ${tr.year}: ${tops.slice(0, 3).map(([h, v]) => `${hsName(h)} (${usdB(v)})`).join(', ')}.` : summary).slice(0, 300);
    return pack({ country, topic, def, h1, title, desc, summary, faq, code: 'TX.VAL.MRCH.CD.WT', unit: 'US$ bn', seriesData: barData, year: yr, value: tops[0]?.[1] ?? null, related, rankLinks, dashHref, countryHref, chartKind: 'bar' as const, chartTitle: `${n}: top export chapters (US$ bn, ${tr?.year ?? ''})`, barLabels, exportRows: tops.slice(0, 10).map(([h, v]) => ({ h, name: hsName(h), v })), tradeYear: tr?.year, partners: (tr?.Xp || []).slice(0, 5) });
  }

  // health-statistics
  const he = get(country, 'SH.XPD.CHEX.GD.ZS'); const le = get(country, 'SP.DYN.LE00.IN'); const im = get(country, 'SP.DYN.IMRT.IN'); const ph = get(country, 'SH.MED.PHYS.ZS');
  const primary = he || le!;
  const bits: string[] = [];
  if (he) bits.push(`health expenditure was ${pct(he.v)} of GDP in ${he.y}${trend(he)}`);
  if (le) bits.push(`life expectancy at birth was ${le.v.toFixed(1)} years in ${le.y}${trend({ ...le }, false) ? `, ${le.pv != null && le.v > le.pv ? 'up' : 'changed'} from ${le.pv?.toFixed(1)} in ${le.py}` : ''}`);
  if (im) bits.push(`infant mortality was ${im.v.toFixed(1)} per 1,000 live births in ${im.y}`);
  if (ph) bits.push(`there were ${ph.v.toFixed(2)} physicians per 1,000 people in ${ph.y}`);
  const summary = `${P} health statistics from the World Bank World Development Indicators: ${bits.join('; ')}. These four series — health expenditure (SH.XPD.CHEX.GD.ZS), life expectancy (SP.DYN.LE00.IN), infant mortality (SP.DYN.IMRT.IN) and physicians per 1,000 (SH.MED.PHYS.ZS) — form the healthcare lens on GovPulse for ${T}. Each card below links to the full time-series indicator page; the peer list and Open in Dashboards control jump into the healthcare industry view for cross-country charts. All figures are annual WDI releases under CC BY 4.0. Publication lags differ by series, so every number carries its own data year rather than a single “as of” stamp. This page exists because Search Console showed demand for health-statistics queries alongside macro topics.`;
  const faq: [string, string][] = [
    he ? [`What is ${P} health expenditure?`, `Current health expenditure was ${pct(he.v)} of GDP in ${he.y}${trend(he)} (World Bank, SH.XPD.CHEX.GD.ZS).`] : [`What health data does GovPulse show for ${n}?`, `Life expectancy, infant mortality, physicians and related WDI healthcare series on the ${n} healthcare page.`],
    le ? [`What is ${P} life expectancy?`, `${le.v.toFixed(1)} years in ${le.y} (SP.DYN.LE00.IN).`] : [`Where is the full healthcare dashboard?`, `See ${SITE}/${country}/healthcare/.`],
    im ? [`What is ${P} infant mortality rate?`, `${im.v.toFixed(1)} per 1,000 live births in ${im.y} (SP.DYN.IMRT.IN).`] : [`What is the source?`, `World Bank WDI healthcare indicators, CC BY 4.0.`],
    [`Where does this data come from?`, `World Bank World Development Indicators (CC BY 4.0), pipeline ${gen} UTC. Open ${n} healthcare for every series.`],
  ];
  const h1 = def.h1Tpl(n, primary.y);
  const title = `${n} health statistics ${primary.y}: expenditure, life expectancy & more`;
  const desc = summary.slice(0, 300);
  const seriesData = (he || le)!.s;
  return pack({ country, topic, def, h1, title, desc, summary, faq, code: he?.code || le!.code, unit: he ? '% GDP' : 'years', seriesData, year: primary.y, value: primary.v, related, rankLinks, dashHref: `/dashboards/?c=${country}&industry=healthcare`, countryHref, chartKind: 'area' as const, chartTitle: `${n}: ${he ? 'health expenditure (% GDP)' : 'life expectancy (years)'}`, healthExtra: { he, le, im, ph } });
}

function pack(p: any) {
  const C = COUNTRIES[p.country];
  const url = `${SITE}/${p.country}/${p.def.path}/`;
  const indUrl = p.code ? `${SITE}/${p.country}/indicator/${slug(p.code)}/` : url;
  const dataset = {
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: `${C.name}: ${p.h1}`,
    description: p.summary,
    url, license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: p.topic === 'top-exports' ? 'UN Comtrade / World Bank' : 'The World Bank', url: p.topic === 'top-exports' ? 'https://comtradeplus.un.org/' : 'https://data.worldbank.org/' },
    spatialCoverage: { '@type': 'Place', name: C.name },
    temporalCoverage: p.seriesData?.length ? `${p.seriesData[0][0]}/${p.year}` : String(p.year),
    variableMeasured: { '@type': 'PropertyValue', name: p.h1, unitText: p.unit, value: p.value },
    dateModified: DATA.generated,
    distribution: p.code ? [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE}/api/v1/${p.country}/${p.code}.json` }] : undefined,
  };
  const crumbs = crumbLd([['Home', `${SITE}/`], [C.name, `${SITE}/${p.country}/`], [p.h1, url]]);
  const peerRows = p.code && p.topic !== 'top-exports' ? ranked(p.code).map(x => ({ ...x, href: `/${x.id}/${p.def.path}/` })) : [];
  return { ...p, url, indUrl, dataset, crumbs, faqLd: faqLd(p.faq), peerRows, tokens: TOKENS, site: SITE, countryName: C.name, generated: DATA.generated };
}

export function rankingPage(id: typeof RANKINGS[number]['id']) {
  const def = RANKINGS.find(r => r.id === id)!;
  const rows = ranked(def.code);
  const m = (DATA.indicators as any)[def.code];
  const yr = Math.max(...rows.map(x => x.y as number));
  const low = [...rows].sort((a, b) => (a.v as number) - (b.v as number));
  const unit = m.unit as string;
  const lead = (() => {
    if (id === 'inflation-by-country') return `Consumer price inflation (annual %) for ${rows.length} major economies from the World Bank. Latest readings: highest ${rows[0].name} at ${valText(rows[0].v, unit)} (${rows[0].y}), lowest ${low[0].name} at ${valText(low[0].v, unit)} (${low[0].y}).`;
    if (id === 'unemployment-by-country') return `Unemployment as a share of the labour force (ILO modelled estimate via World Bank) for ${rows.length} economies. Highest: ${rows[0].name} at ${valText(rows[0].v, unit)} (${rows[0].y}); lowest: ${low[0].name} at ${valText(low[0].v, unit)}.`;
    return `Real GDP growth (annual %) for ${rows.length} major economies from the World Bank. Fastest: ${rows[0].name} at ${valText(rows[0].v, unit)} (${rows[0].y}); slowest: ${rows.at(-1)!.name} at ${valText(rows.at(-1)!.v, unit)}.`;
  })();
  const summaryExtra = (() => {
    if (id === 'inflation-by-country') return `A lower rank means softer price pressure in the latest year, not falling prices in absolute terms. Annual CPI can differ from monthly BIS prints shown on Latest trends. Investment and growth peers sit on the GDP growth by country and GDP by country pages.`;
    if (id === 'unemployment-by-country') return `Rates are modelled ILO estimates and may not match a national statistical office’s preferred series. For the USA, FRED UNRATE offers a monthly alternative on Latest trends. Pair this table with inflation and GDP growth rankings for a fuller labour-market picture.`;
    return `Growth is measured in constant prices. Fast growth from a low base can still mean low GDP per capita — see the GDP by country page for income levels. High-growth names in this table often also lead investment as a share of GDP.`;
  })();
  const faq: [string, string][] = [
    [`Which country has the ${id === 'gdp-growth-by-country' ? 'fastest GDP growth' : id === 'inflation-by-country' ? 'highest inflation' : 'highest unemployment'}?`, `${rows[0].name} at ${valText(rows[0].v, unit)} in ${rows[0].y} (World Bank, ${def.code}).`],
    [`Which country has the ${id === 'gdp-growth-by-country' ? 'slowest growth' : 'lowest rate'}?`, `${(id === 'gdp-growth-by-country' ? rows.at(-1)! : low[0]).name} at ${valText((id === 'gdp-growth-by-country' ? rows.at(-1)! : low[0]).v, unit)}.`],
    [`What is the source?`, `World Bank World Development Indicators, ${def.code} (${m.label}, ${unit}), CC BY 4.0. Pipeline ${DATA.generated} UTC.`],
    [`How often is this updated?`, `GovPulse rebuilds nightly from the World Bank API. Official annual figures usually lag 1–2 years.`],
  ];
  const path = def.path;
  const dataset = {
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: def.title(yr), description: lead + ' ' + summaryExtra, url: `${SITE}${path}`,
    license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'The World Bank', url: 'https://data.worldbank.org/' },
    dateModified: DATA.generated, variableMeasured: m.label,
  };
  return { def, rows, low, yr, unit, lead, summaryExtra, faq, path, dataset, faqLd: faqLd(faq), crumbs: crumbLd([['Home', `${SITE}/`], [def.h1, `${SITE}${path}`]]), m, slug: slug(def.code), topicPath: TOPICS.find(t => t.code === def.code)?.path || 'gdp-growth' };
}

export function allTopicPaths() {
  return Object.keys(COUNTRIES).flatMap(country => TOPICS.map(t => ({ country, topic: t.id, path: t.path })));
}
