import { COUNTRIES, DATA, series } from './data';
export const reportYear = (id: string) => series(id, 'NY.GDP.MKTP.KD.ZG').at(-1)?.[0] ?? new Date().getFullYear() - 1;
export const reportSlug = (id: string) => `${id}-economic-report-${reportYear(id)}`;
export const edition = () => new Date(DATA.generated.endsWith('Z') ? DATA.generated : DATA.generated + 'Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const reports = () => Object.entries(COUNTRIES).map(([id, c]) => ({ id, name: c.name, year: reportYear(id), slug: reportSlug(id) }));
