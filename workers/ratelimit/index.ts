// Rate-limit oracle for the govpulse Pages project. Called via service binding:
// GET /check?b=api|embed&k=<bucket:ip>  -> 200 ok | 429 limited (strict, via Durable Object)
import { DurableObject } from 'cloudflare:workers';
const LIMITS: Record<string, number> = { api: 120, embed: 300 };
const WINDOW = 60_000;
interface Env { COUNTER: DurableObjectNamespace<Counter> }

export class Counter extends DurableObject {
  n = 0; t = 0; // in-memory is fine: DO is single-threaded and per-key; eviction just resets the window
  async hit(limit: number): Promise<[number, number]> {
    const now = Date.now();
    if (now - this.t >= WINDOW) { this.n = 0; this.t = now; }
    this.n++;
    return [this.n > limit ? Math.max(1, Math.ceil((this.t + WINDOW - now) / 1000)) : 0, this.n];
  }
}
export default {
  async fetch(req: Request, env: Env) {
    const u = new URL(req.url);
    const b = u.searchParams.get('b') === 'embed' ? 'embed' : 'api';
    const k = u.searchParams.get('k') || 'unknown';
    const stub = env.COUNTER.get(env.COUNTER.idFromName(k));
    const [retry, n] = await stub.hit(LIMITS[b]);
    return new Response(null, { status: retry ? 429 : 200, headers: { ...(retry ? { 'retry-after': String(retry) } : {}) } });
  },
};
