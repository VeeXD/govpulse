import { LATEST } from '../../../lib/latest';
export const GET = () => new Response(JSON.stringify({ ...LATEST, license: 'Source attribution required: BIS, FRED, World Bank (CC BY 4.0), via GovPulse' }));
