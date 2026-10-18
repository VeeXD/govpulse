import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, Maximize2, X, ArrowUpRight, ArrowDownRight, Minus, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { Canvas } from './Chart';
import { RELATED, COUNTER } from '../lib/related';
type Pt = [number, number];
type Meta = { code: string; label: string; unit: string; industry: string; good: boolean | null };
type Props = { country: string; countryName: string; pageIndustry: string; meta: Meta[]; data: Record<string, Pt[]>; industries: { id: string; name: string }[]; years: [number, number] };
const AMBER = '#FFB224', SIGNAL = '#FF6A45';
const fmt = (v: number | null | undefined, unit = '') => { if (v == null || Number.isNaN(v)) return '—'; if (unit === 'US$') return 'US$' + Math.round(v).toLocaleString('en-US');
  const a = Math.abs(v); const s = a >= 1e4 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a >= 100 ? v.toFixed(0) : v.toFixed(1); return unit.startsWith('%') ? s + '%' : s; };
const unitTail = (u: string) => u === '%' || u === 'US$' ? '' : u.startsWith('% ') ? ' of ' + u.slice(2) : ' ' + u;
const lc = (t: string) => t.replace(/\b([A-Z])([a-z]+)/g, (_, a, b) => a.toLowerCase() + b);
const poss = (n: string) => (/^(United|UAE)/.test(n) ? 'The ' : '') + (n.endsWith('s') ? n + "'" : n + "'s");
function stats(s: Pt[]) { const last = s.at(-1), prev = s.at(-2); const five = last ? [...s].reverse().find(p => p[0] <= last[0] - 5) : undefined;
  return { last, prev, yoy: last && prev ? last[1] - prev[1] : null, five, d5: last && five ? last[1] - five[1] : null }; }
