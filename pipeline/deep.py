"""In-depth industry data (real, keyless sources). Writes src/data/deep.json.
- Trade: UN Comtrade public preview — all HS 2-digit chapters (partner World) + top partner countries (TOTAL), exports & imports.
- Agriculture: FAOSTAT bulk — each country's top crops (QCL) and crop use from Food Balance Sheets (FBS).
- Energy: Our World in Data energy dataset (Energy Institute Statistical Review + Ember), consumption/production by fuel.
Nothing is estimated; missing values are left out and listed in gaps."""
import csv, io, json, os, time, urllib.request, zipfile, datetime
UA = {'User-Agent': 'GovPulse-pipeline/1.0 (+https://govpulse.pages.dev)'}
get = lambda u, t=180: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
HERE = os.path.dirname(__file__); HS2 = json.load(open(os.path.join(HERE, 'hs2.json')))
C = {'india': ('India', 699, 'IND'), 'usa': ('United States of America', 842, 'USA'), 'china': ('China, mainland', 156, 'CHN'), 'uk': ('United Kingdom of Great Britain and Northern Ireland', 826, 'GBR'),
     'germany': ('Germany', 276, 'DEU'), 'japan': ('Japan', 392, 'JPN'), 'brazil': ('Brazil', 76, 'BRA'), 'indonesia': ('Indonesia', 360, 'IDN'), 'nigeria': ('Nigeria', 566, 'NGA'), 'uae': ('United Arab Emirates', 784, 'ARE')}
out = {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'), 'trade': {}, 'agri': {}, 'energy': {}, 'gaps': []}
CT = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS'
def ct(q):
    for i in range(3):
        try: d = json.loads(get(f'{CT}?{q}', 60)).get('data') or []; time.sleep(1.2); return d
        except Exception: time.sleep(4)
    return []
PA = {r['PartnerCode']: (r['PartnerCodeIsoAlpha3'], r['PartnerDesc']) for r in json.loads(get('https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json'))['results'] if not r.get('isGroup')}
for k, (_, code, iso) in C.items():
    for yr in (2024, 2023, 2022):
        x = ct(f'reporterCode={code}&period={yr}&partnerCode=0&flowCode=X&cmdCode=AG2')
        if x: break
    if not x: out['gaps'].append(f'Comtrade: no data for {k}'); continue
    t = {'year': yr}
    for fl in ('X', 'M'):
        d = x if fl == 'X' else ct(f'reporterCode={code}&period={yr}&partnerCode=0&flowCode=M&cmdCode=AG2')
        t[fl] = {r['cmdCode']: r['primaryValue'] for r in d if r['cmdCode'].isdigit() and r.get('primaryValue')}
        p = ct(f'reporterCode={code}&period={yr}&flowCode={fl}&cmdCode=TOTAL')
        tot = next((r['primaryValue'] for r in p if r['partnerCode'] == 0), None)
        for r in p: r['partnerISO'], r['partnerDesc'] = PA.get(r['partnerCode'], (None, None))
        ps = sorted([r for r in p if r['partnerCode'] not in (0,) and r.get('partnerISO') and len(r['partnerISO']) == 3 and not r['partnerISO'].startswith(('X', '_')) and r['primaryValue']], key=lambda r: -r['primaryValue'])
        t[fl + 'p'] = [{'iso': r['partnerISO'], 'name': r['partnerDesc'], 'value': r['primaryValue'], 'share': round(100 * r['primaryValue'] / tot, 1) if tot else None} for r in ps[:10]]
        t[fl + 'total'] = tot or sum(t[fl].values())
    out['trade'][k] = t; print('trade', k, yr, len(t['X']), len(t['Xp']))
out['hs2'] = HS2
# ---- FAOSTAT: top crops per country + food balance use
FAO = 'https://bulks-faostat.fao.org/production/'
try:
    z = zipfile.ZipFile(io.BytesIO(get(FAO + 'Production_Crops_Livestock_E_All_Data_(Normalized).zip', 400)))
    nm = next(n for n in z.namelist() if 'All_Data' in n and n.endswith('.csv'))
    areas = {v[0]: k for k, v in C.items()}; prod = {}
    with z.open(nm) as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding='latin-1')):
            if r['Area'] in areas and r['Element'] == 'Production' and r['Unit'] == 't' and r['Value'] and int(r['Item Code']) < 1700 and int(r['Year']) >= 2000:
                prod.setdefault(areas[r['Area']], {}).setdefault(r['Item'], {})[int(r['Year'])] = float(r['Value'])
    for k, items in prod.items():
        ly = max(max(s) for s in items.values()); top = sorted(((i, s[ly]) for i, s in items.items() if ly in s), key=lambda x: -x[1])[:10]
        out['agri'][k] = {'year': ly, 'top': [{'item': i, 'value': v} for i, v in top], 'series': {i: sorted([y, v] for y, v in items[i].items()) for i, _ in top[:5]}}
    del z
    z = zipfile.ZipFile(io.BytesIO(get(FAO + 'FoodBalanceSheets_E_All_Data_(Normalized).zip', 400)))
    nm = next(n for n in z.namelist() if 'All_Data' in n and n.endswith('.csv'))
    FB = {'wheat': 'Wheat and products', 'rice': 'Rice and products', 'maize': 'Maize and products', 'soybeans': 'Soyabeans', 'potatoes': 'Potatoes and products', 'cassava': 'Cassava and products', 'sugar-cane': 'Sugar cane', 'coffee': 'Coffee and products'}
    inv = {v: k for k, v in FB.items()}; EL = {'Production': 'prod', 'Import quantity': 'imp', 'Export quantity': 'exp', 'Domestic supply quantity': 'supply', 'Food': 'food', 'Feed': 'feed', 'Processing': 'proc', 'Losses': 'loss', 'Other uses (non-food)': 'other'}
    areas['World'] = 'world'; fb = {}
    with z.open(nm) as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding='latin-1')):
            if r['Area'] in areas and r['Item'] in inv and r['Element'] in EL and r['Value'] and r['Unit'] == '1000 t':
                fb.setdefault(inv[r['Item']], {}).setdefault(areas[r['Area']], {}).setdefault(int(r['Year']), {})[EL[r['Element']]] = float(r['Value']) * 1000
    out['use'] = {c: {a: {'year': max(ys), **ys[max(ys)]} for a, ys in by.items()} for c, by in fb.items()}
    out['fbsItems'] = FB
