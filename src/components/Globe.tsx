import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';
type M = { lat: number; lng: number };
export default function Globe({ markers }: { markers: M[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let phi = 4.4, drag: number | null = null, dv = 0, w = ref.current.offsetWidth;
    const g = createGlobe(ref.current, {
      devicePixelRatio: 2, width: w * 2, height: w * 2, phi, theta: 0.28, dark: 1, diffuse: 1.4, context: { alpha: true, preserveDrawingBuffer: true, antialias: true },
      mapSamples: 18000, mapBrightness: 5, baseColor: [0.09, 0.17, 0.29], markerColor: [0.96, 0.68, 0.22], glowColor: [0.2, 0.38, 0.65],
      markers: markers.map(m => ({ location: [m.lat, m.lng] as [number, number], size: 0.06 })),
      onRender: (s: any) => { if (drag === null && !reduce) phi += 0.0035; s.phi = phi + dv; s.width = w * 2; s.height = w * 2; },
    } as any);
    const raf = 0;
    const el = ref.current;
    const down = (e: PointerEvent) => { drag = e.clientX - dv * 200; el.style.cursor = 'grabbing'; };
    const up = () => { drag = null; el.style.cursor = 'grab'; };
    const move = (e: PointerEvent) => { if (drag !== null) dv = (e.clientX - drag) / 200; };
    const rs = () => { w = el.offsetWidth; };
    el.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointermove', move); addEventListener('resize', rs);
    requestAnimationFrame(() => (el.style.opacity = '1'));
    return () => { cancelAnimationFrame(raf); g.destroy(); removeEventListener('pointerup', up); removeEventListener('pointermove', move); removeEventListener('resize', rs); };
  }, []);
  return <canvas ref={ref} aria-label="Interactive globe showing the 10 tracked countries; drag to rotate" role="img"
    style={{ width: '100%', aspectRatio: '1', opacity: 0, transition: 'opacity 1.2s', cursor: 'grab', contain: 'layout paint size' }} />;
}
