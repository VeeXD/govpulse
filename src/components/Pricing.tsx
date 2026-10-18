import { motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
const plans = [
  { n: 'Free', price: '$0', d: 'Get oriented', f: ['All 10 countries currently covered', 'Headline KPIs for every industry', 'Industry filter', 'Full-history charts with sources', 'Claim checks'], cta: 'Start free' },
  { n: 'Pro', price: '$9.99', d: 'Everything, for professionals', hot: true, f: ['All countries as coverage grows', 'Every filter: year range, metric vs metric, country vs country', 'CSV export', 'Daily newsletter for your countries & industries', 'Policy-change alerts', 'Saved watchlists', 'API access (openly licensed data only)'], cta: 'Go Pro' },
];
export default function Pricing({ link = '' }: { link?: string }) {
  const r = useReducedMotion();
  return <div className="mx-auto max-w-4xl grid gap-5 md:grid-cols-2">
    {plans.map((p, i) => <motion.article key={p.n} initial={r ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }} whileHover={r ? undefined : { y: -4 }}
      className={`spot edge rounded-2xl p-7 flex flex-col ${p.hot ? 'glow-amber' : ''}`}>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{p.n}</h2>{p.hot && <span className="text-[11px] font-semibold bg-cta text-black rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Sparkles size={12} aria-hidden />All features</span>}</div>
      <p className="text-sm text-muted mt-1">{p.d}</p>
      <div className="mt-5 h-14 flex items-end gap-1"><span className="font-mono text-5xl font-semibold">{p.price}</span><span className="text-muted pb-1.5">/mo</span></div>
      <ul className="mt-6 grid gap-2.5 text-sm">{p.f.map(f => <li key={f} className="flex gap-2"><Check size={16} className="text-accent shrink-0 mt-0.5" aria-hidden />{f}</li>)}</ul>
      {(() => { const base = `mt-auto pt-0 text-center rounded-full py-2.5 font-semibold transition ${p.hot ? 'bg-cta text-black hover:bg-white' : 'border border-white/30 hover:bg-white/10'}`;
        const wrap = (el: any) => <div className="mt-8 flex flex-col">{el}</div>;
        if (p.n === 'Free') return wrap(<a href="/india/#dash" className={base + ' cursor-pointer'}>{p.cta}</a>);
        return wrap(link ? <a href={link} rel="noopener noreferrer" className={base + ' cursor-pointer'}>{p.cta}</a>
          : <button type="button" disabled aria-describedby="checkout-note" className={base + ' opacity-60 cursor-not-allowed'}>{p.cta} · checkout soon</button>); })()}
    </motion.article>)}
  </div>;
}
