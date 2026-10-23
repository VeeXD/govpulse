"""Commodity explorer data: FAOSTAT crop production (bulk zip), UN Comtrade public preview (trade by HS chapter),
World Bank manufacturing value added. Writes src/data/commodity.json. Real data only; gaps are recorded, not filled."""
import csv, io, json, time, urllib.request, zipfile, datetime, os
UA = {'User-Agent': 'GovPulse-pipeline/1.0 (+https://govpulse.pages.dev)'}
def get(u, t=120):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
C = {  # slug: (FAO area name, Comtrade/M49 code, ISO3, label)
 'india': ('India', 699, 'IND', 'India'), 'usa': ('United States of America', 842, 'USA', 'United States'),
 'china': ('China, mainland', 156, 'CHN', 'China'), 'uk': ('United Kingdom of Great Britain and Northern Ireland', 826, 'GBR', 'United Kingdom'),
 'germany': ('Germany', 276, 'DEU', 'Germany'), 'japan': ('Japan', 392, 'JPN', 'Japan'), 'brazil': ('Brazil', 76, 'BRA', 'Brazil'),
 'indonesia': ('Indonesia', 360, 'IDN', 'Indonesia'), 'nigeria': ('Nigeria', 566, 'NGA', 'Nigeria'), 'uae': ('United Arab Emirates', 784, 'ARE', 'UAE')}
CROPS = {'wheat': 'Wheat', 'rice': 'Rice', 'maize': 'Maize (corn)', 'soybeans': 'Soya beans', 'sugar-cane': 'Sugar cane',
 'potatoes': 'Potatoes', 'cassava': 'Cassava, fresh', 'oil-palm': 'Oil palm fruit', 'coffee': 'Coffee, green', 'cotton': 'Seed cotton, unginned'}
FAO = 'https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip'
out = {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'), 'crops': {}, 'trade': {}, 'manufacturing': {}, 'gaps': []}
# ---- FAOSTAT production
try:
    z = zipfile.ZipFile(io.BytesIO(get(FAO, 300)))
    name = next(n for n in z.namelist() if 'All_Data' in n and n.endswith('.csv') and 'Normalized' in n)
    want = {v: k for k, v in CROPS.items()}; rows = {}
    with z.open(name) as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding='latin-1')):
            if r['Element'] != 'Production' or r['Item'] not in want or not r['Value']: continue
            ac = int(r['Area Code'])
            if ac >= 5000 and ac != 5000 or ac == 351: continue  # keep countries + World (5000); drop aggregates and China incl. HK/Taiwan
            rows.setdefault(want[r['Item']], {}).setdefault(r['Area'], {})[int(r['Year'])] = float(r['Value'])
    for slug, by in rows.items():
        world = by.get('World', {}); ly = max(world) if world else None
        if not ly: continue
        ranked = sorted(((a, s[ly]) for a, s in by.items() if a != 'World' and ly in s), key=lambda x: -x[1])
        top = [{'area': a, 'value': v, 'share': round(100 * v / world[ly], 2)} for a, v in ranked[:10]]
        series = {a: sorted([y, v] for y, v in by[a].items() if y >= ly - 24) for a in ['World'] + [t['area'] for t in top[:5]]}
        ours = {k: {'value': by.get(c[0], {}).get(ly), 'rank': next((i + 1 for i, (a, _) in enumerate(ranked) if a == c[0]), None)} for k, c in C.items()}
        out['crops'][slug] = {'item': CROPS[slug], 'unit': 't', 'year': ly, 'world': world[ly], 'world10': world.get(ly - 10), 'producers': len(ranked),
                              'top': top, 'series': series, 'ours': ours}
    out['fao'] = {'source': 'FAOSTAT Crops and livestock products (QCL), FAO, CC BY 4.0', 'url': 'https://www.fao.org/faostat/en/#data/QCL'}
except Exception as e:
    out['gaps'].append(f'FAOSTAT bulk download failed: {type(e).__name__}')
# ---- UN Comtrade public preview, exports & imports by HS chapter
HS2 = json.load(open(os.path.join(os.path.dirname(__file__), 'hs2.json')))
MANUF = lambda h: 28 <= h <= 96 and h != 71
for k, (_, code, iso, lab) in C.items():
    got = None
    for yr in (2024, 2023, 2022):
        flows = {}
        for fl in ('X', 'M'):
            try:
                d = json.loads(get(f'https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode={code}&period={yr}&partnerCode=0&flowCode={fl}&cmdCode=AG2', 60))['data']
            except Exception: d = []
            time.sleep(1.2)
            flows[fl] = {int(r['cmdCode']): {'desc': r['cmdDesc'], 'v': r['primaryValue']} for r in d if r['cmdCode'].isdigit() and r.get('primaryValue')}
        if flows['X']: got = (yr, flows); break
    if not got: out['gaps'].append(f'No Comtrade preview data for {lab}'); continue
    yr, flows = got; t = {}
    for fl, d in flows.items():
        tot = sum(x['v'] for x in d.values()); top = sorted(d.items(), key=lambda x: -x[1]['v'])[:10]
        t[fl] = {'total': tot, 'manufShare': round(100 * sum(x['v'] for h, x in d.items() if MANUF(h)) / tot, 1) if tot else None,
                 'top': [{'hs': f'{h:02d}', 'desc': x['desc'] or HS2.get(f'{h:02d}', f'HS {h:02d}'), 'value': x['v'], 'share': round(100 * x['v'] / tot, 1), 'manuf': MANUF(h)} for h, x in top]}
    out['trade'][k] = {'year': yr, **t}
out['comtrade'] = {'source': 'UN Comtrade public preview API (HS 2-digit, partner World)', 'url': 'https://comtradeplus.un.org/', 'manufDef': 'HS chapters 28–96 excluding 71 (precious stones and metals)'}
# ---- World Bank manufacturing value added (current US$), ranked across all economies
try:
    reg = {c['id']: c['region']['id'] for c in json.loads(get('https://api.worldbank.org/v2/country?format=json&per_page=400'))[1]}
    d = json.loads(get('https://api.worldbank.org/v2/country/all/indicator/NV.IND.MANF.CD?format=json&per_page=20000&mrnev=1'))[1]
    vals = sorted([(r['countryiso3code'], r['value'], int(r['date'])) for r in d if r['value'] and reg.get(r['countryiso3code'], 'NA') != 'NA'], key=lambda x: -x[1])
    for k, (_, _, iso, lab) in C.items():
        i = next((i for i, v in enumerate(vals) if v[0] == iso), None)
        out['manufacturing'][k] = {'value': vals[i][1], 'year': vals[i][2], 'rank': i + 1, 'of': len(vals)} if i is not None else None
    out['wb'] = {'source': 'World Bank WDI NV.IND.MANF.CD, CC BY 4.0', 'url': 'https://data.worldbank.org/indicator/NV.IND.MANF.CD'}
except Exception as e:
    out['gaps'].append(f'World Bank manufacturing fetch failed: {type(e).__name__}')
if out['crops'] and out['trade']: json.dump(out, open(os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'commodity.json'), 'w'), separators=(',', ':'))
print('crops', list(out['crops']), 'trade', {k: v['year'] for k, v in out['trade'].items()}, 'manuf', len(out['manufacturing']), 'gaps', out['gaps'])
