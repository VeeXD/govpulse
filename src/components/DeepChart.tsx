import { useEffect, useRef, useState } from 'react';
import { Maximize2, X, Link2, Image as ImageIcon, FileDown } from 'lucide-react';
import { Canvas } from './Chart';
import { PALETTE, COUNTRY_NAMES, csv, download } from '../lib/compose';
type Pt = [number, number];
/** A chart for drill-down pages: year filter, hover, fullscreen with suggestions, compare countries, share (link/PNG/CSV). State lives in the URL (?<id>.cmp, <id>.from, <id>.to, view=<id>). */
export default function DeepChart({ id, title, unit, country, data, source, suggest = [], height = 300 }: { id: string; title: string; unit: string; country: string; data: Record<string, Record<string, Pt[]>>; source: string; suggest?: { label: string; href: string }[]; height?: number }) {
  const own = data[country] ?? {}; const multi = Object.keys(own).length > 1;
  const all = Object.values(data).flatMap(d => Object.values(d).flat().map(p => p[0])); const lo = Math.min(...all), hi = Math.max(...all);
  const yrs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const [r, setR] = useState<[number, number]>([lo, hi]); const [cmp, setCmp] = useState<string[]>([]); const [full, setFull] = useState(false); const [msg, setMsg] = useState('');
  const ch = useRef<any>(null); const fch = useRef<any>(null); const ready = useRef(false);
  useEffect(() => { const q = new URLSearchParams(location.search); const f = +(q.get(id + '.from') ?? lo), t = +(q.get(id + '.to') ?? hi);
    if (f && t && f <= t) setR([Math.max(lo, f), Math.min(hi, t)]); setCmp((q.get(id + '.cmp') ?? '').split(',').filter(c => data[c] && c !== country).slice(0, 5)); if (q.get('view') === id) setFull(true); ready.current = true; }, []);
  const qs = (o: Record<string, string | null>) => { const q = new URLSearchParams(location.search); for (const [k, v] of Object.entries(o)) v == null ? q.delete(k) : q.set(k, v); const s = q.toString().replace(/%2C/g, ','); return location.pathname + (s ? '?' + s : '') + location.hash; };
  useEffect(() => { if (ready.current) history.replaceState(null, '', qs({ [id + '.from']: r[0] === lo ? null : String(r[0]), [id + '.to']: r[1] === hi ? null : String(r[1]), [id + '.cmp']: cmp.length ? cmp.join(',') : null, view: full ? id : (new URLSearchParams(location.search).get('view') === id ? null : new URLSearchParams(location.search).get('view')) })); }, [r, cmp, full]);
  const inR = (s: Pt[]) => s.filter(p => p[0] >= r[0] && p[0] <= r[1]);
  const series = [...Object.entries(own).map(([n, s]) => ({ name: multi ? n : `${COUNTRY_NAMES[country]}`, data: inR(s), unit })),
    ...(multi ? [] : cmp.map(c => ({ name: COUNTRY_NAMES[c], data: inR(Object.values(data[c])[0] ?? []), unit })))].filter(s => s.data.length);
  const p = { series, colors: PALETTE, area: series.length === 1, title };
  const file = (COUNTRY_NAMES[country] + ' ' + title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2000); };
  const sel = 'bg-black/50 border border-white/15 rounded-md px-1.5 py-1 text-xs text-text';
  const b = 'inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2 py-1 text-xs hover:border-accent hover:text-accent';
  const Controls = ({ inFull }: { inFull?: boolean }) => <div className="flex flex-wrap items-center gap-2" data-share>
    <label className="sr-only" htmlFor={id + (inFull ? 'f' : '') + 'from'}>From year</label><select id={id + (inFull ? 'f' : '') + 'from'} className={sel} value={r[0]} onChange={e => setR([Math.min(+e.target.value, r[1]), r[1]])}>{yrs.map(y => <option key={y}>{y}</option>)}</select>–
    <label className="sr-only" htmlFor={id + (inFull ? 'f' : '') + 'to'}>To year</label><select id={id + (inFull ? 'f' : '') + 'to'} className={sel} value={r[1]} onChange={e => setR([r[0], Math.max(+e.target.value, r[0])])}>{yrs.map(y => <option key={y}>{y}</option>)}</select>
    {!multi && <><label className="sr-only" htmlFor={id + (inFull ? 'f' : '') + 'cmp'}>Compare with country</label><select id={id + (inFull ? 'f' : '') + 'cmp'} data-cmp className={sel} value="" onChange={e => e.target.value && setCmp([...cmp, e.target.value].slice(0, 5))}><option value="">+ Compare country</option>{Object.keys(data).filter(c => c !== country && !cmp.includes(c) && COUNTRY_NAMES[c]).map(c => <option key={c} value={c}>{COUNTRY_NAMES[c]}</option>)}</select>
      {cmp.map(c => <button key={c} type="button" className={b} onClick={() => setCmp(cmp.filter(x => x !== c))} aria-label={`Remove ${COUNTRY_NAMES[c]}`}>{COUNTRY_NAMES[c]} ×</button>)}</>}
    <button type="button" className={b} onClick={async () => { const u = location.origin + qs({ view: id }); try { await navigator.clipboard.writeText(u); flash('Link copied'); } catch { prompt('Copy link', u); } }}><Link2 size={13} aria-hidden />Link</button>
    <button type="button" className={b} onClick={() => { const c = (inFull ? fch : ch).current; c && download(file + '.png', c.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0A0A0A' })); }}><ImageIcon size={13} aria-hidden />PNG</button>
    <button type="button" className={b} onClick={() => { const u = URL.createObjectURL(new Blob([csv(series as any) + `# Source: ${source}, via GovPulse\n`], { type: 'text/csv' })); download(file + '.csv', u); }}><FileDown size={13} aria-hidden />CSV</button>
    <span role="status" className="text-xs text-accent">{msg}</span></div>;
  useEffect(() => { if (!full) return; document.body.style.overflow = 'hidden'; const k = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false); addEventListener('keydown', k); return () => { document.body.style.overflow = ''; removeEventListener('keydown', k); }; }, [full]);
  return <figure className="edge rounded-2xl p-4 flex flex-col gap-2 min-w-0" data-deepchart={id}>
    <div className="flex flex-wrap items-start justify-between gap-2"><figcaption className="font-semibold text-sm">{title} <span className="text-muted font-normal text-xs">({unit})</span></figcaption>
      <button type="button" onClick={() => setFull(true)} className="rounded-md border border-white/15 p-1.5 hover:border-accent" aria-label={`Open ${title} full screen`}><Maximize2 size={14} aria-hidden /></button></div>
    <div className="cursor-zoom-in" onClick={() => setFull(true)}>{series.length ? <Canvas key={series.map(s => s.name + s.data.length).join() + r} p={p} full={false} h={height} onReady={c => (ch.current = c)} /> : <p className="py-10 text-center text-sm text-muted">No data in this range.</p>}</div>
    <Controls />
    <p className="text-[11px] text-muted">Source: {source}</p>
    {full && <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[80] bg-surface/98 backdrop-blur-xl overflow-y-auto">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-5 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 flex flex-col gap-3"><div className="flex items-start justify-between gap-3"><div><p className="kicker">{COUNTRY_NAMES[country]}</p><h2 className="text-2xl md:text-4xl font-light">{title} <span className="text-muted text-lg">({unit})</span></h2></div>
          <button type="button" autoFocus onClick={() => setFull(false)} className="rounded-md border border-white/30 p-2 hover:bg-white/10" aria-label="Close full screen (Esc)"><X size={18} aria-hidden /></button></div>
          <div className="edge rounded-2xl p-3"><Canvas key={'f' + series.map(s => s.name + s.data.length).join() + r} p={p} full h="min(62vh, 640px)" onReady={c => (fch.current = c)} /></div>
          <Controls inFull /><p className="text-xs text-muted">Source: {source}. Scroll, pinch or drag the slider to zoom. Esc closes.</p></div>
        <aside className="flex flex-col gap-2"><h3 className="text-sm font-semibold">Suggested next</h3>{suggest.map(s => <a key={s.href} href={s.href} className="edge rounded-xl p-3 text-sm hover:border-accent">{s.label} →</a>)}</aside>
      </div></div>}
  </figure>;
}
