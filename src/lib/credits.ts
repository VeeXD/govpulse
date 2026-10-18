import media from '../data/media.json'; import heroes from '../data/heroes.json';
export type Credit = { what: string; title: string; href?: string; author: string; license: string };
export function mediaCredit(id: string, what = 'Background'): Credit | null {
  const m = (media as any)[id]; if (m) return { what, title: m.label, href: m.source || undefined, author: m.author, license: m.license };
  const h = (heroes as any)[id]; if (h) return { what, title: h.landmark, href: h.url, author: h.author || 'Wikimedia Commons', license: h.license };
  return null;
}
export const EARTH_CREDITS: Credit[] = [mediaCredit('earth-day', 'Live Earth texture')!, mediaCredit('earth-night', 'Live Earth texture')!];
