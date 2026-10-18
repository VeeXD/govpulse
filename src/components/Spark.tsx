import { useState } from 'react';
import { ChartModal } from './Chart';
export default function Spark({ series, label, unit, source, path }: { series: [number, number][]; label: string; unit: string; source: string; path: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="block w-full rounded-md cursor-zoom-in hover:bg-white/5 -mx-1 px-1" aria-label={`Open full chart for ${label}`}>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true"><path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>
    </button>
    <ChartModal p={{ series: [{ name: `${label} (${unit})`, data: series, unit }], colors: ['#FFB224'], title: `${label} (${unit})`, source }} open={open} onClose={() => setOpen(false)} />
  </>;
}
