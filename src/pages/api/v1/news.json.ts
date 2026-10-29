import { NEWS } from '../../../lib/news';
export const GET = () => new Response(JSON.stringify({ ...NEWS, note: 'Headlines only; each links to the original publisher. Sources: Google News RSS, GDELT, official central bank and government feeds.' }));