const tone = (d: number | null, good: boolean | null) => d == null || d === 0 || good == null ? 'text-muted' : (d > 0) === good ? 'text-up' : 'text-down';
function Delta({ d, unit, good, label }: { d: number | null; unit: string; good: boolean | null; label: string }) {
  const I = d == null || d === 0 ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-mono text-sm ${tone(d, good)}`}><I size={14} aria-hidden />{d == null ? '—' : (d > 0 ? '+' : '') + fmt(d, unit.startsWith('%') ? '' : unit).replace('US$', '')}{unit.startsWith('%') && d != null ? ' pts' : ''}<span className="text-muted text-xs">{label}</span></span>;
}
function Spark({ s, w = 160, h = 40, color = AMBER }: { s: Pt[]; w?: number; h?: number; color?: string }) {
  if (s.length < 2) return <svg width={w} height={h} aria-hidden />;
  const xs = s.map(p => p[0]), ys = s.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (x: number) => ((x - x0) / (x1 - x0 || 1)) * (w - 4) + 2, Y = (y: number) => h - 2 - ((y - y0) / (y1 - y0 || 1)) * (h - 4);
  const d = s.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
  return <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h }} aria-hidden><path d={d} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" /><circle cx={X(s.at(-1)![0])} cy={Y(s.at(-1)![1])} r="2.5" fill={color} /></svg>;
}
const sel = 'bg-black/50 border border-white/15 rounded-md px-1.5 py-1 text-xs text-text focus-visible:border-accent';
function Range({ yrs, r, set, id }: { yrs: number[]; r: [number, number]; set: (r: [number, number]) => void; id: string }) {
  return <span className="inline-flex items-center gap-1 text-xs text-muted" role="group" aria-label="Year range">
    <label className="sr-only" htmlFor={id + 'f'}>From year</label><select id={id + 'f'} className={sel} value={r[0]} onChange={e => set([+e.target.value, Math.max(+e.target.value, r[1])])}>{yrs.map(y => <option key={y}>{y}</option>)}</select>
    <span aria-hidden>–</span>
    <label className="sr-only" htmlFor={id + 't'}>To year</label><select id={id + 't'} className={sel} value={r[1]} onChange={e => set([Math.min(r[0], +e.target.value), +e.target.value])}>{yrs.map(y => <option key={y}>{y}</option>)}</select>
  </span>;
}
function ChartCard({ m, s, range, setRange, yrs, onOpen, big, color = AMBER }: any) {
  const pts = s.filter((p: Pt) => p[0] >= range[0] && p[0] <= range[1]); const st = stats(s);
  return <article className="edge rounded-2xl p-4 md:p-5 flex flex-col gap-2 min-w-0 fade-in">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h3 className={`font-semibold ${big ? 'text-lg' : 'text-sm'}`}>{m.label} <span className="text-muted font-normal text-xs">({m.unit})</span></h3>
        <p className="text-xs text-muted">Latest <span className="font-mono text-text">{fmt(st.last?.[1], m.unit)}</span> ({st.last?.[0]})</p></div>
      <div className="flex items-center gap-2"><Range yrs={yrs} r={range} set={setRange} id={'r' + m.code + (big ? 'b' : '')} />
        <button type="button" onClick={onOpen} className="rounded-md border border-white/15 p-1.5 hover:border-accent hover:text-accent" aria-label={`Open ${m.label} full screen`}><Maximize2 size={14} aria-hidden /></button></div>
    </div>
    <button type="button" onClick={onOpen} className="block w-full text-left cursor-zoom-in" aria-label={`${m.label} chart, ${range[0]}–${range[1]}. Open full screen`}>
      {pts.length ? <Canvas key={`${m.code}${range.join()}`} p={{ series: [{ name: `${m.label} (${m.unit})`, data: pts, unit: m.unit }], colors: [color], title: m.label, area: true }} full={false} h={big ? 320 : 200} /> : <p className="text-sm text-muted py-8 text-center">No data in this range.</p>}
    </button>
    <p className="text-[11px] text-muted">World Bank WDI {m.code} · CC BY 4.0</p>
  </article>;
}
function FullView({ code, meta, data, yrs, range0, countryName, onClose, onSwap, seq }: any) {
  const m: Meta = meta[code]; const s: Pt[] = data[code] ?? []; const [r, setR] = useState<[number, number]>(range0);
  useEffect(() => setR(range0), [code]);
  const box = useRef<HTMLDivElement>(null); const prevFocus = useRef<HTMLElement | null>(null);
  const rel = (RELATED[code] ?? []).filter(c => data[c]?.length); const i = seq.indexOf(code);
  const next = [...seq.slice(i + 1), ...seq.slice(0, Math.max(i, 0))].filter((c: string) => c !== code && !rel.includes(c)).slice(0, 8);
  useEffect(() => { prevFocus.current = document.activeElement as HTMLElement; document.body.style.overflow = 'hidden'; box.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => { document.body.style.overflow = ''; prevFocus.current?.focus?.(); }; }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => onKey(e as any); document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    const tag = (e.target as HTMLElement).tagName; if (tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); onSwap(seq[(i + 1) % seq.length]); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onSwap(seq[(i - 1 + seq.length) % seq.length]); }
    if (e.key === 'Tab') { if (!box.current!.contains(document.activeElement)) { e.preventDefault(); box.current!.querySelector<HTMLElement>('[data-autofocus]')?.focus(); return; } const f = [...box.current!.querySelectorAll<HTMLElement>('button,select,a[href],[tabindex="0"]')].filter(x => !x.hasAttribute('disabled'));
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  };
  const pts = s.filter(p => p[0] >= r[0] && p[0] <= r[1]); const st = stats(s);
  const Thumb = ({ c }: { c: string }) => { const t = meta[c]; const ts = data[c] ?? []; return <button type="button" onClick={() => onSwap(c)} className="edge rounded-xl p-3 text-left min-w-[11rem] lg:min-w-0 hover:border-accent focus-visible:border-accent shrink-0">
    <span className="block text-xs font-semibold truncate">{t.label}</span><span className="block text-[11px] text-muted">{fmt(ts.at(-1)?.[1], t.unit)} ({ts.at(-1)?.[0]})</span><Spark s={ts} h={34} /></button>; };
  return <div ref={box} role="dialog" aria-modal="true" aria-labelledby="fv-title" className="fixed inset-0 z-[80] bg-surface/98 backdrop-blur-xl overflow-y-auto fade-in">
    <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-5 grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="kicker">{countryName} · {i + 1} of {seq.length}</p><h2 id="fv-title" className="text-2xl md:text-4xl font-light mt-1">{m.label} <span className="text-muted text-lg">({m.unit})</span></h2>
            <p className="mt-1 text-sm"><span className="font-mono text-accent text-xl">{fmt(st.last?.[1], m.unit)}</span> <span className="text-muted">in {st.last?.[0]}</span> · <Delta d={st.yoy} unit={m.unit} good={m.good} label=" YoY" /> · <Delta d={st.d5} unit={m.unit} good={m.good} label=" 5y" /></p></div>
          <div className="flex items-center gap-2"><Range yrs={yrs} r={r} set={setR} id="fv" />
            <button type="button" onClick={() => onSwap(seq[(i - 1 + seq.length) % seq.length])} className="rounded-md border border-white/15 p-2 hover:border-accent" aria-label="Previous metric"><ChevronLeft size={16} aria-hidden /></button>
            <button type="button" onClick={() => onSwap(seq[(i + 1) % seq.length])} className="rounded-md border border-white/15 p-2 hover:border-accent" aria-label="Next metric"><ChevronRight size={16} aria-hidden /></button>
            <button type="button" data-autofocus onClick={onClose} className="rounded-md border border-white/30 p-2 hover:bg-white/10" aria-label="Close full screen (Esc)"><X size={18} aria-hidden /></button></div>
        </div>
        <div className="edge rounded-2xl p-3 md:p-4">{pts.length ? <Canvas key={`fv${code}${r.join()}`} p={{ series: [{ name: `${m.label} (${m.unit})`, data: pts, unit: m.unit }], colors: [AMBER], title: m.label, area: true }} full h="min(62vh, 640px)" /> : <p className="py-20 text-center text-muted">No data in this range.</p>}</div>
        <p className="text-xs text-muted">Source: World Bank World Development Indicators, {m.code}, CC BY 4.0. Scroll or pinch on the chart, or drag the slider, to zoom. ← → switch metrics, Esc closes.</p>
        <details className="text-sm"><summary className="cursor-pointer text-muted">Data table</summary><table className="mt-2 w-full max-w-md tabular-nums"><caption className="sr-only">{m.label} by year</caption><thead><tr className="text-left text-muted"><th>Year</th><th>Value ({m.unit})</th></tr></thead><tbody>{[...pts].reverse().map(([y, v]) => <tr key={y} className="border-t border-white/10"><td>{y}</td><td className="font-mono">{v.toFixed(2)}</td></tr>)}</tbody></table></details>
        {next.length > 0 && <section aria-label="More charts in sequence"><h3 className="text-sm font-semibold mb-2">Next in sequence</h3><div className="flex gap-3 overflow-x-auto pb-2">{next.map((c: string) => <Thumb key={c} c={c} />)}</div></section>}
      </div>
      <aside aria-label="Related metrics" className="min-w-0"><h3 className="text-sm font-semibold mb-2">Related metrics</h3><div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2">{rel.map(c => <Thumb key={c} c={c} />)}</div></aside>
    </div>
  </div>;
}
export default function Dashboard(p: Props) {
  const meta = useMemo(() => Object.fromEntries(p.meta.map(m => [m.code, m])), [p.meta]) as Record<string, Meta>;
  const yrs = useMemo(() => Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i), [p.years]);
  const list = (ind: string) => p.meta.filter(m => (ind === 'overview' || m.industry === ind) && p.data[m.code]?.length).map(m => m.code);
  const [ind, setInd] = useState(p.pageIndustry); const [metric, setMetric] = useState(list(p.pageIndustry)[0]);
  const [g, setG] = useState<[number, number]>(p.years); const [ranges, setRanges] = useState<Record<string, [number, number]>>({});
  const [view, setView] = useState<string | null>(null);
  const codes = list(ind);
  // read state from URL once hydrated (server render = clean defaults)
  useEffect(() => { const q = new URLSearchParams(location.search); const i = q.get('industry'), m = q.get('metric'), f = +(q.get('from') ?? 0), t = +(q.get('to') ?? 0), v = q.get('view');
    if (i && (i === 'overview' || p.industries.some(x => x.id === i))) setInd(i);
    if (m && meta[m]) setMetric(m); else if (i) setMetric(list(i)[0]);
    if (f && t && f <= t) setG([Math.max(f, p.years[0]), Math.min(t, p.years[1])]);
    if (v && meta[v]) setView(v);
    const pop = () => { if (depth.current > 0) depth.current--; const v2 = new URLSearchParams(location.search).get('view'); setView(v2 && meta[v2] ? v2 : null); };
    addEventListener('popstate', pop); return () => removeEventListener('popstate', pop); }, []);
  const url = useCallback((o: Record<string, string | null>) => { const q = new URLSearchParams(location.search); for (const [k, v] of Object.entries(o)) v == null ? q.delete(k) : q.set(k, v); const s = q.toString(); return location.pathname + (s ? '?' + s : '') + location.hash; }, []);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } history.replaceState(history.state, '', url({ industry: ind === p.pageIndustry ? null : ind, metric, from: g[0] === p.years[0] ? null : String(g[0]), to: g[1] === p.years[1] ? null : String(g[1]) })); }, [ind, metric, g]);
  const depth = useRef(0); // history entries pushed by the full-screen view
  const openView = (c: string) => { depth.current = 1; history.pushState({ view: c }, '', url({ view: c })); setView(c); };
  const swapView = (c: string) => { depth.current++; history.pushState({ view: c }, '', url({ view: c })); setView(c); };
  const closeView = () => { if (depth.current > 0) { const n = depth.current; depth.current = 0; history.go(-n); } else { history.replaceState(null, '', url({ view: null })); setView(null); } };
  const rangeOf = (c: string) => ranges[c] ?? g; const setRange = (c: string) => (r: [number, number]) => setRanges(x => ({ ...x, [c]: r }));
  const setGlobal = (r: [number, number]) => { setG(r); setRanges({}); };
  const m = meta[metric]; const s = p.data[metric] ?? []; const st = stats(s);
  const rel = (RELATED[metric] ?? []).filter(c => p.data[c]?.length).slice(0, 4);
  const ctr = COUNTER[metric]; const cm = ctr && meta[ctr]; const cs = ctr ? stats(p.data[ctr] ?? []) : null;
  const seq = [metric, ...rel, ...codes.filter(c => c !== metric && !rel.includes(c)), ...p.meta.map(x => x.code).filter(c => c !== metric && !rel.includes(c) && !codes.includes(c) && p.data[c]?.length)];
  const summary = st.last ? [`${poss(p.countryName)} ${lc(m.label)} was ${fmt(st.last[1], m.unit)}${unitTail(m.unit)} in ${st.last[0]} (World Bank, ${m.code}).`,
    st.d5 != null && st.five ? `Over five years (${st.five[0]}–${st.last[0]}) it ${st.d5 > 0 ? 'rose' : st.d5 < 0 ? 'fell' : 'held'} ${st.d5 ? 'by ' + fmt(Math.abs(st.d5), m.unit.startsWith('%') ? '' : m.unit) + (m.unit.startsWith('%') ? ' percentage points' : '') : 'steady'}.` : '',
    rel.length ? `Read it alongside ${rel.slice(0, 3).map(c => lc(meta[c].label)).join(', ')}.` : ''].filter(Boolean).join(' ') : `No ${lc(m.label)} data for ${p.countryName} yet.`;
  const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text focus-visible:border-accent';
  return <div>
    <div id="dash" className="sticky top-16 z-30 border-y border-white/10 bg-black/75 backdrop-blur-2xl scroll-mt-16">
      <form className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-wrap items-end gap-3" onSubmit={e => e.preventDefault()} aria-label="Dashboard filters">
        <span className="flex items-center gap-2 text-sm font-semibold text-accent self-center"><SlidersHorizontal size={16} aria-hidden />Explore</span>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Industry<select className={field} value={ind} onChange={e => { setInd(e.target.value); setMetric(list(e.target.value)[0]); }}><option value="overview">All industries</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Metric<select className={field + ' max-w-[15rem]'} value={metric} onChange={e => setMetric(e.target.value)}>{codes.map(c => <option key={c} value={c}>{meta[c].label}</option>)}</select></label>
        <span className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Years (all charts)<Range yrs={yrs} r={g} set={setGlobal} id="g" /></span>
        <span className="self-center text-xs text-muted">Metric vs metric and country vs country: <span className="text-text">coming soon</span></span>
      </form>
    </div>
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 grid gap-6" aria-live="polite">
      <section key={'h' + metric} className="grid gap-6 lg:grid-cols-[1fr_2fr] fade-in" aria-labelledby="hero-kpi">
        <div className="edge glow-amber rounded-2xl p-6 flex flex-col gap-3 min-w-0">
          <p className="kicker">{ind === 'overview' ? 'Economy' : p.industries.find(i => i.id === ind)?.name} · selected metric</p>
          <h2 id="hero-kpi" className="text-xl font-semibold">{m.label}</h2>
          <p className="font-mono text-5xl md:text-6xl text-strong tabular-nums">{fmt(st.last?.[1], m.unit)}</p>
          <p className="text-sm text-muted">{m.unit} · data year {st.last?.[0] ?? '—'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1"><Delta d={st.yoy} unit={m.unit} good={m.good} label={` vs ${st.prev?.[0] ?? '—'}`} /><Delta d={st.d5} unit={m.unit} good={m.good} label={` vs ${st.five?.[0] ?? '—'}`} /></div>
          <Spark s={s.filter(x => x[0] >= g[0] && x[0] <= g[1])} h={56} />
          <p className="text-sm leading-relaxed text-text">{summary}</p>
          <div className="flex flex-wrap gap-2 mt-1">{codes.filter(c => c !== metric).slice(0, 6).map(c => <button key={c} type="button" onClick={() => setMetric(c)} className="text-xs rounded-full border border-white/15 px-2.5 py-1 hover:border-accent hover:text-accent">{meta[c].label}</button>)}</div>
        </div>
        <ChartCard big m={m} s={s} range={rangeOf(metric)} setRange={setRange(metric)} yrs={yrs} onOpen={() => openView(metric)} />
      </section>
      {cm && cs?.last && st.last && <section key={'c' + metric} className="edge edge-signal rounded-2xl p-5 grid gap-3 md:grid-cols-[auto_1fr_1fr] items-center fade-in" aria-labelledby="ctr-h">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-white/5 p-2.5 text-signal"><Scale size={20} aria-hidden /></span><div><h2 id="ctr-h" className="font-semibold">Counter-metric check</h2><p className="text-xs text-muted max-w-[16rem]">"{p.countryName}'s {lc(m.label)} is {st.d5 != null && st.d5 >= 0 ? 'up' : 'down'}." Check it against {lc(cm.label)}.</p></div></div>
        <div className="min-w-0"><p className="text-xs text-muted">Claim metric · {m.label}</p><p className="font-mono tabular-nums">{fmt(st.five?.[1], m.unit)} ({st.five?.[0]}) → {fmt(st.last[1], m.unit)} ({st.last[0]})</p></div>
        <button type="button" onClick={() => openView(ctr)} className="min-w-0 text-left hover:text-accent"><p className="text-xs text-muted">Counter-metric · {cm.label}</p><p className="font-mono tabular-nums">{fmt(cs.five?.[1], cm.unit)} ({cs.five?.[0]}) → {fmt(cs.last[1], cm.unit)} ({cs.last[0]})</p></button>
      </section>}
      <section key={'r' + metric} aria-labelledby="rel-h" className="fade-in"><div className="label-pair mb-4"><b id="rel-h">Related</b><span>What to read next to {lc(m.label)}</span></div>
        <div className="grid gap-4 md:grid-cols-2">{rel.map((c, i) => <ChartCard key={c} m={meta[c]} s={p.data[c]} range={rangeOf(c)} setRange={setRange(c)} yrs={yrs} onOpen={() => openView(c)} color={i % 2 ? '#E6E6E6' : AMBER} />)}</div>
      </section>
    </div>
    {view && meta[view] && <FullView code={view} meta={meta} data={p.data} yrs={yrs} range0={rangeOf(view)} countryName={p.countryName} onClose={closeView} onSwap={swapView} seq={seq.includes(view) ? seq : [view, ...seq]} />}
  </div>;
}
