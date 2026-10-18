import { useEffect, useId, useMemo, useState } from 'react';
import { Lock, SlidersHorizontal } from 'lucide-react';
import { Canvas } from './Chart';
import { hasPro } from '../config/entitlements';
type Ind = { code: string; label: string; unit: string; industry: string };
type Props = { country: string; countryName: string; industry: string; indicators: Ind[]; countries: { id: string; name: string }[]; industries: { id: string; name: string }[]; years: [number, number] };
// A locked control stays focusable (aria-disabled, not disabled) so hover AND keyboard focus reveal its 'Pro' tooltip.
const Locked = ({ on, id, children }: any) => on ? <>{children}</> : <span className="relative group/pro inline-flex">{children}
  <span id={id} role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap rounded-md bg-cta text-black text-xs font-semibold px-2.5 py-1 shadow-lg opacity-0 group-hover/pro:opacity-100 group-focus-within/pro:opacity-100 transition-opacity"><Lock size={11} className="inline -mt-0.5 mr-1" aria-hidden />Pro</span></span>;
const block = (e: any) => { if (e.key && ['Tab', 'Shift', 'Escape'].includes(e.key)) return; e.preventDefault(); };
const L = ({ t, children }: any) => <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">{t}{children}</label>;
export default function FilterBar(p: Props) {
  const [pro, setPro] = useState(false); useEffect(() => setPro(hasPro()), []);
  const own = p.indicators.filter(i => i.industry === p.industry || p.industry === 'overview');
  const [from, setFrom] = useState(p.years[0]); const [to, setTo] = useState(p.years[1]);
  const [ind, setInd] = useState(p.industry); const [a, setA] = useState(own[0]?.code ?? p.indicators[0].code);
  const [b, setB] = useState(own[1]?.code ?? p.indicators[1].code); const [vs, setVs] = useState('');
  const [data, setData] = useState<Record<string, any>>({}); const [open, setOpen] = useState(false);
  const tip = useId(); const yrs = useMemo(() => Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i), [p.years]);
  const metrics = p.indicators.filter(i => p.industry === 'overview' || i.industry === p.industry);
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
    <form className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setOpen(true); }}>
      <span className="flex items-center gap-2 text-sm font-semibold text-accent self-center"><SlidersHorizontal size={16} aria-hidden />Explore</span>
      {(() => { const lk = (id: string) => pro ? {} : { 'aria-disabled': true, 'aria-describedby': id, onMouseDown: block, onKeyDown: block, onClick: block };
        const f = field + (pro ? '' : ' opacity-60 cursor-not-allowed');
        const nav = (v: string) => { const seg = v === 'all' || v === 'overview' ? '' : `${v}/`; location.href = `/${p.country}/${seg}${pro && location.search ? location.search : ''}#dash`; };
        return <>
        <L t="Industry"><select className={field} value={p.industry === 'overview' ? 'all' : p.industry} onChange={e => nav(e.target.value)}><option value="all">All industries</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></L>
        <L t="From"><Locked on={pro} id={tip + 'f'}><select className={f} value={from} onChange={e => setFrom(+e.target.value)} {...lk(tip + 'f')}>{yrs.map(y => <option key={y}>{y}</option>)}</select></Locked></L>
        <L t="To"><Locked on={pro} id={tip + 't'}><select className={f} value={to} onChange={e => setTo(+e.target.value)} {...lk(tip + 't')}>{yrs.map(y => <option key={y}>{y}</option>)}</select></Locked></L>
        <L t="Metric A"><Locked on={pro} id={tip + 'a'}><select className={f + ' max-w-[11rem]'} value={a} onChange={e => setA(e.target.value)} {...lk(tip + 'a')}>{metrics.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></Locked></L>
        <L t="Metric B (2nd axis)"><Locked on={pro} id={tip + 'b'}><select className={f + ' max-w-[11rem]'} value={b} onChange={e => setB(e.target.value)} disabled={pro && !!vs} {...lk(tip + 'b')}>{metrics.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></Locked></L>
        <L t="Compare country"><Locked on={pro} id={tip + 'c'}><select className={f} value={vs} onChange={e => setVs(e.target.value)} {...lk(tip + 'c')}><option value="">None</option>{p.countries.filter(c => c.id !== p.country).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Locked></L>
        <Locked on={pro} id={tip + 'x'}><button type={pro ? 'submit' : 'button'} className={'rounded-full bg-cta text-black font-semibold text-sm px-4 py-2 hover:brightness-110' + (pro ? '' : ' opacity-60 cursor-not-allowed')} {...lk(tip + 'x')}>Apply</button></Locked>
        {!pro && <a href="/pricing" className="self-center text-xs text-muted underline underline-offset-2 hover:text-accent">Unlock filters</a>}
        </>; })()}
      {pro && <span className="ml-auto self-center text-xs text-accent font-mono">PRO PREVIEW (localhost only)</span>}
    </form>
    {pro && open && <div className="mx-auto max-w-7xl px-4 md:px-6 pb-4" aria-live="polite">
      <div className="edge rounded-2xl p-4">{ready ? <><p className="text-sm text-strong mb-2">{series.map(s => s.name).join(' vs ')} · {from}–{to}</p><Canvas key={`${a}${b}${vs}${from}${to}`} p={{ series, colors: ['#FFB224', '#FF6A45'], dual: !vs, title: 'Comparison', area: false }} full={false} h={300} /><p className="text-[11px] text-muted mt-1">Source: World Bank WDI via /api/v1, CC BY 4.0</p></> : <p className="text-sm text-muted">Loading…</p>}</div>
    </div>}
  </div>;
}
