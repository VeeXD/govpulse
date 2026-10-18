// Checkout is config-driven. Paste Stripe Payment Link or Lemon Squeezy checkout URLs here (or set env vars).
// Empty string = checkout not live; the button is shown disabled. We never simulate a successful payment.
export const PAYMENT_LINKS: Record<string, { monthly: string; yearly: string }> = {
  Pro: { monthly: import.meta.env.PUBLIC_PAY_PRO_MONTHLY ?? '', yearly: import.meta.env.PUBLIC_PAY_PRO_YEARLY ?? '' },
  Analyst: { monthly: import.meta.env.PUBLIC_PAY_ANALYST_MONTHLY ?? '', yearly: import.meta.env.PUBLIC_PAY_ANALYST_YEARLY ?? '' },
};
export const PROVIDER = 'Stripe Payment Links or Lemon Squeezy (merchant account required)';
