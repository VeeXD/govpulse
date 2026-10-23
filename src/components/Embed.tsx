import { useEffect, useState } from 'react';
import { Canvas } from './Chart';
import { PALETTE, COUNTRY_NAMES, parseCmp, loadCountry, build, units } from '../lib/compose';
type M = Record<string, { label: string; unit: string }>;
export default function Embed({ meta }: { meta: M }) {
  const [st, setSt] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { (async () => {
    const q = new URLSearchParams(location.search); const c = q.get('c') ?? 'india'; const code = q.get('metric') ?? q.get('m') ?? 'NY.GDP.MKTP.KD.ZG';
    if (!COUNTRY_NAMES[c] || !meta[code]) { setErr('Unknown chart.'); return; }
    const refs = [{ c, code }, ...parseCmp(q.get('cmp')).filter(x => meta[x.code])];
    const ds = await Promise.all(refs.map(r => loadCountry(r.c)));
    const items = refs.map((r, i) => ({ name: `${COUNTRY_NAMES[r.c]} · ${meta[r.code].label}`, unit: meta[r.code].unit, data: ds[i]?.[r.code] ?? [] }));
    const all = items.flatMap(x => x.data.map(p => p[0])); const from = +(q.get('from') ?? 0) || Math.min(...all), to = +(q.get('to') ?? 0) || Math.max(...all);
    const b = build(items, [from, to], q.get('idx') === '1'); const back = `/${c}/?` + q.toString();
    setSt({ title: items.length > 1 ? items.map(x => x.name).join(' vs ') : items[0].name, p: { series: b.series, colors: PALETTE, area: b.series.length === 1, dual: b.series.length > 1 && units(b.series).length > 1 }, range: [from, to], back });
  })().catch(() => setErr('Could not load data.')); }, []);
  if (err) return <p className="p-4 text-sm text-muted">{err}</p>;
  if (!st) return <p className="p-4 text-sm text-muted">Loading chart…</p>;
  return <div className="flex flex-col h-screen p-3 gap-2 bg-surface">
    <h1 className="text-sm font-semibold text-strong truncate">{st.title} <span className="text-muted font-normal">{st.range[0]}–{st.range[1]}</span></h1>
    <div className="flex-1 min-h-0"><Canvas p={st.p} full={false} h="100%" /></div>
    <p className="text-[11px] text-muted flex justify-between gap-2"><span>Source: World Bank WDI, CC BY 4.0</span><a href={'https://govpulse.pages.dev' + st.back} target="_blank" rel="noopener" className="text-accent hover:underline">via GovPulse ↗</a></p>
  </div>;
}