except Exception as e: out['gaps'].append(f'FAOSTAT: {type(e).__name__}: {e}')
# ---- Energy (OWID)
try:
    rows = list(csv.DictReader(io.StringIO(get('https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv').decode())))
    F = ['coal', 'oil', 'gas', 'nuclear', 'hydro', 'solar', 'wind', 'biofuel', 'other_renewable']
    num = lambda v: float(v) if v not in ('', None) else None
    iso2k = {v[2]: k for k, v in C.items()}; iso2k['World'] = 'world'
    for r in rows:
        k = iso2k.get(r['iso_code']) or (iso2k['World'] if r['country'] == 'World' else None)
        if not k: continue
        e = out['energy'].setdefault(k, {'series': {}, 'latest': {}})
        y = int(r['year'])
        if y < 1990: continue
        for f in ['primary_energy_consumption', 'electricity_generation', 'renewables_share_energy', 'fossil_share_energy', 'energy_per_capita', 'carbon_intensity_elec'] + [x + '_consumption' for x in F] + ['coal_production', 'oil_production', 'gas_production'] + [x + '_electricity' for x in F]:
            v = num(r.get(f))
            if v is not None: e['series'].setdefault(f, []).append([y, round(v, 3)])
    for k, e in out['energy'].items():
        for f, s in e['series'].items(): e['latest'][f] = s[-1]
        e['series'] = {f: s for f, s in e['series'].items() if f in ('primary_energy_consumption', 'electricity_generation', 'renewables_share_energy', 'fossil_share_energy', 'oil_production', 'gas_production', 'coal_production', 'oil_consumption', 'gas_consumption', 'coal_consumption')}
    # world top 10 producers / consumers (countries only)
    lat = {}
    for r in rows:
        if r['iso_code'] and len(r['iso_code']) == 3 and not r['iso_code'].startswith('OWID'):
            for f in ('oil_production', 'gas_production', 'coal_production', 'primary_energy_consumption', 'electricity_generation', 'solar_electricity', 'wind_electricity'):
                v = num(r.get(f))
                if v is not None: lat.setdefault(f, {})[r['country']] = (int(r['year']), v) if int(r['year']) >= lat.get(f, {}).get(r['country'], (0, 0))[0] else lat[f][r['country']]
    out['energyTop'] = {}
    for f, by in lat.items():
        from collections import Counter; cnt = Counter(y for y, _ in by.values()); yr = max(y for y, n in cnt.items() if n >= 0.6 * max(cnt.values())); cur = [(c, v) for c, (y, v) in by.items() if y == yr]
        out['energyTop'][f] = {'year': yr, 'top': [{'name': c, 'value': v} for c, v in sorted(cur, key=lambda x: -x[1])[:10]]}
except Exception as e: out['gaps'].append(f'OWID energy: {type(e).__name__}: {e}')
if out['trade']: json.dump(out, open(os.path.join(HERE, '..', 'src', 'data', 'deep.json'), 'w'), separators=(',', ':'))
print('gaps', out['gaps'], 'agri', list(out['agri']), 'use', list(out.get('use', {})), 'energy', list(out['energy']))
