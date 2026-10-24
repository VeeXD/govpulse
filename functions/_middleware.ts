// Per-IP rate limiting for /api/* and /embed/* only (see public/_routes.json).
// Static pages never invoke Functions, so they cost nothing and are unlimited.
interface RL { limit(o: { key: string }): Promise<{ success: boolean }> }
interface Env { RL_API?: RL; RL_EMBED?: RL }

const BOTS = /(Googlebot|bingbot|DuckDuckBot|Applebot|YandexBot|Baiduspider)/i;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname;
  const rl = path.startsWith('/api/') ? env.RL_API : path.startsWith('/embed/') ? env.RL_EMBED : undefined;
  const ua = request.headers.get('user-agent') || '';
  if (rl && !BOTS.test(ua)) {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    try {
      const { success } = await rl.limit({ key: ip });
      if (!success) {
        return new Response(JSON.stringify({ error: 'rate_limited', message: 'Too many requests. Please retry in a minute.' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '60', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
        });
      }
    } catch { /* fail open */ }
  }
  return ctx.next();
};
