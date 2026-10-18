import { DATA } from '../../../lib/data';
export const GET = () => new Response(JSON.stringify({ generated: DATA.generated, license: 'CC BY 4.0', indicators: Object.entries(DATA.indicators).map(([code, m]: any) => ({ code, ...m })) }));
