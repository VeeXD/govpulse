// Sponsor slots are config-driven. Add an entry to show a logo; empty arrays render nothing.
// Sponsors never influence data, rankings or editorial content (see /sponsor#disclosure).
export type Sponsor = { name: string; url: string; logo: string; alt?: string; industry?: string; country?: string };
export const ZELLE_EMAIL = 'sadam.veekshith01@gmail.com'; // Zelle recipient (differs from the contact inbox on purpose)
export const SPONSORS: { gold: Sponsor[]; silver: Sponsor[]; bronze: Sponsor[] } = { gold: [], silver: [], bronze: [] };
export const TIERS = [
  { id: 'supporter', name: 'Supporter', price: 'Any amount', perks: ['Our thanks, and an optional name on the supporters list', 'Funds hosting, data pipelines and new indicators'] },
  { id: 'bronze', name: 'Bronze', price: '$50/mo', perks: ['Logo in the site footer on every page', 'Listed on this page'] },
  { id: 'silver', name: 'Silver', price: '$250/mo', perks: ['Everything in Bronze', 'Logo on country dashboards ("Supported by")'] },
  { id: 'gold', name: 'Gold', price: '$1,000/mo', perks: ['Everything in Silver', '"Presented by" credit on one industry section across all countries', 'Quarterly note on which data sources your support funded'] },
];
