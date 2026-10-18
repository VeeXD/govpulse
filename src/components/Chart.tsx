import { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
type S = { name: string; data: [number, number][]; unit?: string };
type P = { series: S[]; colors: string[]; height?: number; area?: boolean; source?: string; title?: string; theme?: any };
export const CT = { text: '#F2F2F2', muted: '#B8B8B8', line: '#5C5C5C', grid: '#2E2E2E', bg: '#141414' };
let ec: any; const loadEc = async () => {
  if (ec) return ec;
  const [core, charts, comps, r] = await Promise.all([import('echarts/core'), import('echarts/charts'), import('echarts/components'), import('echarts/renderers')]);
  core.use([charts.LineChart, comps.GridComponent, comps.TooltipComponent, comps.LegendComponent, comps.DataZoomComponent, comps.TitleComponent, r.CanvasRenderer]);
  return (ec = core);
};
function option(p: P, full: boolean, reduce: boolean) {
  const unit = p.series[0]?.unit ?? '';
  return {
    animation: !reduce, color: p.colors, backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Fira Sans', color: CT.muted },
    grid: { left: 56, right: 20, top: p.series.length > 1 ? 40 : 24, bottom: full ? 80 : 44, containLabel: false },
    legend: p.series.length > 1 ? { top: 0, textStyle: { color: CT.text }, icon: 'roundRect' } : undefined,
    tooltip: { trigger: 'axis', backgroundColor: CT.bg, borderColor: CT.line, textStyle: { color: CT.text, fontFamily: 'Fira Code' },
      formatter: (ps: any[]) => `<b>${ps[0]?.value?.[0]}</b><br/>` + ps.map(x => `${x.marker} ${x.seriesName}: <b>${Number(x.value[1]).toLocaleString('en-US', { maximumFractionDigits: 2 })}</b>`).join('<br/>') },
    xAxis: { type: 'value', name: 'Year', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: CT.muted }, min: 'dataMin', max: 'dataMax', minInterval: 1,
      axisLabel: { formatter: (v: number) => String(v), color: CT.muted }, axisLine: { show: true, lineStyle: { color: CT.line } }, axisTick: { show: true, lineStyle: { color: CT.line } }, splitLine: { show: true, lineStyle: { color: CT.grid } } },
    yAxis: { type: 'value', scale: true, name: unit, nameTextStyle: { color: CT.muted, align: 'left' }, axisLabel: { color: CT.muted }, axisLine: { show: true, lineStyle: { color: CT.line } }, splitLine: { lineStyle: { color: CT.grid } } },
    dataZoom: full ? [{ type: 'inside' }, { type: 'slider', bottom: 18, height: 22, borderColor: CT.line, textStyle: { color: CT.muted }, fillerColor: 'rgba(255,255,255,.12)', handleStyle: { color: CT.text } }] : undefined,
    series: p.series.map((s, i) => ({ name: s.name, type: 'line', smooth: 0.25, showSymbol: full, symbolSize: 5, data: s.data, lineStyle: { width: 2.25, type: i ? 'dashed' : 'solid' },
      areaStyle: p.area !== false && i === 0 ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,255,255,.18)' }, { offset: 1, color: 'rgba(255,255,255,0)' }] } } : undefined })),
  };
}
function Canvas({ p, full, h }: { p: P; full: boolean; h: number | string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { let c: any, ro: ResizeObserver, dead = false;
    loadEc().then(e => { if (dead || !ref.current) return; c = e.init(ref.current); c.setOption(option(p, full, matchMedia('(prefers-reduced-motion: reduce)').matches)); ro = new ResizeObserver(() => c.resize()); ro.observe(ref.current); });
    return () => { dead = true; ro?.disconnect(); c?.dispose(); }; }, []);
  return <div ref={ref} style={{ height: h, width: '100%' }} />;
}
export function ChartModal({ p, open, onClose }: { p: P; open: boolean; onClose: () => void }) {
  const d = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = d.current; if (!el) return; if (open && !el.open) el.showModal(); if (!open && el.open) el.close(); }, [open]);
  return <dialog ref={d} onClose={onClose} onClick={e => { if (e.target === d.current) onClose(); }} aria-label={p.title} className="chart-modal">
    {open && <div className="flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-strong">{p.title}</h2><p className="text-xs text-muted mt-1">Drag the slider or scroll/pinch on the chart to zoom. Hover or tap for exact values.</p></div>
        <button autoFocus onClick={onClose} className="rounded-lg border border-line p-2 hover:bg-white/10 cursor-pointer" aria-label="Close chart"><X size={18} aria-hidden /></button></div>
      <div className="flex-1 min-h-[300px]"><Canvas p={p} full h="100%" /></div>
      <table className="sr-only"><caption>{p.title}</caption><thead><tr><th>Year</th>{p.series.map(s => <th key={s.name}>{s.name}</th>)}</tr></thead>
        <tbody>{p.series[0].data.map(([y]) => <tr key={y}><td>{y}</td>{p.series.map(s => <td key={s.name}>{s.data.find(x => x[0] === y)?.[1] ?? '—'}</td>)}</tr>)}</tbody></table>
      {p.source && <p className="text-xs text-muted">Source: {p.source}</p>}
    </div>}
  </dialog>;
}
export default function Chart(p: P) {
  const [open, setOpen] = useState(false);
  return <div className="relative group">
    <Canvas p={p} full={false} h={p.height ?? 280} />
    <button onClick={() => setOpen(true)} className="absolute top-0 right-0 inline-flex items-center gap-1.5 rounded-lg border border-line bg-black/60 px-2.5 py-1.5 text-xs text-text hover:bg-white/10 cursor-pointer" aria-label={`Expand chart: ${p.title}`}><Maximize2 size={14} aria-hidden />Expand</button>
    <ChartModal p={p} open={open} onClose={() => setOpen(false)} />
  </div>;
}
