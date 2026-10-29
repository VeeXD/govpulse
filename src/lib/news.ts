import raw from '../data/news.json';
export type NewsItem = { id: string; title: string; source: string; time: string; url: string; category: string; via: string };
export const NEWS = raw as unknown as { generated: string; via: string[]; countries: Record<string, NewsItem[]> };
export const CATS: Record<string, string> = { companies: 'Companies', politics: 'Politics', business: 'Business', trends: 'Economy & trends' };
export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (m < 60) return `${m || 1} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`; const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`;
}
