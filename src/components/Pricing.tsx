import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
const plans = [
  { n: 'Free', m: 0, y: 0, d: 'Get oriented', f: ['5 countries', 'Headline KPIs + industry tabs', '30 days of history in charts', 'Weekly digest email'], cta: 'Start free' },
  { n: 'Pro', m: 9, y: 90, d: 'For professionals', hot: true, f: ['All countries covered', 'Full history (2000–latest)', 'Filter explorer & custom charts', 'CSV export', 'Daily newsletter for your countries & industries'], cta: 'Go Pro' },
  { n: 'Analyst', m: 29, y: 290, d: 'For research teams of one', f: ['Everything in Pro', 'Policy-change alerts', 'Saved watchlists', 'Comparison views', 'API access (openly licensed data only)'], cta: 'Choose Analyst' },
  { n: 'Enterprise', m: null, y: null, d: 'Seats & custom work', f: ['Team seats & SSO', 'Custom industry reports', 'Briefings', 'Priority support'], cta: 'Contact us' },
];
export default function Pricing({ links = {} as Record<string, { monthly: string; yearly: string }> }) {
  const [yr, setYr] = useState(false); const r = useReducedMotion();
  return <div>
    <div className="flex justify-center"><div role="radiogroup" aria-label="Billing period" className="glass rounded-xl p-1 inline-flex text-sm">
      {[['Monthly', false], ['Yearly', true]].map(([l, v]: any) => <button key={l} role="radio" aria-checked={yr === v} onClick={() => setYr(v)} className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${yr === v ? 'bg-cta text-black font-semibold' : 'text-muted hover:text-text'}`}>{l}{v && <span className="ml-1.5 text-[11px]">2 months free</span>}</button>)}
    </div></div>
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((p, i) => <motion.article key={p.n} initial={r ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }} whileHover={r ? undefined : { y: -4 }}
        className={`spot glass rounded-2xl p-6 flex flex-col ${p.hot ? 'ring-2 ring-white shadow-[0_0_70px_-20px_rgba(255,255,255,.35)]' : ''}`}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{p.n}</h2>{p.hot && <span className="text-[11px] font-semibold bg-cta text-black rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Sparkles size={12} aria-hidden />Most popular</span>}</div>
        <p className="text-sm text-muted mt-1">{p.d}</p>
        <div className="mt-5 h-14 flex items-end gap-1">{p.m == null ? <span className="text-4xl font-semibold">Custom</span> : <><span className="font-mono text-5xl font-semibold">${yr ? p.y : p.m}</span><span className="text-muted pb-1.5">/{yr ? 'yr' : 'mo'}</span></>}</div>
        <ul className="mt-6 grid gap-2.5 text-sm">{p.f.map(f => <li key={f} className="flex gap-2"><Check size={16} className="text-up shrink-0 mt-0.5" aria-hidden />{f}</li>)}</ul>
        {(() => { const base = `mt-8 text-center rounded-full py-2.5 font-semibold transition ${p.hot ? 'bg-cta text-black hover:bg-white' : 'border border-white/30 hover:bg-white/10'}`;
          if (p.n === 'Free') return <a href="/india" className={base + ' cursor-pointer'}>{p.cta}</a>;
          if (p.n === 'Enterprise') return <a href="/contact" className={base + ' cursor-pointer'}>{p.cta}</a>;
          const url = links[p.n]?.[yr ? 'yearly' : 'monthly'];
          return url ? <a href={url} rel="noopener noreferrer" className={base + ' cursor-pointer'}>{p.cta}</a>
            : <button type="button" disabled aria-describedby="checkout-note" className={base + ' opacity-60 cursor-not-allowed'}>{p.cta} · checkout soon</button>; })()}
      </motion.article>)}
    </div>
  </div>;
}
