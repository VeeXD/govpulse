// Entitlements are config-driven. Until auth + Stripe webhooks exist, everyone is on the free plan.
// Later: replace `currentPlan()` with a lookup of the signed-in user's subscription.
export type Plan = 'free' | 'pro' | 'analyst';
export const DEFAULT_PLAN: Plan = 'free';
export const PRO_FEATURES = ['filters', 'compare', 'export'] as const;
/** Browser-only. `?pro=1` preview works ONLY on localhost/127.0.0.1 (for screenshots), never in production. */
export function currentPlan(): Plan {
  if (typeof window === 'undefined') return DEFAULT_PLAN;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (local && new URLSearchParams(location.search).get('pro') === '1') return 'pro';
  return DEFAULT_PLAN;
}
export const hasPro = () => currentPlan() !== 'free';
