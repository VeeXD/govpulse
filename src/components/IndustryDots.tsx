import { useEffect, useRef } from 'react';
// Interactive dot field (canvas 2D). Each industry has its own formation; dots spring toward it and scatter from the cursor.
// Arriving from another industry page, dots start in the previous formation and morph into the new one.
type Pt = [number, number];
const forms: Record<string, (n: number) => Pt[]> = {
  overview: n => { const c = Math.ceil(Math.sqrt(n * 1.8)), r = Math.ceil(n / c); return Array.from({ length: n }, (_, i) => [((i % c) + .5) / c, (Math.floor(i / c) + .5) / r]); },
  agriculture: n => Array.from({ length: n }, (_, i) => { const rows = 22, row = i % rows, t = Math.floor(i / rows) / Math.ceil(n / rows); const y = .12 + row / rows * .82; return [t, y + Math.sin(t * 9 + row * .6) * .012 + (y - .5) * .05 * Math.sin(t * 3)]; }),
  healthcare: n => Array.from({ length: n }, (_, i) => { const t = i / n; if (i % 3 === 0) { const x = t; const ph = (x * 4) % 1; const y = ph < .45 ? .5 : ph < .5 ? .5 - (ph - .45) * 7 : ph < .55 ? .15 + (ph - .5) * 14 : ph < .6 ? .85 - (ph - .55) * 7 : .5; return [x, y + (Math.random() - .5) * .01]; } const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * .5; return [.5 + Math.cos(a) * rr * .6, .5 + Math.sin(a) * rr]; }),
  finance: n => { const bars = 18; return Array.from({ length: n }, (_, i) => { const b = i % bars, h = .15 + (b / bars) * .65 + Math.sin(b * 1.7) * .08; const k = Math.floor(i / bars) / Math.ceil(n / bars); return [.06 + b / bars * .9 + (Math.random() - .5) * .025, .95 - k * h]; }); },
  energy: n => Array.from({ length: n }, (_, i) => { const rays = 36; if (i % 2) { const a = (i % rays) / rays * 6.283, r = .14 + Math.random() * .42; return [.5 + Math.cos(a) * r * .62, .5 + Math.sin(a) * r]; } const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .12; return [.5 + Math.cos(a) * r * .62, .5 + Math.sin(a) * r]; }),
  manufacturing: n => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283 * 3, ring = i % 3; const r = [.42, .3, .16][ring] + (ring === 0 ? (Math.sin(a * 12 / 3) > 0 ? .05 : 0) : 0); return [.5 + Math.cos(a) * r * .62, .5 + Math.sin(a) * r]; }),
};
export default function IndustryDots({ industry = 'overview', density = 1, morph = true }: { industry?: string; density?: number; morph?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext('2d')!; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const N = Math.round((innerWidth < 768 ? 380 : 760) * density); let W = 0, H = 0, dpr = Math.min(devicePixelRatio, 1.5);
    const prev = morph ? sessionStorage.getItem('gp-dots') : null; if (morph) sessionStorage.setItem('gp-dots', industry);
    const tgt = (forms[industry] || forms.overview)(N); const src = prev && prev !== industry && forms[prev] ? forms[prev](N) : tgt.map(() => [Math.random(), Math.random()] as Pt);
    const amber = Array.from({ length: N }, (_, i) => i % 7 === 0);
    const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); const P = (s: Pt) => [s[0] * W, s[1] * H];
    const pos = (reduce ? tgt : src).map(P), vel = pos.map(() => [0, 0]); let T = tgt.map(P);
    let mx = -1e4, my = -1e4, raf = 0, vis = true;
    const draw = (t: number) => { ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) { const p = pos[i]; const tw = amber[i] ? .55 + .45 * Math.sin(t / 600 + i) : .5;
        ctx.fillStyle = amber[i] ? `rgba(255,178,36,${tw})` : 'rgba(235,235,235,.55)'; ctx.beginPath(); ctx.arc(p[0], p[1], amber[i] ? 2.2 : 1.5, 0, 6.283); ctx.fill(); } };
    const step = (t: number) => { raf = requestAnimationFrame(step); if (!vis) return;
      for (let i = 0; i < N; i++) { const p = pos[i], v = vel[i], g = T[i]; const dx = p[0] - mx, dy = p[1] - my, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = (14000 - d2) / 14000 * 2.4; const d = Math.sqrt(d2) || 1; v[0] += dx / d * f; v[1] += dy / d * f; }
        v[0] += (g[0] + Math.sin(t / 1400 + i) * 2 - p[0]) * .02; v[1] += (g[1] + Math.cos(t / 1700 + i) * 2 - p[1]) * .02; v[0] *= .88; v[1] *= .88; p[0] += v[0]; p[1] += v[1]; }
      draw(t); };
    const mv = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const lv = () => { mx = my = -1e4; };
    const rs = () => { size(); T = tgt.map(P); if (reduce) { T.forEach((g, i) => { pos[i] = [...g]; }); draw(0); } };
    addEventListener('resize', rs);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }); io.observe(cv);
    if (reduce) draw(0); else { addEventListener('pointermove', mv, { passive: true }); document.addEventListener('pointerleave', lv); raf = requestAnimationFrame(step); }
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', rs); removeEventListener('pointermove', mv); document.removeEventListener('pointerleave', lv); };
  }, [industry]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 w-full h-full" data-dots={industry} />;
}
