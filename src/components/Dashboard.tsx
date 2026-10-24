import { DEEP, deepUrl } from '../lib/deep';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, Maximize2, X, ArrowUpRight, ArrowDownRight, Minus, ChevronLeft, ChevronRight, Scale, Link2, Image as ImageIcon, FileDown, Code2, Plus, Layers } from 'lucide-react';
import { PALETTE, MAX_SERIES, COUNTRY_NAMES, parseCmp, fmtCmp, loadCountry, seed, build, units, csv, download, type Ref } from '../lib/compose';
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
function ChartCard({ m, s, range, setRange, yrs, onOpen, big, color = AMBER, comp, onChart, share }: any) {
  const pts = s.filter((p: Pt) => p[0] >= range[0] && p[0] <= range[1]); const st = stats(s);
  return <article onClick={e => { if (!(e.target as HTMLElement).closest('select,button,a,input,textarea,label,[data-share]')) onOpen(); }} className="edge rounded-2xl p-4 md:p-5 flex flex-col gap-2 min-w-0 fade-in cursor-zoom-in">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h3 className={`font-semibold ${big ? 'text-lg' : 'text-sm'}`}>{m.label} <span className="text-muted font-normal text-xs">({m.unit})</span></h3>
        <p className="text-xs text-muted">Latest <span className="font-mono text-text">{fmt(st.last?.[1], m.unit)}</span> ({st.last?.[0]})</p></div>
      <div className="flex items-center gap-2"><Range yrs={yrs} r={range} set={setRange} id={'r' + m.code + (big ? 'b' : '')} />
        <button type="button" onClick={onOpen} className="rounded-md border border-white/15 p-1.5 hover:border-accent hover:text-accent" aria-label={`Open ${m.label} full screen`}><Maximize2 size={14} aria-hidden /></button></div>
    </div>
    <button type="button" onClick={onOpen} className="block w-full text-left cursor-zoom-in" aria-label={`${m.label} chart, ${range[0]}–${range[1]}. Open full screen`}>
      {comp && comp.series.length > 1 ? <Canvas key={comp.key} p={comp} full={false} h={360} onReady={onChart} /> : pts.length ? <Canvas key={`${m.code}${range.join()}${comp?.key ?? ''}`} p={comp ?? { series: [{ name: `${m.label} (${m.unit})`, data: pts, unit: m.unit }], colors: [color], title: m.label, area: true }} full={false} h={big ? 320 : 200} onReady={onChart} /> : <p className="text-sm text-muted py-8 text-center">No data in this range.</p>}
    </button>
    <p className="text-[11px] text-muted">World Bank WDI {m.code}{comp && comp.series.length > 1 ? ' and compared series' : ''} · CC BY 4.0</p>
    {share}
  </article>;
}
function ShareBar({ chart, series, title, query, view }: { chart: () => any; series: any[]; title: string; query: string; view?: string }) {
  const [msg, setMsg] = useState(''); const [emb, setEmb] = useState(false);
  const fileBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const link = () => location.origin + location.pathname + '?' + query + (view ? '&view=' + encodeURIComponent(view) : '');
  const embed = `<iframe src="${typeof location === 'undefined' ? '' : location.origin}/embed/?${query}" title="${title.replace(/"/g, '')} (GovPulse)" width="100%" height="420" style="border:0;max-width:900px" loading="lazy"></iframe>`;
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2200); };
  const b = 'inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2 py-1 text-xs hover:border-accent hover:text-accent';
  return <div className="flex flex-wrap items-center gap-2" data-share>
    <button type="button" className={b} onClick={async () => { try { await navigator.clipboard.writeText(link()); flash('Link copied'); } catch { prompt('Copy this link', link()); } }}><Link2 size={13} aria-hidden />Copy link</button>
    <button type="button" className={b} onClick={() => { const c = chart(); if (!c) return; download(fileBase + '.png', c.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0A0A0A' })); flash('PNG saved'); }}><ImageIcon size={13} aria-hidden />PNG</button>
    <button type="button" className={b} onClick={() => { const u = URL.createObjectURL(new Blob([csv(series) + '# Source: World Bank WDI (CC BY 4.0), via GovPulse ' + link() + '\n'], { type: 'text/csv' })); download(fileBase + '.csv', u); setTimeout(() => URL.revokeObjectURL(u), 4000); flash('CSV saved'); }}><FileDown size={13} aria-hidden />CSV</button>
    <button type="button" className={b} aria-expanded={emb} onClick={() => setEmb(!emb)}><Code2 size={13} aria-hidden />Embed</button>
    <span role="status" className="text-xs text-accent">{msg}</span>
    {emb && <div className="w-full"><label className="text-[11px] text-muted" htmlFor={'emb' + fileBase}>Paste this on your site. It links back to GovPulse.</label>
      <textarea id={'emb' + fileBase} readOnly rows={3} className="mt-1 w-full rounded-md bg-black/60 border border-white/15 p-2 font-mono text-[11px]" value={embed} onFocus={e => e.currentTarget.select()} />
      <button type="button" className={b} onClick={async () => { try { await navigator.clipboard.writeText(embed); flash('Embed code copied'); } catch {} }}>Copy embed code</button></div>}
  </div>;
}
function CompareBar({ meta, country, cmp, setCmp, idx, setIdx, skipped, base, pre = '' }: any) {
  const [c, setC] = useState(country === 'usa' ? 'india' : 'usa'); const [code, setCode] = useState(base);
  useEffect(() => setCode(base), [base]);
  const full = cmp.length >= MAX_SERIES - 1; const f = 'bg-black/50 border border-white/15 rounded-md px-2 py-1 text-xs text-text focus-visible:border-accent max-w-[14rem]';
  const add = () => { if (full || cmp.some((x: Ref) => x.c === c && x.code === code) || (c === country && code === base)) return; setCmp([...cmp, { c, code }]); };
  return <section aria-labelledby={pre + "cmp-h"} className="edge rounded-2xl p-4 flex flex-col gap-3" data-compare>
    <div className="flex flex-wrap items-center gap-3"><h2 id={pre + "cmp-h"} className="text-sm font-semibold flex items-center gap-2"><Layers size={15} className="text-accent" aria-hidden />Compare &amp; overlay</h2>
      <label className="sr-only" htmlFor={pre + "cmp-c"}>Country</label><select id={pre + "cmp-c"} className={f} value={c} onChange={e => setC(e.target.value)}>{Object.entries(COUNTRY_NAMES).map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
      <label className="sr-only" htmlFor={pre + "cmp-m"}>Metric</label><select id={pre + "cmp-m"} className={f} value={code} onChange={e => setCode(e.target.value)}>{Object.values(meta).map((m: any) => <option key={m.code} value={m.code}>{m.label}</option>)}</select>
      <button type="button" disabled={full} onClick={add} className="inline-flex items-center gap-1 rounded-md bg-cta text-black font-semibold px-2.5 py-1 text-xs disabled:opacity-40"><Plus size={13} aria-hidden />Add to chart</button>
      <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer"><input type="checkbox" checked={idx} onChange={e => setIdx(e.target.checked)} className="accent-[#FFB224]" />Index to 100 (first year)</label>
      <span className="text-[11px] text-muted">{cmp.length + 1}/{MAX_SERIES} series</span></div>
    {cmp.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Series on the chart">{cmp.map((x: Ref, i: number) => <li key={x.c + x.code} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 pl-2.5 pr-1 py-0.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[(i + 1) % PALETTE.length] }} aria-hidden />{COUNTRY_NAMES[x.c]} · {meta[x.code]?.label}
      <button type="button" onClick={() => setCmp(cmp.filter((_: Ref, j: number) => j !== i))} className="rounded-full p-0.5 hover:bg-white/10" aria-label={`Remove ${COUNTRY_NAMES[x.c]} ${meta[x.code]?.label}`}><X size={12} aria-hidden /></button></li>)}
      <li><button type="button" onClick={() => setCmp([])} className="text-xs text-muted underline underline-offset-2 hover:text-accent">Clear all</button></li></ul>}
    {skipped.length > 0 && <p className="text-[11px] text-signal">Not indexed (first value is zero or negative): {skipped.join(', ')}.</p>}
    <p className="text-[11px] text-muted">Different units get a second y-axis. Click a legend item to hide it; × removes it.</p>
  </section>;
}
function InDepth({ ind, country, countryName, compact, metric }: { ind: string; country: string; countryName: string; compact?: boolean; metric?: string }) {
  const d = DEEP[ind]; const u = deepUrl(ind, country); const dash = `/dashboards/?c=${country}&industry=${ind}${metric ? '&metric=' + metric : ''}`;
  return <section aria-labelledby={'deep-' + (compact ? 'f' : 'p')} className="edge glow-amber rounded-2xl p-4 flex flex-col gap-2" data-indepth>
    <p className="kicker">In-depth analysis</p>
    {d && u ? <><h3 id={'deep-' + (compact ? 'f' : 'p')} className="font-semibold">{countryName} · {d.label} drill-down</h3><p className="text-xs text-muted">{d.what}.</p>
      <div className="flex flex-wrap gap-2"><a href={dash} data-indepth-go className="rounded-full bg-cta text-black text-xs font-semibold px-3 py-1.5 hover:bg-white">Open in Dashboards →</a><a href={u} className="rounded-full border border-white/20 text-xs px-3 py-1.5 hover:border-accent hover:text-accent">Commodity dashboard</a><a href={deepUrl(ind, country, 'explorer')!} className="rounded-full border border-white/20 text-xs px-3 py-1.5 hover:border-accent hover:text-accent">Commodity explorer</a></div></>
    : <><h3 id={'deep-' + (compact ? 'f' : 'p')} className="font-semibold">{countryName} dashboard</h3><a href={dash} data-indepth-go className="self-start rounded-full bg-cta text-black text-xs font-semibold px-3 py-1.5 hover:bg-white">Open in Dashboards →</a><p className="text-xs text-muted">No free, keyless commodity-level source for this field yet. Drill-downs exist for <a className="underline" href={`/commodities/trade/${country}/`}>trade</a>, <a className="underline" href={`/commodities/agriculture/${country}/`}>agriculture</a>, <a className="underline" href={`/commodities/energy/${country}/`}>energy</a> and <a className="underline" href={`/commodities/manufacturing/${country}/`}>manufacturing</a>.</p></>}
  </section>;
}
function FullView({ code, meta, data, yrs, range0, countryName, country, onClose, onSwap, seq, compose, shareQ, cmpProps }: any) {
  const fvChart = useRef<any>(null);
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
  const pts = s.filter(p => p[0] >= r[0] && p[0] <= r[1]); const st = stats(s); const comp = compose(code, r);
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
        <div className="edge rounded-2xl p-3 md:p-4">{pts.length || comp.series.length > 1 ? <Canvas key={'fv' + comp.key} p={comp} full h="min(62vh, 640px)" onReady={(c: any) => (fvChart.current = c)} /> : <p className="py-20 text-center text-muted">No data in this range.</p>}</div>
        <ShareBar chart={() => fvChart.current} series={comp.series} title={`${countryName} ${m.label}`} query={shareQ(code, r)} view={code} />
        <div data-fv-compare><CompareBar {...cmpProps} base={code} pre="fv-" /></div>
        <p className="text-xs text-muted">Source: World Bank World Development Indicators, {m.code}, CC BY 4.0. Scroll or pinch on the chart, or drag the slider, to zoom. ← → switch metrics, Esc closes.</p>
        <details className="text-sm"><summary className="cursor-pointer text-muted">Data table</summary><table className="mt-2 w-full max-w-md tabular-nums"><caption className="sr-only">{m.label} by year</caption><thead><tr className="text-left text-muted"><th>Year</th><th>Value ({m.unit})</th></tr></thead><tbody>{[...pts].reverse().map(([y, v]) => <tr key={y} className="border-t border-white/10"><td>{y}</td><td className="font-mono">{v.toFixed(2)}</td></tr>)}</tbody></table></details>
        {next.length > 0 && <section aria-label="More charts in sequence"><h3 className="text-sm font-semibold mb-2">Next in sequence</h3><div className="flex gap-3 overflow-x-auto pb-2">{next.map((c: string) => <Thumb key={c} c={c} />)}</div></section>}
      </div>
      <aside aria-label="In-depth analysis and related metrics" className="min-w-0 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Country<select data-fv-country className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text normal-case tracking-normal" value={country} onChange={e => { const q = new URLSearchParams(location.search); q.set('view', code); q.set('metric', code); location.href = location.pathname.replace(/^\/[a-z]+/, '/' + e.target.value) + '?' + q.toString().replace(/%7E/g, '~').replace(/%2C/g, ','); }}>{Object.entries(COUNTRY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <InDepth ind={m.industry} country={country} countryName={countryName} metric={code} compact />
        <div><h3 className="text-sm font-semibold mb-2">Related metrics</h3><div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2">{rel.map(c => <Thumb key={c} c={c} />)}</div></div></aside>
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
  const [cmp, setCmp] = useState<Ref[]>([]); const [idx, setIdx] = useState(false); const [ext, setExt] = useState<Record<string, Record<string, Pt[]>>>({}); const mainChart = useRef<any>(null);
  useEffect(() => { seed(p.country, p.data); }, []);
  useEffect(() => { for (const c of new Set(cmp.map(x => x.c))) if (!ext[c] && c !== p.country) loadCountry(c).then(d => setExt(e => ({ ...e, [c]: d }))); }, [cmp]);
  const dataOf = (c: string) => c === p.country ? p.data : ext[c];
  const compose = (code: string, r: [number, number]) => { const mm = meta[code]; const items = [{ name: `${p.countryName} · ${mm.label}`, unit: mm.unit, data: p.data[code] ?? [] }, ...cmp.filter(x => meta[x.code] && dataOf(x.c)).map(x => ({ name: `${COUNTRY_NAMES[x.c]} · ${meta[x.code].label}`, unit: meta[x.code].unit, data: dataOf(x.c)?.[x.code] ?? [] }))];
    const b = build(items, r, idx); const multi = b.series.length > 1; return { ...b, colors: PALETTE, title: mm.label, area: !multi, dual: multi && units(b.series).length > 1, key: code + r.join() + idx + b.series.map(x => x.name + x.data.length).join() }; };
  const shareQ = (code: string, r: [number, number]) => { const q = new URLSearchParams({ c: p.country, metric: code }); if (r[0] !== p.years[0]) q.set('from', String(r[0])); if (r[1] !== p.years[1]) q.set('to', String(r[1])); if (cmp.length) q.set('cmp', fmtCmp(cmp)); if (idx) q.set('idx', '1'); return q.toString().replace(/%7E/g, '~').replace(/%2C/g, ','); };
  const codes = list(ind);
  // read state from URL once hydrated (server render = clean defaults)
  useEffect(() => { const q = new URLSearchParams(location.search); const i = q.get('industry'), m = q.get('metric'), f = +(q.get('from') ?? 0), t = +(q.get('to') ?? 0), v = q.get('view');
    if (i && (i === 'overview' || p.industries.some(x => x.id === i))) setInd(i);
    if (m && meta[m]) setMetric(m); else if (i) setMetric(list(i)[0]);
    if (f && t && f <= t) setG([Math.max(f, p.years[0]), Math.min(t, p.years[1])]);
    if (v && meta[v]) setView(v);
    setCmp(parseCmp(q.get('cmp')).filter(x => meta[x.code])); setIdx(q.get('idx') === '1');
    const pop = () => { if (depth.current > 0) depth.current--; const v2 = new URLSearchParams(location.search).get('view'); setView(v2 && meta[v2] ? v2 : null); };
    addEventListener('popstate', pop); return () => removeEventListener('popstate', pop); }, []);
  const url = useCallback((o: Record<string, string | null>) => { const q = new URLSearchParams(location.search); for (const [k, v] of Object.entries(o)) v == null ? q.delete(k) : q.set(k, v); const s = q.toString(); return location.pathname + (s ? '?' + s : '') + location.hash; }, []);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } history.replaceState(history.state, '', url({ industry: ind === p.pageIndustry ? null : ind, metric, from: g[0] === p.years[0] ? null : String(g[0]), to: g[1] === p.years[1] ? null : String(g[1]), cmp: cmp.length ? fmtCmp(cmp) : null, idx: idx ? '1' : null }).replace(/%7E/g, '~').replace(/%2C/g, ',')); }, [ind, metric, g, cmp, idx]);
  const depth = useRef(0); // history entries pushed by the full-screen view
  const openView = (c: string) => { depth.current = 1; history.pushState({ view: c }, '', url({ view: c })); setView(c); };
  const swapView = (c: string) => { depth.current++; history.pushState({ view: c }, '', url({ view: c })); setView(c); };
  const closeView = () => { if (depth.current > 0) { const n = depth.current; depth.current = 0; history.go(-n); } else { history.replaceState(null, '', url({ view: null })); setView(null); } };
  const rangeOf = (c: string) => ranges[c] ?? g; const setRange = (c: string) => (r: [number, number]) => setRanges(x => ({ ...x, [c]: r }));
  const setGlobal = (r: [number, number]) => { setG(r); setRanges({}); };
  const m = meta[metric]; const s = p.data[metric] ?? []; const st = stats(s); const mainComp = compose(metric, rangeOf(metric));
  const rel = (RELATED[metric] ?? []).filter(c => p.data[c]?.length).slice(0, 4);
  const ctr = COUNTER[metric]; const cm = ctr && meta[ctr]; const cs = ctr ? stats(p.data[ctr] ?? []) : null;
  const seq = [metric, ...rel, ...codes.filter(c => c !== metric && !rel.includes(c)), ...p.meta.map(x => x.code).filter(c => c !== metric && !rel.includes(c) && !codes.includes(c) && p.data[c]?.length)];
  const summary = st.last ? [`${poss(p.countryName)} ${lc(m.label)} was ${fmt(st.last[1], m.unit)}${unitTail(m.unit)} in ${st.last[0]} (World Bank, ${m.code}).`,
    st.d5 != null && st.five ? `Over five years (${st.five[0]}–${st.last[0]}) it ${fmt(Math.abs(st.d5), '') === fmt(0, '') ? 'was roughly unchanged' : st.d5 > 0 ? 'rose' : 'fell'}${fmt(Math.abs(st.d5), '') !== fmt(0, '') ? ' by ' + fmt(Math.abs(st.d5), m.unit.startsWith('%') ? '' : m.unit) + (m.unit.startsWith('%') ? ' percentage points' : '') : ''}.` : '',
    rel.length ? `Read it alongside ${rel.slice(0, 3).map(c => lc(meta[c].label)).join(', ')}.` : ''].filter(Boolean).join(' ') : `No ${lc(m.label)} data for ${p.countryName} yet.`;
  const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text focus-visible:border-accent';
  return <div>
    <div id="dash" className="sticky top-16 z-30 border-y border-white/10 bg-black/75 backdrop-blur-2xl scroll-mt-16">
      <form className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-wrap items-end gap-3" onSubmit={e => e.preventDefault()} aria-label="Dashboard filters">
        <span className="flex items-center gap-2 text-sm font-semibold text-accent self-center"><SlidersHorizontal size={16} aria-hidden />Explore</span>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Industry<select className={field} value={ind} onChange={e => { setInd(e.target.value); setMetric(list(e.target.value)[0]); }}><option value="overview">All industries</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Metric<select className={field + ' max-w-[15rem]'} value={metric} onChange={e => setMetric(e.target.value)}>{codes.map(c => <option key={c} value={c}>{meta[c].label}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Depth<select data-depth className={field} value="headline" onChange={e => { const di = ind === 'overview' ? m.industry : ind; const u = deepUrl(di, p.country, e.target.value as any); if (u) location.href = u; }}><option value="headline">Headline metrics</option><option value="explorer" disabled={!DEEP[ind === 'overview' ? m.industry : ind]}>Commodity explorer{DEEP[ind === 'overview' ? m.industry : ind] ? '' : ' (coming)'}</option><option value="dashboard" disabled={!DEEP[ind === 'overview' ? m.industry : ind]}>Dashboard{DEEP[ind === 'overview' ? m.industry : ind] ? '' : ' (coming)'}</option></select></label>
        <span className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Years (all charts)<Range yrs={yrs} r={g} set={setGlobal} id="g" /></span>
        <a href="#cmp-h" className="self-center text-xs text-accent hover:underline">Compare countries &amp; metrics ↓</a>
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
          <button type="button" onClick={() => openView(metric)} className="cursor-zoom-in text-left" aria-label={`Open ${m.label} full screen`}><Spark s={s.filter(x => x[0] >= g[0] && x[0] <= g[1])} h={56} /></button>
          <p className="text-sm leading-relaxed text-text">{summary}</p>
          <div className="flex flex-wrap gap-2 mt-1">{codes.filter(c => c !== metric).slice(0, 6).map(c => <button key={c} type="button" onClick={() => setMetric(c)} className="text-xs rounded-full border border-white/15 px-2.5 py-1 hover:border-accent hover:text-accent">{meta[c].label}</button>)}</div>
        </div>
        <ChartCard big m={m} s={s} range={rangeOf(metric)} setRange={setRange(metric)} yrs={yrs} onOpen={() => openView(metric)} comp={mainComp} onChart={(c: any) => (mainChart.current = c)} share={<ShareBar chart={() => mainChart.current} series={mainComp.series} title={`${p.countryName} ${m.label}`} query={shareQ(metric, rangeOf(metric))} />} />
      </section>
      <CompareBar meta={meta} country={p.country} cmp={cmp} setCmp={setCmp} idx={idx} setIdx={setIdx} skipped={mainComp.skipped} base={metric} />
      {cm && cs?.last && st.last && <section key={'c' + metric} className="edge edge-signal rounded-2xl p-5 grid gap-3 md:grid-cols-[auto_1fr_1fr] items-center fade-in" aria-labelledby="ctr-h">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-white/5 p-2.5 text-signal"><Scale size={20} aria-hidden /></span><div><h2 id="ctr-h" className="font-semibold">Counter-metric check</h2><p className="text-xs text-muted max-w-[16rem]">"{p.countryName}'s {lc(m.label)} is {st.d5 != null && st.d5 >= 0 ? 'up' : 'down'}." Check it against {lc(cm.label)}.</p></div></div>
        <div className="min-w-0"><p className="text-xs text-muted">Claim metric · {m.label}</p><p className="font-mono tabular-nums">{fmt(st.five?.[1], m.unit)} ({st.five?.[0]}) → {fmt(st.last[1], m.unit)} ({st.last[0]})</p></div>
        <button type="button" onClick={() => openView(ctr)} className="min-w-0 text-left hover:text-accent"><p className="text-xs text-muted">Counter-metric · {cm.label}</p><p className="font-mono tabular-nums">{fmt(cs.five?.[1], cm.unit)} ({cs.five?.[0]}) → {fmt(cs.last[1], cm.unit)} ({cs.last[0]})</p></button>
      </section>}
      <InDepth ind={m.industry} country={p.country} countryName={p.countryName} metric={metric} />
      <section key={'r' + metric} aria-labelledby="rel-h" className="fade-in"><div className="label-pair mb-4"><b id="rel-h">Related</b><span>What to read next to {lc(m.label)}</span></div>
        <div className="grid gap-4 md:grid-cols-2">{rel.map((c, i) => <ChartCard key={c} m={meta[c]} s={p.data[c]} range={rangeOf(c)} setRange={setRange(c)} yrs={yrs} onOpen={() => openView(c)} color={i % 2 ? '#E6E6E6' : AMBER} />)}</div>
      </section>
    </div>
    {view && meta[view] && <FullView code={view} meta={meta} data={p.data} yrs={yrs} range0={rangeOf(view)} countryName={p.countryName} country={p.country} cmpProps={{ meta, country: p.country, cmp, setCmp, idx, setIdx, skipped: compose(view, rangeOf(view)).skipped }} onClose={closeView} onSwap={swapView} compose={compose} shareQ={shareQ} seq={seq.includes(view) ? seq : [view, ...seq]} />}
  </div>;
}
