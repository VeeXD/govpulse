import json,urllib.request,urllib.parse,re,sys
UA={'User-Agent':'GovPulse/0.1 (govpulse-mvp)'}
def api(p): return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({**p,'format':'json'}),headers=UA),timeout=60))
Q=json.loads(sys.argv[1]); out={}
for k,qs in Q.items():
  res=[]
  for q in qs:
    r=api({'action':'query','generator':'search','gsrsearch':f'filetype:video {q}','gsrnamespace':6,'gsrlimit':15,'prop':'imageinfo','iiprop':'url|size|extmetadata|mediatype'})
    for pg in r.get('query',{}).get('pages',{}).values():
      ii=pg['imageinfo'][0];m=ii.get('extmetadata',{});lic=m.get('LicenseShortName',{}).get('value','')
      if 'NC' in lic or 'ND' in lic or not re.match(r'^(cc0|cc[- ]by|public domain|pd)',lic,re.I): continue
      if ii.get('width',0)<1200: continue
      res.append({'title':pg['title'],'url':ii['url'],'page':ii['descriptionurl'],'license':lic,'licenseUrl':m.get('LicenseUrl',{}).get('value',''),'artist':re.sub('<[^>]+>','',m.get('Artist',{}).get('value','')).strip()[:100],'w':ii.get('width'),'h':ii.get('height'),'dur':ii.get('duration'),'size':ii.get('size')})
  seen=set();out[k]=[x for x in res if not (x['title'] in seen or seen.add(x['title']))][:8]
  print(k);[print('  ',round(x['size']/1e6),'MB',x['w'],x['dur'] and round(float(x['dur'])),x['license'],x['title'][:90]) for x in out[k]]
json.dump(out,open('/tmp/vid/cands.json','w'),indent=1)
