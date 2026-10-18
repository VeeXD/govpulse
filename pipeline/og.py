"""Generate OG images (1200x630) + PWA icons from real photos (grayscale) and Fira Sans."""
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import json
F='/usr/share/fonts/truetype/sand-box/google/Fira Sans/FiraSans-'
thin=lambda s: ImageFont.truetype(F+'ExtraLight.ttf',s); reg=lambda s: ImageFont.truetype(F+'Regular.ttf',s); semi=lambda s: ImageFont.truetype(F+'SemiBold.ttf',s)
C={'india':'India','usa':'United States','china':'China','uk':'United Kingdom','germany':'Germany','japan':'Japan','brazil':'Brazil','indonesia':'Indonesia','nigeria':'Nigeria','uae':'United Arab Emirates'}
def card(bg, title, sub, out):
    im=ImageOps.fit(ImageOps.grayscale(Image.open(bg)).convert('RGB'),(1200,630)) if bg else Image.new('RGB',(1200,630),'#0A0A0A')
    ov=Image.new('L',(1200,630)); d=ImageDraw.Draw(ov)
    for y in range(630): d.line([(0,y),(1200,y)],fill=int(110+120*y/630))
    im=Image.composite(Image.new('RGB',(1200,630),'#0A0A0A'),im,ov)
    d=ImageDraw.Draw(im)
    d.text((64,60),'GOVPULSE',font=semi(26),fill='#FFFFFF',spacing=8)
    size=150 if len(title)<12 else 96
    d.text((60,600-size-110),title.upper(),font=thin(size),fill='#FFFFFF')
    d.text((64,540),sub,font=reg(30),fill='#D4D4D4')
    im.save(out,optimize=True)
card('public/media/earth.webp','The Economic Pulse','Country-first economic dashboards by industry. Every number sourced.','public/og/default.png')
for c,n in C.items(): card(f'public/heroes/{c}-m.webp',n,f'{n}: GDP, inflation and industry KPIs from the World Bank','public/og/'+c+'.png')
for s in [180,192,512]:
    im=Image.new('RGB',(s,s),'#0A0A0A'); d=ImageDraw.Draw(im); w=max(3,s//14)
    pts=[(x*s/32,y*s/32) for x,y in [(5,18),(10,18),(13,10),(18,24),(21,18),(27,18)]]
    d.line(pts,fill='#FFFFFF',width=w,joint='curve'); im.save(f'public/icons/icon-{s}.png')
print('ok')
