"""Fetch + transcode free-licence background videos. Records provenance in src/data/media.json."""
import json, subprocess, os, sys, glob
C = {}
for f in sorted(__import__('glob').glob('/tmp/vid/c[0-9].json')):
    if os.path.exists(f):
        for k, v in json.load(open(f)).items(): C.setdefault(k, []).extend(v)
def find(k, frag):
    return next(x for v in C.values() for x in v if frag in x['title'])
NASA = 'https://images.nasa.gov/details/'
PICK = {
 'earth':        (find('earth','ESA380570'), 75, 'Earth from the ISS (Alexander Gerst timelapses)'),
 'agriculture':  (find('agriculture','Maize Farm'), 8, 'Maize farm'),
 'finance':      (find('finance','Shanghai Bund'), 5, 'Shanghai Lujiazui skyline timelapse'),
 'energy':       (find('energy','Tattendorf'), 6, 'Wind farms, Lower Austria'),
 'healthcare':   (find('healthcare','Laboratory Readiness'), 8, 'Hospital laboratory'),
 'manufacturing':({'title':'Production Begins on Sixth Core Stage Hardware (MAF_20260814_CS6_Ring_Lift_TL)','url':'https://images-assets.nasa.gov/video/MAF_20260814_CS6_Ring_Lift_TL/MAF_20260814_CS6_Ring_Lift_TL~large.mp4','page':NASA+'MAF_20260814_CS6_Ring_Lift_TL','license':'Public domain (NASA media usage guidelines)','licenseUrl':'https://www.nasa.gov/nasa-brand-center/images-and-media/','artist':'NASA / Michoud Assembly Facility'}, 2, 'Rocket hardware assembly, NASA Michoud'),
 'india':        (find('','Timelapse 2025 Kinnaur'), 8, 'Monsoon clouds over Kinnaur, Himachal Pradesh (timelapse)'),
 'india-overview':(find('','Mayapur in N'), 55, 'ISKCON Mayapur, West Bengal, by drone'),
 'india-agriculture':(find('','Munnar road and tea gardens.webm'), 150, 'Tea gardens of Munnar, Kerala'),
 'india-finance':(find('','BSK 6th stage, Bangalore (2024) 01'), 10, 'Aerial view of Bengaluru'),
 'india-energy':(find('','wind turbine near Kunda'), 15, 'Wind turbine by drone'),
 'india-healthcare':(find('','AU700 chemistry analyzer'), 1, 'Clinical chemistry analyzer in a lab'),
 'india-wellness':(find('','Espaço Funcional Naval'), 26, 'Functional fitness centre'),
 'india-manufacturing':(find('','Vicart - Aciérie'), 5, 'Steel works'),
 'uk':           (find('uk','Aerial footage of London'), 60, 'Aerial footage of London'),
 'indonesia':    (find('indonesia','Aerial view of Jakarta'), 30, 'Aerial view of Jakarta'),
 'brazil':       (find('brazil','Brasilia 58'), 20, 'Brasília'),
}
only = sys.argv[1:] or PICK.keys()
meta = json.load(open('src/data/media.json')) if os.path.exists('src/data/media.json') else {}
for k in only:
    x, ss, label = PICK[k]
    if isinstance(ss, str): ss = float(ss)
    o = f'public/media/{k}'
    vf = "scale='min(1280,iw)':-2:flags=lanczos,fps=24"
    base = ['ffmpeg','-y','-loglevel','error','-ss',str(ss),'-t','12','-i',x['url'],'-an','-vf',vf]
    subprocess.run(base+['-c:v','libvpx-vp9','-b:v','1400k','-crf','40','-row-mt','1','-deadline','good','-cpu-used','4',o+'.webm'],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',o+'.webm','-c:v','libx264','-preset','slow','-crf','28','-maxrate','1600k','-bufsize','3200k','-pix_fmt','yuv420p','-movflags','+faststart','-an',o+'.mp4'],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','1','-i',o+'.webm','-frames:v','1','-vf','scale=1280:-2','-c:v','libwebp','-quality','62',o+'.webp'],check=True)
    sz = {e: round(os.path.getsize(f'{o}.{e}')/1e6,2) for e in ['webm','mp4','webp']}
    meta[k] = {'label':label,'type':'video','title':x['title'].replace('File:',''),'author':x.get('artist') or 'Unknown','license':x['license'],'licenseUrl':x.get('licenseUrl',''),'source':x['page'],'clip':f'{ss}s–{ss+12}s, re-encoded 1280px, no audio','files':{e:f'/media/{k}.{e}' for e in ['webm','mp4','webp']},'sizeMB':sz}
    print(k, sz)
json.dump(meta, open('src/data/media.json','w'), indent=1, ensure_ascii=False)
