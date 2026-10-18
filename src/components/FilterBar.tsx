import { useEffect, useId, useMemo, useState } from 'react';
import { Lock, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Canvas } from './Chart';
import { hasPro } from '../config/entitlements';
type Ind = { code: string; label: string; unit: string; industry: string };
type Props = { country: string; countryName: string; industry: string; indicators: Ind[]; countries: { id: string; name: string }[]; industries: { id: string; name: string }[]; years: [number, number] };
const L = ({ t, children }: any) => <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">{t}{children}</label>;
export default function FilterBar(p: Props) {
  const [pro, setPro] = useState(false); useEffect(() => setPro(hasPro()), []);
  const own = p.indicators.filter(i => i.industry === p.industry || p.industry === 'overview');
  const [from, setFrom] = useState(p.years[0]); const [to, setTo] = useState(p.years[1]);
  const [ind, setInd] = useState(p.industry); const [a, setA] = useState(own[0]?.code ?? p.indicators[0].code);
  const [b, setB] = useState(own[1]?.code ?? p.indicators[1].code); const [vs, setVs] = useState('');
  const [data, setData] = useState<Record<string, any>>({}); const [open, setOpen] = useState(false);
  const tip = useId(); const yrs = useMemo(() => Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i), [p.years]);
  const metrics = p.indicators.filter(i => ind === 'all' || i.industry === ind || ind === 'overview');
  useEffect(() => { if (!pro || !open) return; [p.country, vs].filter(Boolean).forEach(c => { if (!data[c]) fetch(`/api/v1/${c}.json`).then(r => r.json()).then(j => setData(d => ({ ...d, [c]: j.series }))); }); }, [pro, open, vs]);
  const meta = (c: string) => p.indicators.find(i => i.code === c)!;
  const cut = (s: [number, number][] = []) => s.filter(([y]) => y >= from && y <= to);
  const nm = (id: string) => p.countries.find(c => c.id === id)?.name ?? id;
  const ready = pro && open && data[p.country] && (!vs || data[vs]);
  const series = ready ? [
    { name: `${p.countryName}: ${meta(a).label}`, data: cut(data[p.country][a]), unit: meta(a).unit },
    vs ? { name: `${nm(vs)}: ${meta(a).label}`, data: cut(data[vs][a]), unit: meta(a).unit } : { name: `${p.countryName}: ${meta(b).label}`, data: cut(data[p.country][b]), unit: meta(b).unit },
  ] : [];
  const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border-accent';
  return <div className="border-t border-white/10 bg-black/70 backdrop-blur-xl" data-filterbar>
    <form className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setOpen(true); }} aria-describedby={pro ? undefined : tip}>
      <span className="flex items-center gap-2 text-sm font-semibold text-accent self-center"><SlidersHorizontal size={16} aria-hidden />Explore</span>
      <fieldset disabled={!pro} className="contents">
        <L t="From"><select className={field} value={from} onChange={e => setFrom(+e.target.value)}>{yrs.map(y => <option key={y}>{y}</option>)}</select></L>
        <L t="To"><select className={field} value={to} onChange={e => setTo(+e.target.value)}>{yrs.map(y => <option key={y}>{y}</option>)}</select></L>
        <L t="Industry"><select className={field} value={ind} onChange={e => setInd(e.target.value)}><option value="all">All</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></L>
        <L t="Metric A"><select className={field + ' max-w-[11rem]'} value={a} onChange={e => setA(e.target.value)}>{metrics.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></L>
        <L t="Metric B (2nd axis)"><select className={field + ' max-w-[11rem]'} value={b} onChange={e => setB(e.target.value)} disabled={!pro || !!vs}>{metrics.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></L>
        <L t="Or compare country"><select className={field} value={vs} onChange={e => setVs(e.target.value)}><option value="">None</option>{p.countries.filter(c => c.id !== p.country).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
        <button type="submit" className="rounded-full bg-cta text-black font-semibold text-sm px-4 py-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">Apply</button>
      </fieldset>
      {!pro && <span className="relative group ml-auto self-center">
        <a href="/pricing" className="inline-flex items-center gap-2 rounded-full border border-accent/70 text-accent px-3.5 py-1.5 text-sm hover:bg-accent/10" aria-describedby={tip}><Lock size={14} aria-hidden />Pro feature<Sparkles size={14} aria-hidden /></a>
        <span id={tip} role="tooltip" className="pointer-events-none absolute right-0 top-full mt-2 w-64 rounded-lg border border-white/15 bg-black px-3 py-2 text-xs text-text opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">Pro feature: filter by year range and industry, compare two metrics on dual axes, or compare countries. Upgrade on the pricing page.</span>
      </span>}
      {pro && <span className="ml-auto self-center text-xs text-accent font-mono">PRO PREVIEW (localhost only)</span>}
    </form>
    {pro && open && <div className="mx-auto max-w-7xl px-4 md:px-6 pb-4" aria-live="polite">
      <div className="edge rounded-2xl p-4">{ready ? <><p className="text-sm text-strong mb-2">{series.map(s => s.name).join(' vs ')} · {from}–{to}</p><Canvas key={`${a}${b}${vs}${from}${to}`} p={{ series, colors: ['#FFB224', '#FF6A45'], dual: !vs, title: 'Comparison', area: false }} full={false} h={300} /><p className="text-[11px] text-muted mt-1">Source: World Bank WDI via /api/v1, CC BY 4.0</p></> : <p className="text-sm text-muted">Loading…</p>}</div>
    </div>}
  </div>;
}
