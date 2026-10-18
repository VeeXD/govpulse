import json,urllib.request,urllib.parse,re,sys
UA={'User-Agent':'GovPulse/0.1 (contact: govpulse-mvp)'}
Q={"india":"Red Fort Delhi","usa":"United States Capitol west front","uk":"Palace of Westminster","germany":"Reichstag building Berlin","japan":"National Diet Building","china":"Great Hall of the People","brazil":"National Congress of Brazil","indonesia":"MPR DPR building Jakarta","nigeria":"National Assembly Abuja","uae":"Qasr Al Watan"}
OK=re.compile(r'^(cc0|cc[- ]by|public domain|pd)',re.I)
def api(p):
  u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({**p,'format':'json'})
  return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60))
out={}
for c,q in Q.items():
  r=api({'action':'query','generator':'search','gsrsearch':f'filetype:bitmap {q}','gsrnamespace':6,'gsrlimit':25,'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':2400})
  cands=[]
  for pg in r.get('query',{}).get('pages',{}).values():
    ii=pg['imageinfo'][0]; m=ii.get('extmetadata',{})
    lic=m.get('LicenseShortName',{}).get('value','')
    if not OK.match(lic) or 'NC' in lic or 'ND' in lic: continue
    if ii['width']<2000 or ii['width']<ii['height']*1.2: continue
    cands.append((pg.get('index',99),pg['title'],ii,lic,m))
  cands.sort(key=lambda x:x[0])
  print(c,[x[1] for x in cands[:6]])
  out[c]=[{'title':t,'thumb':ii['thumburl'],'page':ii['descriptionurl'],'license':lic,'licenseUrl':m.get('LicenseUrl',{}).get('value',''),'artist':re.sub('<[^>]+>','',m.get('Artist',{}).get('value','')).strip(),'w':ii['width']} for _,t,ii,lic,m in cands[:6]]
json.dump(out,open('pipeline/hero_candidates.json','w'),indent=1)
