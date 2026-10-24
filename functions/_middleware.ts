// Per-IP rate limiting for /api/* and /embed/* only (scoped by public/_routes.json,
// so static pages never invoke Functions and don't count toward the 100k/day free quota).
// Pages projects cannot use the Workers Rate Limiting binding directly; if the RL service binding
// (workers/ratelimit) is configured it is used, otherwise a best-effort in-memory window per isolate.
// The in-memory fallback is not a strict global limit.
const LIMITS: Record<string, number> = { api: 120, embed: 300 }; // requests per 60 s per IP
const WINDOW = 60_000;
const BOTS = /(Googlebot|bingbot|DuckDuckBot|Applebot|YandexBot|Baiduspider)/i;
const hits = new Map<string, { n: number; t: number }>();

interface Env { RL?: { fetch(u: string): Promise<Response> } }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname;
  const bucket = path.startsWith('/api/') ? 'api' : path.startsWith('/embed/') ? 'embed' : '';
  if (bucket && !BOTS.test(request.headers.get('user-agent') || '')) {
    const now = Date.now();
    const key = bucket + ':' + (request.headers.get('cf-connecting-ip') || 'unknown');
    if (env.RL) {
      // Preferred: Workers Rate Limiting binding via the govpulse-ratelimit Worker (workers/ratelimit).
      try {
        const r = await env.RL.fetch(`https://rl/check?b=${bucket}&k=${encodeURIComponent(key)}`);
        if (r.status === 429) return limited(60);
        return withHeader(await ctx.next(), bucket);
      } catch { /* fall through to in-memory */ }
    }
    let e = hits.get(key);
    if (!e || now - e.t >= WINDOW) { e = { n: 0, t: now }; hits.set(key, e); }
    e.n++;
    if (hits.size > 20_000) for (const [k, v] of hits) if (now - v.t >= WINDOW) hits.delete(k);
    if (e.n > LIMITS[bucket]) {
      return limited(Math.max(1, Math.ceil((e.t + WINDOW - now) / 1000)));
    }
  }
  return bucket ? withHeader(await ctx.next(), bucket) : ctx.next();
};

function limited(retry: number) {
  return new Response(JSON.stringify({ error: 'rate_limited', message: `Too many requests. Retry in ${retry}s.` }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'retry-after': String(retry), 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}
function withHeader(res: Response, bucket: string) {
  const r = new Response(res.body, res);
  r.headers.set('x-ratelimit-limit', String(LIMITS[bucket]));
  return r;
}
