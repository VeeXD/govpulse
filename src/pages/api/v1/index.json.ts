import { DATA } from '../../../lib/data';
export const GET = () => new Response(JSON.stringify({ version: 'v1', generated: DATA.generated, license: 'CC BY 4.0', attribution: 'Source: World Bank WDI, via GovPulse', endpoints: ['/api/v1/countries.json', '/api/v1/indicators.json', '/api/v1/{country}.json', '/api/v1/{country}/{indicator}.json'] }, null, 1));
