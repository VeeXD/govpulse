// Rate-limit oracle for the govpulse Pages project. Called via service binding only
// (workers_dev = false). GET /check?b=api|embed&k=<bucket:ip> -> 200 | 429.
import { DurableObject } from 'cloudflare:workers';
const LIMITS: Record<string, number> = { api: 120, embed: 300 };
const WINDOW = 60_000;
const MAX_KEY = 96;
interface Env { COUNTER: DurableObjectNamespace<Counter> }

export class Counter extends DurableObject {
  n = 0; t = 0; // DO is single-threaded per key; eviction just resets the window
  async hit(limit: number): Promise<number> {
    const now = Date.now();
    if (now - this.t >= WINDOW) { this.n = 0; this.t = now; }
    this.n++;
    return this.n > limit ? Math.max(1, Math.ceil((this.t + WINDOW - now) / 1000)) : 0;
  }
}
export default {
  async fetch(req: Request, env: Env) {
    if (req.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET' } });
    const u = new URL(req.url);
    if (u.pathname !== '/check') return new Response(null, { status: 404 });
    const b = u.searchParams.get('b') === 'embed' ? 'embed' : 'api';
    const raw = (u.searchParams.get('k') || 'unknown').slice(0, MAX_KEY);
    const k = raw.replace(/[^\w.:/%-]/g, '') || 'unknown';
    const stub = env.COUNTER.get(env.COUNTER.idFromName(k));
    const retry = await stub.hit(LIMITS[b]);
    return new Response(null, { status: retry ? 429 : 200, headers: retry ? { 'retry-after': String(retry) } : {} });
  },
};
