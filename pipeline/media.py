"""Fetch + transcode free-licence background videos. Records provenance in src/data/media.json."""
import json, subprocess, os, sys, glob
C = {}
for f in ['/tmp/vid/c1.json','/tmp/vid/c2.json','/tmp/vid/c3.json']:
    if os.path.exists(f):
        for k, v in json.load(open(f)).items(): C.setdefault(k, []).extend(v)
def find(k, frag):
    return next(x for x in C[k] if frag in x['title'])
NASA = 'https://images.nasa.gov/details/'
PICK = {
 'earth':        (find('earth','ESA380570'), 75, 'Earth from the ISS (Alexander Gerst timelapses)'),
 'agriculture':  (find('agriculture','Maize Farm'), 8, 'Maize farm'),
 'finance':      (find('finance','Shanghai Bund'), 5, 'Shanghai Lujiazui skyline timelapse'),
 'energy':       (find('energy','Tattendorf'), 6, 'Wind farms, Lower Austria'),
 'healthcare':   (find('healthcare','Laboratory Readiness'), 8, 'Hospital laboratory'),
 'manufacturing':({'title':'Production Begins on Sixth Core Stage Hardware (MAF_20260814_CS6_Ring_Lift_TL)','url':'https://images-assets.nasa.gov/video/MAF_20260814_CS6_Ring_Lift_TL/MAF_20260814_CS6_Ring_Lift_TL~large.mp4','page':NASA+'MAF_20260814_CS6_Ring_Lift_TL','license':'Public domain (NASA media usage guidelines)','licenseUrl':'https://www.nasa.gov/nasa-brand-center/images-and-media/','artist':'NASA / Michoud Assembly Facility'}, 2, 'Rocket hardware assembly, NASA Michoud'),
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
    subprocess.run(base+['-c:v','libvpx-vp9','-b:v','0','-crf','44','-row-mt','1','-deadline','good','-cpu-used','4',o+'.webm'],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',o+'.webm','-c:v','libx264','-preset','slow','-crf','30','-pix_fmt','yuv420p','-movflags','+faststart','-an',o+'.mp4'],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','1','-i',o+'.webm','-frames:v','1','-vf','scale=1280:-2','-c:v','libwebp','-quality','62',o+'.webp'],check=True)
    sz = {e: round(os.path.getsize(f'{o}.{e}')/1e6,2) for e in ['webm','mp4','webp']}
    meta[k] = {'label':label,'type':'video','title':x['title'].replace('File:',''),'author':x.get('artist') or 'Unknown','license':x['license'],'licenseUrl':x.get('licenseUrl',''),'source':x['page'],'clip':f'{ss}s–{ss+12}s, re-encoded 1280px, no audio','files':{e:f'/media/{k}.{e}' for e in ['webm','mp4','webp']},'sizeMB':sz}
    print(k, sz)
json.dump(meta, open('src/data/media.json','w'), indent=1, ensure_ascii=False)
