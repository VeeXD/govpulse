/** Industries with an in-depth (commodity-level) drill-down, and what each covers. */
export const DEEP: Record<string, { label: string; what: string }> = {
  trade: { label: 'Trade', what: 'Top 10 imported and exported HS chapters, top partner countries, broad import categories' },
  agriculture: { label: 'Agriculture', what: 'Top crops by tonnes, world rank, crop use (food, feed, imports) and farm trade' },
  energy: { label: 'Energy', what: 'Energy use and production by fuel, electricity mix, world top producers' },
  manufacturing: { label: 'Manufacturing', what: 'Manufacturing output rank, manufactured exports and imports, who exports most' },
};
export const deepUrl = (ind: string, c?: string, level: 'explorer' | 'dashboard' = 'dashboard') => DEEP[ind] ? (level === 'dashboard' && c ? `/commodities/${ind}/${c}/` : `/commodities/${ind}/${c ? `?c=${c}` : ''}`) : null;
