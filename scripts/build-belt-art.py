"""Pose-fitted additive pixel equipment; never modifies Judah's base atlases.

Coordinates are logical atlas pixels, authored against each existing waist.
Only sparse transparent belt atlases are shipped, not new armored characters.
"""
from pathlib import Path
from math import hypot
import hashlib,json
from PIL import Image, ImageDraw, ImageChops

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets/armor'
OUT.mkdir(exist_ok=True)
RANKS=['novice','student','scholar','scribe','master']
report={}
READY=[(40,122,63,122),(40,122,63,122),(40,122,63,122),(41,123,64,122),(40,122,63,122),(40,122,63,122)]
SLASH=[(40,121,62,121),(39,122,64,122),(41,119,63,122),(42,123,66,123),(41,124,64,126),READY[0]]
WALK=[(40,119,62,120),(40,117,62,121),(40,119,63,122),(39,121,62,123),(40,120,63,123),(39,120,63,123)]
RUN=[(39,123,62,124),(40,121,63,125),(41,122,64,126),(40,120,63,125),(39,121,63,125),(40,120,64,125)]
VICTORY=[READY[0],(42,124,65,126),(44,122,67,124),(44,125,68,126),(44,126,67,129),(42,126,65,127)]
RECOIL={
 'novice':[(40,121,63,120),(40,116,63,111),(43,130,63,130),(43,121,65,124),(40,122,63,121),READY[0]],
 'student':[(40,121,63,120),(40,116,64,111),(43,129,63,129),(43,123,65,126),(40,122,63,121),READY[0]],
 'scholar':[(40,121,63,120),(40,115,63,111),(43,129,63,129),(43,122,65,125),(40,122,63,121),READY[0]],
 'scribe':[(40,121,63,120),(40,115,64,111),(43,129,64,129),(43,122,65,125),(40,122,63,121),READY[0]],
 'master':[(40,120,63,122),(40,117,64,111),(43,128,64,128),(43,121,65,125),(40,122,63,121),READY[0]]}
PORTRAITS=[[(33,79,62,79),(33,79,62,79),(33,79,62,79),(33,79,62,79),(33,79,62,79)],
 [(33,80,62,80),(33,80,62,80),(33,80,62,80),(33,80,62,80),(33,80,62,80)],
 [(33,85,62,85),(33,85,62,85),(33,85,62,85),(33,85,62,85),(33,85,62,85)],
 [(33,96,62,96),(33,96,62,96),(33,96,62,96),(33,96,62,96),(33,96,62,96)]]

def belt(size,line,source=None):
    im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    x,y,xx,yy=[v*2 for v in line];length=hypot(xx-x,yy-y);u=((xx-x)/length,(yy-y)/length);n=(-u[1],u[0])
    def panel(a,b,half,color):
        pts=[(round(x+u[0]*s+n[0]*h),round(y+u[1]*s+n[1]*h)) for s,h in [(a,-half),(b,-half),(b,half),(a,half)]]
        d.polygon(pts,fill=color)
    panel(0,length,6,'#211c21');panel(1,length-1,5,'#b98b43');panel(2,length-2,3,'#24605d');panel(3,length-3,1,'#43847b')
    for s in range(5,int(length)-3,8):
        px=round(x+u[0]*s+n[0]*-4);py=round(y+u[1]*s+n[1]*-4);d.rectangle((px,py,px+1,py+1),fill='#f0d496')
    center=length*.58
    panel(center-6,center+6,7,'#34262b');panel(center-5,center+5,6,'#efce87');panel(center-3,center+3,4,'#94602e');panel(center-2,center+2,3,'#70c7b9')
    d.point((round(x+u[0]*center),round(y+u[1]*center)-2),fill='#fff2c6')
    if source:
        # Preserve the existing silhouette and the blue/steel blade crossing the waist.
        mask=source.getchannel('A').copy();pixels=source.load();m=mask.load()
        for sy in range(max(0,min(y,yy)-10),min(size[1],max(y,yy)+11)):
            for sx in range(max(0,min(x,xx)-10),min(size[0],max(x,xx)+11)):
                r,g,b,a=pixels[sx,sy]
                if b>=r and g>=r*.85:m[sx,sy]=0
        im.putalpha(ImageChops.multiply(im.getchannel('A'),mask))
    return im

for stage,rank in enumerate(RANKS):
    for action in [False,True]:
        w,h,count=(256,352,54) if action else (192,320,16)
        source=Image.open(ROOT/f'dist/assets/console/judah-{rank}{"-adventure" if action else ""}.png').convert('RGBA')
        atlas=Image.new('RGBA',(w*count,h));frames=[]
        rows=[READY[1:]+READY[:1],READY,SLASH,VICTORY,RECOIL[rank],WALK,RUN,VICTORY,VICTORY]
        for frame in range(count):
            line=rows[frame//6][frame%6] if action else PORTRAITS[frame//4][stage]
            if not action and frame%4==2:line=(line[0],line[1]-1,line[2],line[3]-1)
            original=source.crop((frame*w,0,(frame+1)*w,h))
            overlay=belt((w,h),line,original)
            # Foreground weapon arms cross the waist in these whole-body poses.
            # Their original pixels must remain in front of the new belt.
            if action and frame in [14,38,41]:
                occlusion=ImageDraw.Draw(overlay)
                points={14:[(52,113),(76,121),(77,130),(58,126)],38:[(56,116),(72,117),(72,128),(58,128)],41:[(49,115),(66,115),(67,128),(51,128)]}[frame]
                occlusion.polygon([(x*2,y*2) for x,y in points],fill=(0,0,0,0))
            # Authored recovery uses the first guard, including its belt.
            assert overlay.getbbox(),(rank,frame)
            frames.append({'bounds':overlay.getbbox(),'hash':hashlib.sha256(overlay.tobytes()).hexdigest()})
            atlas.alpha_composite(overlay,(frame*w,0))
        atlas.quantize(colors=32,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(OUT/f'belt-{rank}{"-adventure" if action else ""}.png',optimize=True)
        base=f'judah-{rank}{"-adventure" if action else ""}.png'
        report[base]={'sourceHash':hashlib.sha256((ROOT/'dist/assets/console'/base).read_bytes()).hexdigest(),'frames':frames}

# A larger standalone award icon, matching the worn leather/teal/gold palette.
icon=belt((128,64),(7,16,57,16)).resize((256,128),Image.Resampling.NEAREST)
icon.save(OUT/'belt-icon.png',optimize=True)
(ROOT/'art/judah/belt-fit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
