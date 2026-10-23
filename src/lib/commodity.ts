import raw from '../data/commodity.json';
export const CM: any = raw;
export const NAMES: Record<string, string> = { india: 'India', usa: 'United States', china: 'China', uk: 'United Kingdom', germany: 'Germany', japan: 'Japan', brazil: 'Brazil', indonesia: 'Indonesia', nigeria: 'Nigeria', uae: 'UAE' };
const FAO_SHORT: Record<string, string> = { 'China, mainland': 'China (mainland)', 'United States of America': 'United States', 'Russian Federation': 'Russia', 'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom', 'Viet Nam': 'Vietnam', 'Türkiye': 'Türkiye', 'Iran (Islamic Republic of)': 'Iran', 'Bolivia (Plurinational State of)': 'Bolivia', 'Venezuela (Bolivarian Republic of)': 'Venezuela', 'United Republic of Tanzania': 'Tanzania', "Lao People's Democratic Republic": 'Laos', 'Democratic Republic of the Congo': 'DR Congo' };
export const area = (a: string) => FAO_SHORT[a] ?? a;
export const tonnes = (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(2)} bn t` : v >= 1e6 ? `${(v / 1e6).toFixed(1)} m t` : v >= 1e3 ? `${(v / 1e3).toFixed(0)} k t` : `${Math.round(v)} t`;
export const usd = (v: number) => v >= 1e12 ? `$${(v / 1e12).toFixed(2)} tn` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)} bn` : `$${(v / 1e6).toFixed(0)} m`;
export const cropName = (s: string) => ({ maize: 'Maize (corn)', 'sugar-cane': 'Sugar cane', 'oil-palm': 'Oil palm fruit', cotton: 'Seed cotton', coffee: 'Green coffee', soybeans: 'Soybeans', cassava: 'Cassava' } as any)[s] ?? s[0].toUpperCase() + s.slice(1);
/** 5 W's built only from the numbers in commodity.json. */
export function fiveW(slug: string) {
  const c = CM.crops[slug]; const t = c.top; const top3 = t.slice(0, 3).reduce((a: number, x: any) => a + x.share, 0);
  const ch = c.world10 ? (100 * (c.world - c.world10) / c.world10) : null; const nm = cropName(slug).toLowerCase();
  return [
    ['Who', `${area(t[0].area)} is the largest producer of ${nm} (${t[0].share.toFixed(1)}% of world output), followed by ${area(t[1].area)} (${t[1].share.toFixed(1)}%) and ${area(t[2].area)} (${t[2].share.toFixed(1)}%).`],
    ['What', `The world produced ${tonnes(c.world)} of ${nm} in ${c.year}, across ${c.producers} reporting countries.`],
    ['Where', `Output is ${top3 >= 60 ? 'highly concentrated' : top3 >= 40 ? 'fairly concentrated' : 'spread widely'}: the top three countries account for ${top3.toFixed(1)}% and the top ten for ${t.reduce((a: number, x: any) => a + x.share, 0).toFixed(1)}%.`],
    ['When', ch == null ? `Latest FAOSTAT year is ${c.year}.` : `Latest FAOSTAT year is ${c.year}. World output ${ch >= 0 ? 'rose' : 'fell'} ${Math.abs(ch).toFixed(1)}% over the ten years since ${c.year - 10}.`],
    ['Why it matters', `Because ${top3.toFixed(0)}% of supply comes from three countries, a poor harvest or export restriction in ${area(t[0].area)}, ${area(t[1].area)} or ${area(t[2].area)} moves the global ${nm} market more than events elsewhere.`],
  ];
}
