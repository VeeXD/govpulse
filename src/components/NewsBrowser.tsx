import { useEffect, useMemo, useState } from 'react';
type Item = { id: string; title: string; source: string; time: string; url: string; category: string; via: string; country?: string };
type Props = { countries: Record<string, string>; cats: Record<string, string>; initial: Item[]; generated: string };
const ago = (iso: string, now: number) => { const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000)); if (m < 60) return `${m || 1} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`; const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`; };
export default function NewsBrowser({ countries, cats, initial, generated }: Props) {
  const [all, setAll] = useState<Item[]>(initial); const [c, setC] = useState('all'); const [cat, setCat] = useState('all'); const [q, setQ] = useState(''); const [now, setNow] = useState(Date.parse(generated)); const [limit, setLimit] = useState(60);
  useEffect(() => {
    const p = new URLSearchParams(location.search); if (p.get('c') && countries[p.get('c')!]) setC(p.get('c')!); if (p.get('cat') && cats[p.get('cat')!]) setCat(p.get('cat')!); setNow(Date.now());
    fetch('/api/v1/news.json').then(r => r.json()).then(d => setAll(Object.entries(d.countries as Record<string, Item[]>).flatMap(([k, v]) => v.map(x => ({ ...x, country: k }))).sort((a, b) => b.time.localeCompare(a.time)))).catch(() => {});
  }, []);
  useEffect(() => { const u = new URL(location.href); c === 'all' ? u.searchParams.delete('c') : u.searchParams.set('c', c); cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat); history.replaceState(null, '', u); }, [c, cat]);
  const list = useMemo(() => { const s = q.trim().toLowerCase(); const seen = new Set<string>(); return all.filter(x => (c === 'all' || x.country === c) && (cat === 'all' || x.category === cat) && (!s || (x.title + ' ' + x.source).toLowerCase().includes(s)) && !seen.has(x.id) && (seen.add(x.id), true)); }, [all, c, cat, q]);
  const btn = (on: boolean) => `px-3 py-1.5 rounded-full text-sm border transition ${on ? 'bg-[#FFB224] text-black border-[#FFB224] font-semibold' : 'border-white/15 text-muted hover:text-strong'}`;
  return <div>
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category">{[['all', 'All'], ...Object.entries(cats)].map(([k, l]) => <button key={k} type="button" aria-pressed={cat === k} className={btn(cat === k)} onClick={() => setCat(k)}>{l}</button>)}</div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="news-country">Country</label>
        <select id="news-country" value={c} onChange={e => setC(e.target.value)} className="rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-sm">{[['all', 'All countries'], ...Object.entries(countries)].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="sr-only" htmlFor="news-q">Search headlines</label>
        <input id="news-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search headlines, e.g. Reliance, RBI" className="rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-sm w-full md:w-72"/>
      </div>
    </div>
    <p className="mt-4 text-xs text-muted" aria-live="polite">{list.length} headlines</p>
    <ul className="mt-2 grid gap-3 md:grid-cols-2">{list.slice(0, limit).map(x => <li key={x.id + (x.country || '')} className="edge rounded-2xl p-4 flex flex-col gap-1.5">
      <p className="text-[11px] uppercase tracking-wider"><span className="text-[#FFB224]">{cats[x.category] || x.category}</span> <span className="text-muted">· {x.country ? countries[x.country] + ' · ' : ''}{x.source} · <time dateTime={x.time}>{ago(x.time, now)}</time></span></p>
      <a href={x.url} target="_blank" rel="noopener nofollow" className="text-strong leading-snug hover:text-[#FF6A45]">{x.title} <span aria-hidden="true">↗</span></a>
    </li>)}</ul>
    {list.length > limit && <button type="button" onClick={() => setLimit(limit + 60)} className="mt-6 rounded-full border border-[#FF6A45]/70 px-5 py-2 text-sm hover:bg-white/5">Show more</button>}
    {list.length === 0 && <p className="mt-6 text-muted">No headlines match. Try another country, category or search.</p>}
  </div>;
}
