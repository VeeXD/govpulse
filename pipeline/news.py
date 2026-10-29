"""Free live headlines: Google News RSS + GDELT DOC 2.0 + official RSS feeds.
Stores only headline, source, time, URL, category (never article text).
Keeps the last good data per country if a run returns too little."""
import json, re, time, html, hashlib, urllib.request, urllib.parse, email.utils, datetime as dt
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'src/data/news.json'
UA = {'User-Agent': 'GovPulseNewsBot/1.0 (+https://govpulse.pages.dev/news/)'}
KEEP, MIN_OK = 50, 8
C = {
 'india': ('India', 'IN', 'en-IN', 'IN'), 'usa': ('United States', 'US', 'en-US', 'US'),
 'china': ('China', 'US', 'en-US', 'CH'), 'uk': ('United Kingdom', 'GB', 'en-GB', 'UK'),
 'germany': ('Germany', 'DE', 'en-US', 'GM'), 'japan': ('Japan', 'US', 'en-US', 'JA'),
 'brazil': ('Brazil', 'US', 'en-US', 'BR'), 'indonesia': ('Indonesia', 'ID', 'en-ID', 'ID'),
 'nigeria': ('Nigeria', 'NG', 'en-NG', 'NI'), 'uae': ('United Arab Emirates', 'AE', 'en-AE', 'AE'),
}
TOPICS = {
 'politics': '{n} (government OR parliament OR election OR minister OR policy)',
 'business': '{n} (business OR markets OR trade OR industry)',
 'companies': '{n} (company OR earnings OR shares OR startup OR CEO)',
 'trends': '{n} (economy OR inflation OR GDP OR "central bank" OR "interest rate")',
}
OFFICIAL = {
 'india': [('https://www.rbi.org.in/pressreleases_rss.xml', 'Reserve Bank of India', 'trends')],
 'usa': [('https://www.federalreserve.gov/feeds/press_all.xml', 'Federal Reserve', 'trends'),
         ('https://www.whitehouse.gov/news/feed/', 'The White House', 'politics')],
 'uk': [('https://www.bankofengland.co.uk/rss/news', 'Bank of England', 'trends')],
 'germany': [('https://www.ecb.europa.eu/rss/press.html', 'European Central Bank', 'trends')],
}

def get(url, t=20):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t) as r: return r.read()

def iso(s):
    try: return email.utils.parsedate_to_datetime(s).astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception: pass
    try: return dt.datetime.fromisoformat(s.replace('Z', '+00:00')).astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception: return None

def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()[:220]

def rss(url, src=None, cat='business', gnews=False):
    out = []
    root = ET.fromstring(get(url))
    for it in root.iter():
        tag = it.tag.split('}')[-1]
        if tag not in ('item', 'entry'): continue
        f = {c.tag.split('}')[-1]: c for c in it}
        title = clean(f['title'].text if 'title' in f else '')
        link = f.get('link'); link = (link.text or link.get('href')) if link is not None else None
        de = next((f[k] for k in ('pubDate', 'published', 'updated', 'date') if k in f), None)
        when = iso(de.text or '') if de is not None else None
        s = src
        if gnews:
            s = clean(f['source'].text) if 'source' in f else None
            if s and title.endswith(' - ' + s): title = title[: -len(s) - 3]
        if title and link and link.startswith('https://') and when:
            out.append({'title': title, 'source': s or 'Unknown', 'time': when, 'url': link.strip(), 'category': cat})
    return out

def gdelt(name, fips):
    q = urllib.parse.quote(f'sourcecountry:{fips} sourcelang:english (economy OR government OR business)')
    d = json.loads(get(f'https://api.gdeltproject.org/api/v2/doc/doc?query={q}&mode=artlist&format=json&maxrecords=40&timespan=1d&sort=datedesc', 30) or b'{}')
    out = []
    for a in d.get('articles', []):
        t = a.get('seendate', '')
        try: when = dt.datetime.strptime(t, '%Y%m%dT%H%M%SZ').strftime('%Y-%m-%dT%H:%M:%SZ')
        except Exception: continue
        if a.get('url', '').startswith('https://') and a.get('title'):
            out.append({'title': clean(a['title']), 'source': a.get('domain', 'Unknown'), 'time': when, 'url': a['url'], 'category': 'trends'})
    return out

def norm(t): return re.sub(r'[^a-z0-9]', '', t.lower())[:80]

def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {'countries': {}}
    now = dt.datetime.now(dt.timezone.utc); cutoff = now - dt.timedelta(days=7)
    res, sources = {}, set()
    for cid, (name, gl, hl, fips) in C.items():
        items = []
        for cat, q in TOPICS.items():
            u = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({'q': q.format(n=f'"{name}"') + ' when:2d', 'hl': hl, 'gl': gl, 'ceid': f'{gl}:{hl.split("-")[0]}'})
            try: items += [dict(x, via='Google News') for x in rss(u, cat=cat, gnews=True)[:20]]
            except Exception as e: print(cid, cat, 'gnews fail', e)
        for url, src, cat in OFFICIAL.get(cid, []):
            try: items += [dict(x, via='Official') for x in rss(url, src, cat)[:10]]
            except Exception as e: print(cid, src, 'fail', e)
        try: items += [dict(x, via='GDELT') for x in gdelt(name, fips)[:15]]
        except Exception as e: print(cid, 'gdelt fail', e)
        time.sleep(8)  # GDELT asks for <=1 request / 5s
        seen, uniq = set(), []
        for x in sorted(items, key=lambda x: x['time'], reverse=True):
            k = norm(x['title'])
            if k in seen or x['time'] < cutoff.strftime('%Y-%m-%dT%H:%M:%SZ') or x['time'] > (now + dt.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ'): continue
            seen.add(k); x['id'] = hashlib.sha1(x['url'].encode()).hexdigest()[:10]; uniq.append(x)
        # balance categories so one topic cannot crowd out the rest
        by = {}
        for x in uniq: by.setdefault(x['category'], []).append(x)
        pick = []
        while len(pick) < KEEP and any(by.values()):
            for k in list(by):
                if by[k] and len(pick) < KEEP: pick.append(by[k].pop(0))
        pick.sort(key=lambda x: x['time'], reverse=True)
        if len(pick) >= MIN_OK: res[cid] = pick
        else:
            print(cid, 'only', len(pick), '-> keeping last good'); res[cid] = old['countries'].get(cid, pick)
        sources.update(x['via'] for x in res[cid])
        print(cid, len(res[cid]))
    if sum(len(v) for v in res.values()) < MIN_OK * 3 and old['countries']:
        print('run too thin, keeping previous file'); return
    OUT.write_text(json.dumps({'generated': now.strftime('%Y-%m-%dT%H:%M:%SZ'), 'via': sorted(sources), 'countries': res}, ensure_ascii=False, separators=(',', ':')))

if __name__ == '__main__': main()
