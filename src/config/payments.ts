// Checkout is config-driven. Paste the Stripe Payment Link (or Lemon Squeezy checkout URL) here or set PUBLIC_PAY_PRO.
// Empty string = checkout not live; the button is shown disabled. We never simulate a successful payment.
export const PAY_PRO: string = import.meta.env.PUBLIC_PAY_PRO ?? '';
export const PRO_PRICE = 9.99;
export const PROVIDER = 'Stripe Payment Links or Lemon Squeezy (merchant account required)';
