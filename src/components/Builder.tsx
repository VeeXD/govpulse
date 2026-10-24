import { useEffect, useRef, useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown, Download, Link2, Trash2, LayoutGrid } from 'lucide-react';
import { COUNTRY_NAMES, PALETTE, loadCountry, type Pt } from '../lib/compose';
import { Canvas } from './Chart';
type Meta = { code: string; label: string; unit: string; industry: string };
type Panel = { c: string; code: string };
type Props = { meta: Meta[]; industries: { id: string; name: string }[]; years: [number, number]; srcUrl: Record<string, string> };
const LS = 'govpulse.dash.v1', MAXP = 12;
const enc = (p: Panel[]) => p.map(x => `${x.c}~${x.code}`).join(',');
const dec = (s: string | null): Panel[] => (s ?? '').split(',').map(x => x.split('~')).filter(x => x.length === 2 && COUNTRY_NAMES[x[0]]).map(([c, code]) => ({ c, code })).slice(0, MAXP);
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dashboard';
const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text focus-visible:border-accent';
const btn = 'inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs hover:border-accent hover:text-accent';
export default function Builder(p: Props) {
  const M = Object.fromEntries(p.meta.map(m => [m.code, m])) as Record<string, Meta>;
  const yrs = Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i);
  const [panels, setPanels] = useState<Panel[]>([]); const [title, setTitle] = useState('My dashboard');
  const [r, setR] = useState<[number, number]>([Math.max(p.years[0], p.years[1] - 20), p.years[1]]);
  const [data, setData] = useState<Record<string, Record<string, Pt[]>>>({});
  const [c, setC] = useState('india'); const [ind, setInd] = useState('overview'); const [code, setCode] = useState(p.meta[0].code);
  const [modal, setModal] = useState<null | 'png' | 'pdf'>(null); const [msg, setMsg] = useState(''); const [ready, setReady] = useState(false);
  const charts = useRef<Record<number, any>>({});
  const preset = (cc: string, i: string, m?: string | null) => { const list = p.meta.filter(x => i === 'overview' ? x.industry === 'overview' : x.industry === i).map(x => x.code); const first = m && M[m] ? [m] : []; return [...first, ...list.filter(x => x !== m)].slice(0, 6).map(code => ({ c: cc, code })); };
  useEffect(() => { const q = new URLSearchParams(location.search); let ps = dec(q.get('p'));
    const qc = q.get('c'), qi = q.get('industry'), qm = q.get('metric');
    if (!ps.length && qc && COUNTRY_NAMES[qc]) { ps = preset(qc, qi && (qi === 'overview' || p.industries.some(x => x.id === qi)) ? qi : (qm && M[qm]?.industry) || 'overview', qm); setTitle(`${COUNTRY_NAMES[qc]} · ${p.industries.find(x => x.id === (qi || M[qm!]?.industry))?.name ?? 'Overview'} dashboard`); setC(qc); }
    if (q.get('t')) setTitle(q.get('t')!.slice(0, 80));
    if (!ps.length) { try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s?.panels?.length) { ps = s.panels; if (s.title) setTitle(s.title); } } catch {} }
    if (!ps.length) ps = preset('india', 'overview');
    const f = +(q.get('from') ?? 0), t = +(q.get('to') ?? 0); if (f && t && f <= t) setR([Math.max(f, p.years[0]), Math.min(t, p.years[1])]);
    setPanels(ps.filter(x => M[x.code])); setReady(true);
    if (q.get('c') || q.get('p')) setTimeout(() => document.getElementById('builder')?.scrollIntoView(), 50); }, []);
  useEffect(() => { for (const cc of new Set(panels.map(x => x.c))) if (!data[cc]) loadCountry(cc).then(d => setData(o => ({ ...o, [cc]: d }))); }, [panels]);
  const query = () => { const q = new URLSearchParams({ p: enc(panels), t: title, from: String(r[0]), to: String(r[1]) }); return q.toString().replace(/%7E/g, '~').replace(/%2C/g, ','); };
  useEffect(() => { if (!ready) return; history.replaceState(null, '', location.pathname + '?' + query() + location.hash); try { localStorage.setItem(LS, JSON.stringify({ panels, title })); } catch {} }, [panels, title, r, ready]);
  useEffect(() => { const l = p.meta.filter(x => ind === 'overview' || x.industry === ind); if (!l.some(x => x.code === code)) setCode(l[0]?.code); }, [ind]);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };
  const add = () => { if (panels.length >= MAXP || panels.some(x => x.c === c && x.code === code)) return flash(panels.length >= MAXP ? `Max ${MAXP} panels` : 'Already on the dashboard'); setPanels([...panels, { c, code }]); };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= panels.length) return; const n = [...panels]; [n[i], n[j]] = [n[j], n[i]]; setPanels(n); };
  const pts = (x: Panel) => (data[x.c]?.[x.code] ?? []).filter(q => q[0] >= r[0] && q[0] <= r[1]);
  const name = (x: Panel) => `${COUNTRY_NAMES[x.c]} · ${M[x.code].label}`;
  async function composite() { // stitch every ECharts canvas into one image (no DOM screenshot needed)
    const W = 1600, cols = panels.length > 1 ? 2 : 1, cw = W / cols, ch = 420, head = 110, rows = Math.ceil(panels.length / cols);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = head + rows * ch + 50; const g = cv.getContext('2d')!;
    g.fillStyle = '#0A0A0A'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#FFB224'; g.font = '600 20px Fira Sans, sans-serif'; g.fillText('GOVPULSE', 32, 44);
    g.fillStyle = '#F2F2F2'; g.font = '300 36px Fira Sans, sans-serif'; g.fillText(title, 32, 88);
    for (let i = 0; i < panels.length; i++) { const x = (i % cols) * cw, y = head + Math.floor(i / cols) * ch; const inst = charts.current[i];
      g.strokeStyle = '#3A3A3A'; g.strokeRect(x + 16, y + 8, cw - 32, ch - 16); g.fillStyle = '#E6E6E6'; g.font = '600 18px Fira Sans, sans-serif'; g.fillText(`${name(panels[i])} (${M[panels[i].code].unit})`, x + 32, y + 38);
      if (inst) { const img = new Image(); img.src = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0A0A0A' }); await img.decode(); g.drawImage(img, x + 28, y + 52, cw - 56, ch - 76); } }
    g.fillStyle = '#A3A3A3'; g.font = '14px Fira Sans, sans-serif'; g.fillText(`Source: World Bank WDI (CC BY 4.0) via GovPulse · ${r[0]}–${r[1]} · ${location.origin}/dashboards/`, 32, cv.height - 20);
    return cv; }
  async function xlsx() { const X = await import('xlsx'); const wb = X.utils.book_new(); const used = new Set<string>();
    panels.forEach((x, i) => { const rows = [['Year', `${name(x)} (${M[x.code].unit})`], ...pts(x).map(q => [q[0], q[1]])]; const ws = X.utils.aoa_to_sheet(rows);
      let sn = `${i + 1} ${COUNTRY_NAMES[x.c]} ${M[x.code].label}`.replace(/[\\/?*[\]:]/g, '').slice(0, 31); while (used.has(sn)) sn = sn.slice(0, 29) + i; used.add(sn); X.utils.book_append_sheet(wb, ws, sn); });
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Sheet', 'Country', 'Indicator', 'Code', 'Unit', 'Source', 'URL', 'Licence'], ...panels.map((x, i) => [i + 1, COUNTRY_NAMES[x.c], M[x.code].label, x.code, M[x.code].unit, 'World Bank World Development Indicators', p.srcUrl[x.code] ?? `https://data.worldbank.org/indicator/${x.code}`, 'CC BY 4.0']), [], ['Dashboard', location.origin + '/dashboards/?' + query()], ['Generated', new Date().toISOString()]]), 'Sources');
    X.writeFile(wb, slug(title) + '.xlsx'); }
  async function run(kind: 'png' | 'pdf', excel: boolean) { setModal(null); flash('Preparing…'); const cv = await composite(); const url = cv.toDataURL('image/png');
    if (kind === 'png') { const a = document.createElement('a'); a.href = url; a.download = slug(title) + '.png'; document.body.appendChild(a); a.click(); a.remove(); }
    else { const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ orientation: cv.width > cv.height ? 'landscape' : 'portrait', unit: 'px', format: [cv.width, cv.height], hotfixes: ['px_scaling'] }); pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, cv.width, cv.height); pdf.save(slug(title) + '.pdf'); }
    if (excel) await xlsx(); flash(excel ? `${kind.toUpperCase()} + Excel saved` : `${kind.toUpperCase()} saved`); }
  const opts = p.meta.filter(x => ind === 'overview' || x.industry === ind);
  return <section id="builder" aria-labelledby="b-h" className="flex flex-col gap-5 scroll-mt-20">
    <div className="edge rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3"><h2 id="b-h" className="text-lg font-semibold flex items-center gap-2"><LayoutGrid size={18} className="text-accent" aria-hidden />Dashboard builder</h2>
        <label className="sr-only" htmlFor="b-title">Dashboard title</label><input id="b-title" className={field + ' min-w-[14rem] flex-1'} value={title} maxLength={80} onChange={e => setTitle(e.target.value)} />
        <span className="inline-flex items-center gap-1 text-xs text-muted">Years<select aria-label="From year" className={field} value={r[0]} onChange={e => setR([+e.target.value, Math.max(+e.target.value, r[1])])}>{yrs.map(y => <option key={y}>{y}</option>)}</select>–<select aria-label="To year" className={field} value={r[1]} onChange={e => setR([Math.min(r[0], +e.target.value), +e.target.value])}>{yrs.map(y => <option key={y}>{y}</option>)}</select></span></div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); add(); }} aria-label="Add a panel">
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Country<select data-b-country className={field} value={c} onChange={e => setC(e.target.value)}>{Object.entries(COUNTRY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Industry<select className={field} value={ind} onChange={e => setInd(e.target.value)}><option value="overview">All industries</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted">Metric<select data-b-metric className={field + ' max-w-[16rem]'} value={code} onChange={e => setCode(e.target.value)}>{opts.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select></label>
        <button type="submit" data-b-add className="inline-flex items-center gap-1 rounded-md bg-cta text-black font-semibold px-3 py-2 text-xs"><Plus size={14} aria-hidden />Add panel</button>
        <button type="button" className={btn} onClick={() => setPanels(preset(c, ind))}>Load {COUNTRY_NAMES[c]} · {ind === 'overview' ? 'overview' : p.industries.find(i => i.id === ind)?.name} preset</button>
        <button type="button" className={btn} onClick={() => setPanels([])}><Trash2 size={13} aria-hidden />Clear</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <button type="button" data-dl="png" disabled={!panels.length} className="inline-flex items-center gap-1.5 rounded-full bg-cta text-black font-semibold px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => setModal('png')}><Download size={13} aria-hidden />Download PNG</button>
        <button type="button" data-dl="pdf" disabled={!panels.length} className="inline-flex items-center gap-1.5 rounded-full border border-accent text-accent font-semibold px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => setModal('pdf')}><Download size={13} aria-hidden />Download PDF</button>
        <button type="button" className={btn} onClick={async () => { const l = location.origin + '/dashboards/?' + query(); try { await navigator.clipboard.writeText(l); flash('Link copied'); } catch { prompt('Copy this link', l); } }}><Link2 size={13} aria-hidden />Copy share link</button>
        <span className="text-[11px] text-muted">{panels.length}/{MAXP} panels · saved in this browser and in the link</span><span role="status" className="text-xs text-accent">{msg}</span></div>
    </div>
    {!panels.length && <p className="text-sm text-muted">No panels yet. Pick a country and metric above, or load a preset.</p>}
    <div className="grid gap-4 md:grid-cols-2">{panels.map((x, i) => { const s = pts(x); const m = M[x.code]; return <article key={x.c + x.code} className="edge rounded-2xl p-4 flex flex-col gap-2 min-w-0" data-panel>
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-sm font-semibold">{name(x)} <span className="text-muted font-normal text-xs">({m.unit})</span></h3><p className="text-xs text-muted">Latest <span className="font-mono text-text">{s.at(-1)?.[1]?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—'}</span> ({s.at(-1)?.[0] ?? '—'})</p></div>
        <div className="flex gap-1"><button type="button" className="rounded-md border border-white/15 p-1 hover:border-accent disabled:opacity-30" disabled={!i} onClick={() => move(i, -1)} aria-label={`Move ${name(x)} up`}><ArrowUp size={13} aria-hidden /></button><button type="button" className="rounded-md border border-white/15 p-1 hover:border-accent disabled:opacity-30" disabled={i === panels.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${name(x)} down`}><ArrowDown size={13} aria-hidden /></button><button type="button" className="rounded-md border border-white/15 p-1 hover:border-signal hover:text-signal" onClick={() => setPanels(panels.filter((_, j) => j !== i))} aria-label={`Remove ${name(x)}`}><X size={13} aria-hidden /></button></div></div>
      {data[x.c] ? s.length ? <Canvas key={x.c + x.code + r.join() + i} p={{ series: [{ name: name(x), data: s, unit: m.unit }], colors: [PALETTE[i % 2]], title: m.label, area: true }} full={false} h={240} onReady={(ch: any) => (charts.current[i] = ch)} /> : <p className="text-sm text-muted py-10 text-center">No data in this range.</p> : <p className="text-sm text-muted py-10 text-center">Loading…</p>}
      <p className="text-[11px] text-muted">World Bank WDI {x.code} · CC BY 4.0 · <a className="underline hover:text-accent" href={`/${x.c}/?metric=${x.code}&view=${x.code}`}>Open full screen</a></p>
    </article>; })}</div>
    {modal && <div role="dialog" aria-modal="true" aria-labelledby="dl-h" className="fixed inset-0 z-[90] bg-black/80 backdrop-blur flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && setModal(null)} data-dl-modal>
      <div className="edge rounded-2xl p-6 max-w-md w-full bg-[#141414] flex flex-col gap-4"><h2 id="dl-h" className="text-lg font-semibold">Include relevant Excel data?</h2>
        <p className="text-sm text-muted">Your {modal.toUpperCase()} of “{title}” will download now. Yes also saves an .xlsx with one sheet per chart (year-by-year values for {r[0]}–{r[1]}) and a Sources sheet.</p>
        <div className="flex flex-wrap gap-2 justify-end"><button type="button" className={btn} onClick={() => setModal(null)}>Cancel</button><button type="button" data-dl-no autoFocus className={btn} onClick={() => run(modal, false)}>No, {modal.toUpperCase()} only</button><button type="button" data-dl-yes className="rounded-md bg-cta text-black font-semibold px-3 py-1.5 text-xs" onClick={() => run(modal, true)}>Yes, include Excel</button></div></div></div>}
  </section>;
}
