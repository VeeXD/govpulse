import { DATA, COUNTRIES } from '../../../lib/data';
export function getStaticPaths() { return Object.keys(COUNTRIES).map(country => ({ params: { country } })); }
export const GET = ({ params }: any) => new Response(JSON.stringify({ country: params.country, iso3: COUNTRIES[params.country].iso, generated: DATA.generated, license: 'CC BY 4.0', attribution: 'Source: World Bank WDI, via GovPulse', series: DATA.countries[params.country] }));
