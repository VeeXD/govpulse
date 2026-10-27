// Per-IP rate limiting for /api/* and /embed/* only (scoped by public/_routes.json,
// so static pages never invoke Functions and don't count toward the 100k/day free quota).
// Pages projects cannot use the Workers Rate Limiting binding directly; if the RL service binding
// (workers/ratelimit) is configured it is used, otherwise a best-effort in-memory window per isolate.
// The in-memory fallback is not a strict global limit.
const LIMITS: Record<string, number> = { api: 120, embed: 300 }; // requests per 60 s per IP
const WINDOW = 60_000;
const BOTS = /(Googlebot|bingbot|DuckDuckBot|Applebot|YandexBot|Baiduspider)/i;
const hits = new Map<string, { n: number; t: number }>();
const SAFE = /^(GET|HEAD|OPTIONS)$/;

interface Env { RL?: { fetch(u: string): Promise<Response> } }

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname;
  const bucket = path.startsWith('/api/') ? 'api' : path.startsWith('/embed/') ? 'embed' : '';
  if (bucket && !SAFE.test(request.method)) {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { allow: 'GET, HEAD, OPTIONS', 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
    });
  }
  if (bucket && request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS',
      'access-control-max-age': '86400', 'cache-control': 'no-store',
    }});
  }
  if (bucket && !BOTS.test(request.headers.get('user-agent') || '')) {
    const now = Date.now();
    const key = bucket + ':' + clientKey(request.headers.get('cf-connecting-ip') || 'unknown');
    if (env.RL) {
      try {
        const r = await env.RL.fetch(`https://rl/check?b=${bucket}&k=${encodeURIComponent(key)}`);
        if (r.status === 429) return limited(Number(r.headers.get('retry-after')) || 60);
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

// IPv6 clients usually own a whole /64, so bucket by /64 instead of the full address.
function clientKey(ip: string) {
  if (!ip.includes(':')) return ip.replace(/[^\d.]/g, '').slice(0, 45) || 'unknown';
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return full.slice(0, 4).map((x) => x.toLowerCase().replace(/[^0-9a-f]/g, '').replace(/^0+(?=.)/, '') || '0').join(':') + '::/64';
}

function limited(retry: number) {
  return new Response(JSON.stringify({ error: 'rate_limited', message: `Too many requests. Retry in ${retry}s.` }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'retry-after': String(retry), 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS' },
  });
}
function withHeader(res: Response, bucket: string) {
  const r = new Response(res.body, res);
  r.headers.set('x-ratelimit-limit', String(LIMITS[bucket]));
  if (!r.headers.has('access-control-allow-methods')) r.headers.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');
  return r;
}
