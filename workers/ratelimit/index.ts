// Rate-limit oracle for the govpulse Pages project. Called via service binding:
// GET /check?b=api|embed&k=<ip>  -> 200 ok | 429 limited
interface RL { limit(o: { key: string }): Promise<{ success: boolean }> }
interface Env { RL_API: RL; RL_EMBED: RL }
export default {
  async fetch(req: Request, env: Env) {
    const u = new URL(req.url);
    const rl = u.searchParams.get('b') === 'embed' ? env.RL_EMBED : env.RL_API;
    const { success } = await rl.limit({ key: u.searchParams.get('k') || 'unknown' });
    return new Response(null, { status: success ? 200 : 429 });
  },
};
