import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Canvas } from './Chart';
type Ind = { code: string; label: string; unit: string; industry: string };
type Props = { country: string; countryName: string; industry: string; indicators: Ind[]; countries: { id: string; name: string }[]; industries: { id: string; name: string }[]; years: [number, number] };
const L = ({ t, children }: any) => <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">{t}{children}</label>;
// Basic filters are free for everyone: industry, year range, one metric. Advanced comparisons are announced as "coming soon".
export default function FilterBar(p: Props) {
  const metrics = p.indicators.filter(i => p.industry === 'overview' || i.industry === p.industry);
  const [from, setFrom] = useState(p.years[0]); const [to, setTo] = useState(p.years[1]);
  const [a, setA] = useState(metrics[0]?.code ?? p.indicators[0].code);
  const [data, setData] = useState<any>(null); const [open, setOpen] = useState(false);
  const yrs = useMemo(() => Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i), [p.years]);
  useEffect(() => { if (open && !data) fetch(`/api/v1/${p.country}.json`).then(r => r.json()).then(j => setData(j.series)); }, [open]);
  const meta = p.indicators.find(i => i.code === a)!;
  const lo = Math.min(from, to), hi = Math.max(from, to);
  const pts = (data?.[a] ?? []).filter(([y]: [number]) => y >= lo && y <= hi);
  const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text focus-visible:border-accent';
  const nav = (v: string) => { location.href = `/${p.country}/${v === 'all' ? '' : v + '/'}#dash`; };
  return <div className="border-t border-white/10 bg-black/70 backdrop-blur-xl" data-filterbar>
    <form className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setOpen(true); }}>
      <span className="flex items-center gap-2 text-sm font-semibold text-accent self-center"><SlidersHorizontal size={16} aria-hidden />Explore</span>
      <L t="Industry"><select className={field} value={p.industry === 'overview' ? 'all' : p.industry} onChange={e => nav(e.target.value)}><option value="all">All industries</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></L>
      <L t="From"><select className={field} value={from} onChange={e => setFrom(+e.target.value)}>{yrs.map(y => <option key={y}>{y}</option>)}</select></L>
      <L t="To"><select className={field} value={to} onChange={e => setTo(+e.target.value)}>{yrs.map(y => <option key={y}>{y}</option>)}</select></L>
      <L t="Metric"><select className={field + ' max-w-[13rem]'} value={a} onChange={e => { setA(e.target.value); setOpen(true); }}>{metrics.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></L>
      <button type="submit" className="rounded-full bg-cta text-black font-semibold text-sm px-4 py-2 hover:brightness-110">Show chart</button>
      <span className="self-center text-xs text-muted">Metric vs metric and country vs country: <span className="text-text">coming soon</span></span>
    </form>
    {open && <div className="mx-auto max-w-7xl px-4 md:px-6 pb-4" aria-live="polite">
      <div className="edge rounded-2xl p-4">{data ? <><p className="text-sm text-strong mb-2">{p.countryName}: {meta.label} · {lo}–{hi}</p>
        {pts.length ? <Canvas key={`${a}${lo}${hi}`} p={{ series: [{ name: `${meta.label} (${meta.unit})`, data: pts, unit: meta.unit }], colors: ['#FFB224'], title: meta.label, area: true }} full={false} h={280} /> : <p className="text-sm text-muted">No data in this range.</p>}
        <div className="flex flex-wrap justify-between gap-2 mt-1 text-[11px] text-muted"><span>Source: World Bank WDI {a} via /api/v1, CC BY 4.0</span><button type="button" className="underline" onClick={() => setOpen(false)}>Close chart</button></div></> : <p className="text-sm text-muted">Loading…</p>}</div>
    </div>}
  </div>;
}
