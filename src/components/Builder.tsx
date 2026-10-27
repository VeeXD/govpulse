import { useEffect, useRef, useState } from 'react';
import { Plus, X, GitCompare, ArrowUp, ArrowDown, Download, Link2, Trash2, LayoutGrid, Copy } from 'lucide-react';
import { COUNTRY_NAMES, PALETTE, loadCountry, isCode, isCountry, type Pt } from '../lib/compose';
import { Canvas } from './Chart';
type Meta = { code: string; label: string; unit: string; industry: string };
type Kind = 'line' | 'bar' | 'area';
type Ov = { c: string; code: string }; // c '' = same country as the panel
type Panel = { id: number; c: string; code: string; kind: Kind; from?: number; to?: number; o?: Ov[]; norm?: boolean }; // c '' = follow the dashboard's default country
type Props = { meta: Meta[]; industries: { id: string; name: string }[]; years: [number, number]; srcUrl: Record<string, string> };
const LS = 'govpulse.dash.v2', MAXP = 12, MAXO = 4, OCOL = ['#FFB224', '#FF6A45', '#E6E6E6', '#A3A3A3', '#6E6E6E'], ODASH = ['solid', 'solid', 'dashed', 'dotted', 'dashed'], KINDS: Kind[] = ['area', 'line', 'bar'];
let uid = 1;
const enc = (p: Panel[]) => p.map(x => [x.c, x.code, x.kind === 'area' ? '' : x.kind, x.from ?? '', x.to ?? '', (x.o ?? []).map(o => o.c + '*' + o.code).join('!'), x.norm ? 'n' : ''].join('~').replace(/~+$/, '')).join(',');
const dec = (s: string | null): Panel[] => (s ?? '').split(',').filter(Boolean).map(x => x.split('~')).filter(x => x.length >= 2 && (!x[0] || isCountry(x[0])) && isCode(x[1])).map(([c, code, k, f, t, o, n]) => ({ id: uid++, c, code, kind: (KINDS.includes(k as Kind) ? k : 'area') as Kind, from: +f || undefined, to: +t || undefined, o: (o ?? '').split('!').filter(Boolean).map(z => z.split('*')).filter(z => z.length === 2 && (!z[0] || isCountry(z[0])) && isCode(z[1])).map(([c, code]) => ({ c, code })).slice(0, MAXO), norm: n === 'n' })).slice(0, MAXP);
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dashboard';
const field = 'bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-text focus-visible:border-accent';
const mini = 'bg-black/50 border border-white/15 rounded-md px-1.5 py-1 text-xs text-text focus-visible:border-accent max-w-full';
const btn = 'inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs hover:border-accent hover:text-accent';
const ib = 'rounded-md border border-white/15 p-1 hover:border-accent disabled:opacity-30';
export default function Builder(p: Props) {
  const M = Object.fromEntries(p.meta.map(m => [m.code, m])) as Record<string, Meta>;
  const yrs = Array.from({ length: p.years[1] - p.years[0] + 1 }, (_, i) => p.years[0] + i);
  const [panels, setPanels] = useState<Panel[]>([]); const [title, setTitle] = useState('My dashboard');
  const [r, setR] = useState<[number, number]>([Math.max(p.years[0], p.years[1] - 20), p.years[1]]);
  const [data, setData] = useState<Record<string, Record<string, Pt[]>>>({}); const [err, setErr] = useState('');
  const [dc, setDc] = useState('india'); const [ind, setInd] = useState('overview'); const [code, setCode] = useState(p.meta[0].code);
  const [modal, setModal] = useState<null | 'png' | 'pdf'>(null); const [msg, setMsg] = useState(''); const [ready, setReady] = useState(false);
  const charts = useRef<Record<number, any>>({}); const autoTitle = useRef(true);
  const indName = (i: string) => i === 'overview' ? 'Overview' : p.industries.find(x => x.id === i)?.name ?? i;
  const preset = (i: string, m?: string | null): Panel[] => { const list = p.meta.filter(x => x.industry === i).map(x => x.code); const first = m && M[m] ? [m] : []; return [...first, ...list.filter(x => x !== m)].slice(0, 6).map(code => ({ id: uid++, c: '', code, kind: 'area' as Kind })); };
  useEffect(() => { const q = new URLSearchParams(location.search); let ps = dec(q.get('p')); let c0 = q.get('dc') || '', i0 = q.get('industry') || '';
    const qc = q.get('c'), qm = q.get('metric');
    if (isCountry(qc)) c0 = qc!;
    if (!ps.length && qc) { i0 = i0 && (i0 === 'overview' || p.industries.some(x => x.id === i0)) ? i0 : (qm && M[qm]?.industry) || 'overview'; ps = preset(i0, qm); }
    if (q.get('t')) { setTitle(q.get('t')!.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80)); autoTitle.current = false; }
    if (!ps.length) { try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s?.panels) { ps = dec(s.panels); c0 ||= s.dc; i0 ||= s.ind; if (s.title) { setTitle(s.title); autoTitle.current = !!s.auto; } if (s.r) setR(s.r); } } catch {} }
    c0 = isCountry(c0) ? c0 : 'india'; i0 = i0 || 'overview'; if (!ps.length) ps = preset(i0);
    const f = +(q.get('from') ?? 0), t = +(q.get('to') ?? 0); if (f && t && f <= t) setR([Math.max(f, p.years[0]), Math.min(t, p.years[1])]);
    setDc(c0); setInd(i0); setPanels(ps.filter(x => M[x.code]).map(x => ({ ...x, o: x.o?.filter(o => M[o.code]) }))); setReady(true); }, []);
  const cOf = (x: Panel) => x.c || dc;
  useEffect(() => { for (const cc of new Set(panels.flatMap(x => [cOf(x), ...(x.o ?? []).map(o => o.c || cOf(x))]))) if (!data[cc]) loadCountry(cc).then(d => setData(o => ({ ...o, [cc]: d }))).catch(() => setErr(`Could not load data for ${COUNTRY_NAMES[cc]}. Check your connection and reload.`)); }, [panels, dc]);
  useEffect(() => { if (autoTitle.current && ready) setTitle(`${COUNTRY_NAMES[dc]} · ${indName(ind)} dashboard`); }, [dc, ind, ready]);
  const query = () => { const q = new URLSearchParams({ p: enc(panels), dc, industry: ind, t: title, from: String(r[0]), to: String(r[1]) }); return q.toString().replace(/%7E/g, '~').replace(/%2C/g, ',').replace(/%21/g, '!').replace(/%2A/g, '*'); };
  useEffect(() => { if (!ready) return; history.replaceState(null, '', location.pathname + '?' + query() + location.hash); try { localStorage.setItem(LS, JSON.stringify({ panels: enc(panels), dc, ind, title, auto: autoTitle.current, r })); } catch {} }, [panels, title, r, dc, ind, ready]);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };
  const upd = (i: number, o: Partial<Panel>) => setPanels(ps => ps.map((x, j) => j === i ? { ...x, ...o } : x));
  const pick = (i: string) => { setInd(i); setPanels(preset(i)); }; // choosing an industry rebuilds the dashboard instantly
  const add = (cc = '', cd = code) => { if (panels.length >= MAXP) return flash(`Max ${MAXP} panels`); setPanels([...panels, { id: uid++, c: cc === dc ? '' : cc, code: cd, kind: 'area' }]); setTimeout(() => document.querySelector('[data-panel]:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= panels.length) return; const n = [...panels]; [n[i], n[j]] = [n[j], n[i]]; setPanels(n); };
  const rOf = (x: Panel): [number, number] => [x.from ?? r[0], x.to ?? r[1]];
  const pts = (x: Panel) => { const [a, b] = rOf(x); return (data[cOf(x)]?.[x.code] ?? []).filter(q => q[0] >= a && q[0] <= b); };
  const name = (x: Panel) => `${COUNTRY_NAMES[cOf(x)]} · ${M[x.code].label}`;
  const [cmp, setCmp] = useState<Record<number, Ov>>({}); // open '+ Compare' forms per panel id
  // All series in a panel: main + overlays, each with points in range, unit, and source info
  const ser = (x: Panel) => { const [a, b] = rOf(x); const list = [{ c: cOf(x), code: x.code }, ...(x.o ?? []).map(o => ({ c: o.c || cOf(x), code: o.code }))];
    return list.map((z, k) => ({ ...z, k, unit: M[z.code].unit, name: `${COUNTRY_NAMES[z.c]} · ${M[z.code].label}`, pts: (data[z.c]?.[z.code] ?? []).filter(q => q[0] >= a && q[0] <= b) })); };
  const units = (x: Panel) => [...new Set(ser(x).map(z => z.unit))];
  const idx = (q: Pt[]) => { const base = q.find(v => v[1]); return base ? q.map(v => [v[0], +(v[1] / base[1] * 100).toFixed(3)] as Pt) : q; };
  const view = (x: Panel) => { const ss = ser(x), us = units(x), norm = !!x.norm && ss.length > 1;
    return { norm, ss, series: ss.map(z => ({ name: z.name + (norm ? '' : us.length > 1 ? ` (${z.unit})` : ''), unit: norm ? 'Index' : z.unit, data: norm ? idx(z.pts) : z.pts })), dual: !norm && us.length > 1, yName: norm ? 'Index (first year = 100)' : undefined, extra: !norm && us.length > 2 }; };
  async function composite() { // stitch every ECharts canvas into one image (no DOM screenshot needed)
    const W = 1600, cols = panels.length > 1 ? 2 : 1, cw = W / cols, ch = 420, head = 110, rows = Math.ceil(panels.length / cols);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = head + rows * ch + 50; const g = cv.getContext('2d')!;
    g.fillStyle = '#0A0A0A'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#FFB224'; g.font = '600 20px Fira Sans, sans-serif'; g.fillText('GOVPULSE', 32, 44);
    g.fillStyle = '#F2F2F2'; g.font = '300 36px Fira Sans, sans-serif'; g.fillText(title, 32, 88);
    for (let i = 0; i < panels.length; i++) { const x = (i % cols) * cw, y = head + Math.floor(i / cols) * ch; const inst = charts.current[panels[i].id];
      g.strokeStyle = '#3A3A3A'; g.strokeRect(x + 16, y + 8, cw - 32, ch - 16); g.fillStyle = '#E6E6E6'; g.font = '600 18px Fira Sans, sans-serif'; g.fillText(`${name(panels[i])}${panels[i].o?.length ? ` + ${panels[i].o!.length} compared` : ''} (${panels[i].norm && panels[i].o?.length ? 'index' : M[panels[i].code].unit})`.slice(0, 90), x + 32, y + 38);
      if (inst) { const img = new Image(); img.src = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0A0A0A' }); await img.decode(); g.drawImage(img, x + 28, y + 52, cw - 56, ch - 76); } }
    g.fillStyle = '#A3A3A3'; g.font = '14px Fira Sans, sans-serif'; g.fillText(`Source: World Bank WDI (CC BY 4.0) via GovPulse · ${location.origin}/dashboards/`, 32, cv.height - 20);
    return cv; }
  async function xlsx() { const X = await import('xlsx'); const wb = X.utils.book_new(); const used = new Set<string>();
    panels.forEach((x, i) => { const ss = ser(x); const ys = [...new Set(ss.flatMap(z => z.pts.map(q => q[0])))].sort((a, b) => a - b);
      const rows = [['Year', ...ss.map(z => `${z.name} (${z.unit})`)], ...ys.map(y => [y, ...ss.map(z => z.pts.find(q => q[0] === y)?.[1] ?? null)])]; const ws = X.utils.aoa_to_sheet(rows);
      let sn = `${i + 1} ${COUNTRY_NAMES[cOf(x)]} ${M[x.code].label}`.replace(/[\\/?*[\]:]/g, '').slice(0, 31); while (used.has(sn)) sn = sn.slice(0, 29) + i; used.add(sn); X.utils.book_append_sheet(wb, ws, sn); });
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Sheet', 'Country', 'Indicator', 'Code', 'Unit', 'Source', 'URL', 'Licence'], ...panels.flatMap((x, i) => ser(x).map(z => [z.k ? `${i + 1} (overlay ${z.k})` : i + 1, COUNTRY_NAMES[z.c], M[z.code].label, z.code, z.unit, 'World Bank World Development Indicators', p.srcUrl[z.code] ?? `https://data.worldbank.org/indicator/${z.code}`, 'CC BY 4.0'])), [], ['Dashboard', location.origin + '/dashboards/?' + query()], ['Generated', new Date().toISOString()]]), 'Sources');
    X.writeFile(wb, slug(title) + '.xlsx'); }
  async function run(kind: 'png' | 'pdf', excel: boolean) { setModal(null); flash('Preparing…'); const cv = await composite(); const url = cv.toDataURL('image/png');
    if (kind === 'png') { const a = document.createElement('a'); a.href = url; a.download = slug(title) + '.png'; document.body.appendChild(a); a.click(); a.remove(); }
    else { const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ orientation: cv.width > cv.height ? 'landscape' : 'portrait', unit: 'px', format: [cv.width, cv.height], hotfixes: ['px_scaling'] }); pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, cv.width, cv.height); pdf.save(slug(title) + '.pdf'); }
    if (excel) await xlsx(); flash(excel ? `${kind.toUpperCase()} + Excel saved` : `${kind.toUpperCase()} saved`); }
  const opts = p.meta.filter(x => ind === 'overview' || x.industry === ind);
  const byInd = p.industries.map(i => [i.name, p.meta.filter(m => m.industry === i.id)] as const).concat([['Overview', p.meta.filter(m => m.industry === 'overview')]]);
  const MetricOpts = () => <>{byInd.map(([g, ms]) => ms.length ? <optgroup key={g} label={g}>{ms.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</optgroup> : null)}</>;
  const lab = 'flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted';
  return <section id="builder" aria-labelledby="b-h" className="flex flex-col gap-4 scroll-mt-20">
    <div className="edge rounded-2xl p-4 flex flex-col gap-3">
      <h2 id="b-h" className="text-lg font-semibold flex items-center gap-2"><LayoutGrid size={18} className="text-accent" aria-hidden />Dashboard builder <span className="text-xs font-normal text-muted">Pick a country and industry: the dashboard below updates instantly. Edit any chart in place, and use + Compare to overlay another country or metric.</span></h2>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); add(); }} aria-label="Dashboard settings">
        <label className={lab}>Country (all charts)<select data-b-country className={field} value={dc} onChange={e => setDc(e.target.value)}>{Object.entries(COUNTRY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className={lab}>Industry preset<select data-b-ind className={field} value={ind} onChange={e => pick(e.target.value)}><option value="overview">Overview</option>{p.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <span className={lab}>Years (all charts)<span className="inline-flex items-center gap-1"><select data-b-from aria-label="From year" className={field} value={r[0]} onChange={e => { setR([+e.target.value, Math.max(+e.target.value, r[1])]); setPanels(ps => ps.map(x => ({ ...x, from: undefined, to: undefined }))); }}>{yrs.map(y => <option key={y}>{y}</option>)}</select>–<select aria-label="To year" className={field} value={r[1]} onChange={e => { setR([Math.min(r[0], +e.target.value), +e.target.value]); setPanels(ps => ps.map(x => ({ ...x, from: undefined, to: undefined }))); }}>{yrs.map(y => <option key={y}>{y}</option>)}</select></span></span>
        <label className={lab + ' flex-1 min-w-[12rem]'}>Title<input id="b-title" className={field} value={title} maxLength={80} onChange={e => { autoTitle.current = false; setTitle(e.target.value); }} /></label>
      </form>
      <form className="flex flex-wrap items-end gap-3 border-t border-white/10 pt-3" onSubmit={e => { e.preventDefault(); add(); }} aria-label="Add a chart">
        <label className={lab}>Add chart: metric<select data-b-metric className={field + ' max-w-[16rem]'} value={code} onChange={e => setCode(e.target.value)}><MetricOpts /></select></label>
        <button type="submit" data-b-add className="inline-flex items-center gap-1 rounded-md bg-cta text-black font-semibold px-3 py-2 text-xs"><Plus size={14} aria-hidden />Add chart</button>
        <button type="button" className={btn} onClick={() => pick(ind)}>Reset to preset</button>
        <button type="button" className={btn} onClick={() => setPanels([])}><Trash2 size={13} aria-hidden />Clear</button>
      </form>
    </div>
    <div className="sticky top-16 z-20 -mx-1 px-3 py-2 rounded-xl bg-black/80 backdrop-blur border border-white/10 flex flex-wrap items-center gap-2" data-dl-bar>
      <span className="text-sm font-semibold text-strong mr-1 truncate max-w-[18rem]">{title}</span>
      <button type="button" data-dl="png" disabled={!panels.length} className="inline-flex items-center gap-1.5 rounded-full bg-cta text-black font-semibold px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => setModal('png')}><Download size={13} aria-hidden />Download PNG</button>
      <button type="button" data-dl="pdf" disabled={!panels.length} className="inline-flex items-center gap-1.5 rounded-full border border-accent text-accent font-semibold px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => setModal('pdf')}><Download size={13} aria-hidden />Download PDF</button>
      <button type="button" className={btn} onClick={async () => { const l = location.origin + '/dashboards/?' + query(); try { await navigator.clipboard.writeText(l); flash('Link copied'); } catch { prompt('Copy this link', l); } }}><Link2 size={13} aria-hidden />Share link</button>
      <span className="text-[11px] text-muted">{panels.length}/{MAXP} charts · auto-saved</span><span role="status" className="text-xs text-accent">{msg}</span></div>
    {err && <p role="alert" className="text-sm text-signal">{err}</p>}
    {!panels.length && <p className="text-sm text-muted">No charts yet. Pick an industry preset or add a chart above.</p>}
    <div className="grid gap-4 md:grid-cols-2" aria-live="polite" data-grid>{panels.map((x, i) => { const s = pts(x); const m = M[x.code]; const [a, b] = rOf(x); const v = view(x); const os = x.o ?? []; const f = cmp[x.id]; return <article key={x.id} className="edge rounded-2xl p-4 flex flex-col gap-2 min-w-0" data-panel>
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-sm font-semibold">{name(x)} <span className="text-muted font-normal text-xs">({m.unit})</span></h3><p className="text-xs text-muted">Latest <span className="font-mono text-text">{s.at(-1)?.[1]?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—'}</span> ({s.at(-1)?.[0] ?? '—'})</p></div>
        <div className="flex gap-1 shrink-0"><button type="button" className={ib} disabled={!i} onClick={() => move(i, -1)} aria-label={`Move ${name(x)} earlier`}><ArrowUp size={13} aria-hidden /></button><button type="button" className={ib} disabled={i === panels.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${name(x)} later`}><ArrowDown size={13} aria-hidden /></button><button type="button" data-p-dup className={ib} disabled={panels.length >= MAXP} onClick={() => { const n = [...panels]; n.splice(i + 1, 0, { ...x, id: uid++ }); setPanels(n); }} aria-label={`Duplicate ${name(x)}`}><Copy size={13} aria-hidden /></button><button type="button" className="rounded-md border border-white/15 p-1 hover:border-signal hover:text-signal" onClick={() => setPanels(panels.filter((_, j) => j !== i))} aria-label={`Remove ${name(x)}`}><X size={13} aria-hidden /></button></div></div>
      <div className="flex flex-wrap items-center gap-1.5" data-p-controls>
        <select data-p-country aria-label="Chart country" className={mini} value={x.c} onChange={e => upd(i, { c: e.target.value })}><option value="">{COUNTRY_NAMES[dc]} (default)</option>{Object.entries(COUNTRY_NAMES).filter(([k]) => k !== dc).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select data-p-metric aria-label="Chart metric" className={mini + ' max-w-[11rem]'} value={x.code} onChange={e => upd(i, { code: e.target.value })}><MetricOpts /></select>
        <select data-p-kind aria-label="Chart type" className={mini} value={x.kind} onChange={e => upd(i, { kind: e.target.value as Kind })}>{KINDS.map(k => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}</select>
        <select data-p-from aria-label="Chart from year" className={mini} value={a} onChange={e => upd(i, { from: +e.target.value, to: Math.max(+e.target.value, b) })}>{yrs.map(y => <option key={y}>{y}</option>)}</select><span className="text-xs text-muted">–</span>
        <select aria-label="Chart to year" className={mini} value={b} onChange={e => upd(i, { to: +e.target.value, from: Math.min(a, +e.target.value) })}>{yrs.map(y => <option key={y}>{y}</option>)}</select>
        <button type="button" data-p-compare className={btn + ' !py-1'} disabled={os.length >= MAXO} aria-expanded={!!f} onClick={() => setCmp(o => { const n = { ...o }; if (n[x.id]) delete n[x.id]; else n[x.id] = { c: '', code: x.code }; return n; })}><GitCompare size={12} aria-hidden />+ Compare{os.length ? ` (${os.length}/${MAXO})` : ''}</button>
      </div>
      {f && <form className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.03] p-2" data-p-cmpform aria-label={`Compare with ${name(x)}`} onSubmit={e => { e.preventDefault(); if (os.length >= MAXO) return; upd(i, { o: [...os, { c: f.c === cOf(x) ? '' : f.c, code: f.code }] }); setCmp(o => { const n = { ...o }; delete n[x.id]; return n; }); }}>
        <span className="text-[11px] uppercase tracking-wider text-muted">Overlay</span>
        <select data-o-country aria-label="Overlay country" className={mini} value={f.c} onChange={e => setCmp(o => ({ ...o, [x.id]: { ...f, c: e.target.value } }))}><option value="">{COUNTRY_NAMES[cOf(x)]} (same)</option>{Object.entries(COUNTRY_NAMES).filter(([k]) => k !== cOf(x)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select data-o-metric aria-label="Overlay metric" className={mini + ' max-w-[11rem]'} value={f.code} onChange={e => setCmp(o => ({ ...o, [x.id]: { ...f, code: e.target.value } }))}><MetricOpts /></select>
        <button type="submit" data-o-add disabled={!f.c && f.code === x.code} className="inline-flex items-center gap-1 rounded-md bg-cta text-black font-semibold px-2.5 py-1 text-xs disabled:opacity-40"><Plus size={12} aria-hidden />Add overlay</button>
        <span className="text-[11px] text-muted">Pick another country, metric, or both.</span>
      </form>}
      {os.length > 0 && <ul className="flex flex-wrap gap-1.5" data-p-overlays aria-label="Compared series">
        {v.ss.map(z => <li key={z.k} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 pl-2 pr-1 py-0.5 text-[11px]"><span aria-hidden className="inline-block w-3 h-0.5" style={{ background: OCOL[z.k], borderTop: ODASH[z.k] !== 'solid' ? `2px ${ODASH[z.k]} ${OCOL[z.k]}` : undefined, height: ODASH[z.k] !== 'solid' ? 0 : 2 }} />{z.name}{z.k ? <button type="button" data-o-remove className="rounded-full p-0.5 hover:text-signal" aria-label={`Remove overlay ${z.name}`} onClick={() => upd(i, { o: os.filter((_, j) => j !== z.k - 1) })}><X size={11} aria-hidden /></button> : <span className="text-muted pr-1">(main)</span>}</li>)}
        {units(x).length > 1 && <li><label className="inline-flex items-center gap-1 text-[11px] text-muted cursor-pointer"><input type="checkbox" data-o-norm checked={!!x.norm} onChange={e => upd(i, { norm: e.target.checked })} className="accent-[#FFB224]" />Index to 100 at first year</label></li>}
      </ul>}
      {v.extra && <p className="text-[11px] text-accent" role="note">3+ units can't share two axes: series beyond the second unit use the left axis. Turn on “Index to 100” for a fair comparison.</p>}
      {data[cOf(x)] ? s.length ? <Canvas key={[x.id, cOf(x), x.code, x.kind, a, b, enc([x]), dc, v.ss.map(z => z.pts.length).join('.')].join()} p={os.length ? { series: v.series, colors: OCOL, dash: ODASH, dual: v.dual, yName: v.yName, title: m.label, area: true, kind: x.kind } : { series: [{ name: name(x), data: s, unit: m.unit }], colors: [PALETTE[i % 2]], title: m.label, area: true, kind: x.kind }} full={false} h={240} onReady={(ch: any) => (charts.current[x.id] = ch)} /> : <p className="text-sm text-muted py-10 text-center">No data for {COUNTRY_NAMES[cOf(x)]} in {a}–{b}.</p> : <p className="text-sm text-muted py-10 text-center">Loading…</p>}
      <p className="text-[11px] text-muted">World Bank WDI {x.code} · CC BY 4.0 · <a className="underline hover:text-accent" href={`/${cOf(x)}/?metric=${x.code}&view=${x.code}`}>Open full screen</a></p>
    </article>; })}</div>
    {modal && <div role="dialog" aria-modal="true" aria-labelledby="dl-h" className="fixed inset-0 z-[90] bg-black/80 backdrop-blur flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && setModal(null)} data-dl-modal>
      <div className="edge rounded-2xl p-6 max-w-md w-full bg-[#141414] flex flex-col gap-4"><h2 id="dl-h" className="text-lg font-semibold">Include relevant Excel data?</h2>
        <p className="text-sm text-muted">Your {modal.toUpperCase()} of “{title}” will download now. Yes also saves an .xlsx with one sheet per chart (year-by-year values for each chart's years) and a Sources sheet.</p>
        <div className="flex flex-wrap gap-2 justify-end"><button type="button" className={btn} onClick={() => setModal(null)}>Cancel</button><button type="button" data-dl-yes className={btn} onClick={() => run(modal, true)}>Yes, include Excel</button><button type="button" data-dl-no autoFocus className="rounded-md bg-cta text-black font-semibold px-3 py-1.5 text-xs hover:bg-white" onClick={() => run(modal, false)}>No, {modal.toUpperCase()} only</button></div></div></div>}
  </section>;
}
