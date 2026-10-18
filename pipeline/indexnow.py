"""Ping IndexNow (Bing, Yandex, Seznam, Naver) with every sitemap URL after deploy. Usage: python3 pipeline/indexnow.py"""
import re, json, urllib.request
key = re.search(r"INDEXNOW_KEY = '([a-f0-9]+)'", open('src/config/site.ts').read()).group(1)
urls = re.findall(r'<loc>(.*?)</loc>', open('dist/sitemap-0.xml').read())
body = json.dumps({"host": "govpulse.pages.dev", "key": key, "keyLocation": f"https://govpulse.pages.dev/{key}.txt", "urlList": urls}).encode()
r = urllib.request.urlopen(urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'GovPulse-IndexNow/1.0 (+https://govpulse.pages.dev)'}), timeout=30)
print('IndexNow', r.status, len(urls), 'urls')
