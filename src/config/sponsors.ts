// Sponsor slots are config-driven. Add an entry to show a logo; empty arrays render nothing.
// Sponsors never influence data, rankings or editorial content (see /sponsor#disclosure).
export type Sponsor = { name: string; url: string; logo: string; alt?: string; industry?: string; country?: string };
export const SPONSORS: { gold: Sponsor[]; silver: Sponsor[]; bronze: Sponsor[] } = { gold: [], silver: [], bronze: [] };
