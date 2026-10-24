"""Original three-quarter action poses and separate parallax planes.
Integer-coordinate raster authoring; never rotates the existing front sprite.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import math, random, runpy
base=runpy.run_path(str(Path(__file__).with_name('build-pixel-art.py')))
OUT=base['OUT'];SKIN=base['SKIN'];PALETTES=base['PALETTES'];GOLD=base['GOLD'];INK=base['INK']
STATES=['stance','ready','slash','celebrate','recoil','walk','run','victory','transform']

def action_sprite(stage,state,f):
 im=Image.new('RGBA',(128,176));d=ImageDraw.Draw(im);c=PALETTES[stage];g=GOLD if stage>=2 else PALETTES[stage]
 stride=[-5,-2,3,5,2,-3][f];bob=[0,-1,-1,0,1,1][f]
 if state=='run':bob=[0,-3,-2,0,-3,-2][f]
 if state not in ['walk','run']:bob=[0,0,-1,-1,0,0][f]
 lean=[0,-2,-5,-4,-2,0][f] if state=='recoil' else [0,1,4,5,2,0][f] if state=='slash' else 0
 ox=lean;oy=bob
 def p(pts,col):d.polygon([(round(x+ox),round(y+oy)) for x,y in pts],fill=col)
 def r(b,col):x,y,a,z=b;d.rectangle((x+ox,y+oy,a+ox,z+oy),fill=col)
 def limb(a,b,z,width,col,light):
  pts=[(round(x+ox),round(y+oy)) for x,y in [a,b,z]];d.line(pts,fill=INK,width=width+3,joint='curve');d.line(pts,fill=col,width=width,joint='curve');d.line([(x-2,y-1) for x,y in pts],fill=light,width=max(2,width//3),joint='curve')
 d.ellipse((26,164,95,169),fill='#080d1c80')
 # Swinging legs have independent bent knees and planted/lifted feet.
 if state in ['walk','run']:
  amp=1.7 if state=='run' else 1;shift=round(stride*amp)
  legs=[((52,117),(49+shift,140),(47+shift*2,161-abs(shift)//2)),((66,117),(65-shift,139),(71-shift*2,162-abs(shift)//3))]
 else:
  legs=[((51,116),(47,141),(39,163)),((65,117),(72,139),(82,162))]
 for a,b,z in legs:
  limb(a,b,z,10,'#373440','#6b5a53');x,y=z
  p([(x-5,y-13),(x+5,y-13),(x+5,y-3),(x+12,y),(x+11,y+4),(x-7,y+4)],INK)
  p([(x-4,y-12),(x+3,y-12),(x+3,y-2),(x+10,y+1),(x+9,y+2),(x-5,y+2)],'#634535');r((x-4,y+2,x+9,y+2),'#c29b66')
  for yy in [y-10,y-7,y-4]:r((x-2,yy,x+3,yy),'#a78658')
 # Far arm behind torso, differentiated by darker shadow planes.
 armSwing=stride if state in ['walk','run'] else 0
 limb((50,62),(42-armSwing,85),(46-armSwing,105),9,c[0],c[1]);r((42-armSwing,102,48-armSwing,111),SKIN[1]);r((43-armSwing,103,45-armSwing,109),SKIN[3])
 hem=124 if stage<2 else 141
 # Three-quarter torso: unequal shoulder widths, side seam and angled belt.
 p([(48,55),(58,49),(68,51),(77,58),(79,83),(73,100),(81,hem),(60,hem+3),(41,hem-1),(46,97),(43,71)],INK)
 p([(49,58),(58,53),(66,54),(73,61),(74,85),(68,98),(76,hem-3),(59,hem),(45,hem-4),(51,96),(47,75)],c[1])
 p([(51,60),(59,57),(66,58),(68,72),(63,94),(54,96),(50,82)],c[2]);p([(52,62),(57,59),(57,77),(54,87),(51,81)],c[3]);p([(66,60),(72,64),(72,86),(67,95),(64,90)],c[0])
 p([(52,101),(58,100),(54,hem-5),(48,hem-5)],c[2]);p([(63,101),(67,99),(72,hem-5),(62,hem-3)],c[2]);p([(58,105),(61,100),(59,hem-4),(56,hem-5)],c[0])
 for x,y in [(53,68),(52,73),(60,88),(50,112),(65,119),(67,129)]:r((x,y,x+1,y+3),c[3])
 p([(49,96),(72,93),(73,99),(49,103)],'#3b2b2b');p([(50,96),(72,94),(72,95),(50,98)],'#b49363');r((62,95,68,101),g[3]);r((64,97,66,99),'#44312b')
 p([(68,102),(72,101),(72,122),(68,127),(66,124)],'#755336');r((69,105,70,120),'#bda271')
 p([(54,55),(60,52),(64,57),(67,53),(71,56),(65,66),(60,66)],c[0]);p([(56,56),(60,55),(63,61),(61,63)],c[4])
 if stage:
  p([(48,57),(52,56),(72,93),(68,96)],g[0]);p([(49,58),(51,58),(70,93),(68,94)],g[2]);r((57,70,59,73),g[4])
 if stage>=2:
  p([(44,61),(48,58),(49,96),(44,hem-4),(40,hem-4)],c[0]);p([(45,63),(47,62),(46,95),(42,hem-5)],c[2])
  r((44,105,47,122),'#513c42');r((45,107,47,118),'#d7c59d')
 if stage>=3:
  p([(71,55),(77,59),(80,129),(83,140),(75,144),(71,98)],c[0]);p([(74,59),(76,62),(76,100),(81,139),(78,140)],c[2])
  for y in range(70,139,7):r((76 if y<115 else 78,y,77 if y<115 else 79,y+2),g[3])
  r((47,103,50,125),'#d3bf92');r((46,102,51,105),'#fff0c6')
 if stage==4:
  p([(48,56),(55,50),(63,59),(70,52),(77,58),(73,74),(64,67),(53,73)],'#302842');p([(50,57),(55,54),(63,64),(53,69)],'#77608d');p([(70,55),(75,59),(72,69),(65,64)],'#56476c')
  p([(51,55),(54,53),(63,62),(70,54),(73,56),(64,67)],g[3]);r((63,62,66,66),'#a1e6d2')
 for x in range(47,76,4):r((x,hem-4,x+1,hem-4),g[2])
 # Near forearm explicitly redraws at every action frame.
 if state=='slash':
  elbows=[(81,81),(83,72),(88,70),(91,81),(86,89),(80,82)]
  hands=[(79,91),(87,62),(80,71),(85,92),(90,103),(78,91)]
 elif state in ['victory','transform']:
  elbows=[(81,77),(83,65),(82,56),(80,51),(78,51),(78,50)]
  hands=[(82,81),(88,67),(87,60),(83,55),(81,53),(81,52)]
 elif state=='celebrate':
  elbows=[(78,82),(78,77),(80,72),(80,72),(79,77),(79,82)];hands=[(75,87),(77,77),(82,64),(82,64),(79,77),(77,88)]
 elif state=='recoil':
  elbows=[(81,84),(76,88),(73,93),(75,91),(78,87),(80,83)];hands=[(80,90),(77,99),(72,105),(74,103),(77,96),(78,90)]
 elif state in ['walk','run']:
  elbows=[(79+armSwing,82)]*6;hands=[(79+armSwing*2,105-abs(armSwing))]*6
 else:
  elbows=[(79,82+bob)]*6;hands=[(79,89+bob)]*6
 elbow=elbows[f];hand=hands[f]
 limb((71,61),elbow,hand,10,c[1],c[3]);hx,hy=hand
 p([(hx-4,hy-4),(hx+2,hy-5),(hx+5,hy-2),(hx+5,hy+3),(hx+1,hy+6),(hx-4,hy+3)],SKIN[1]);r((hx-2,hy-3,hx+2,hy),SKIN[4]);r((hx-1,hy+2,hx+3,hy+2),SKIN[2])
 # Distinct 3/4 face; foreshortened far eye, visible ear, nose projects right.
 headDrop=[0,1,3,3,1,0][f] if state=='recoil' else 0
 head=Image.new('RGBA',(128,176));hd=ImageDraw.Draw(head)
 def hp(pts,col):hd.polygon([(x,y+headDrop) for x,y in pts],fill=col)
 def hr(b,col):x,y,a,z=b;hd.rectangle((x,y+headDrop,a,z+headDrop),fill=col)
 p([(55,42),(67,41),(67,54),(62,59),(56,54)],SKIN[0]);p([(58,44),(65,44),(65,53),(61,55),(58,52)],SKIN[3])
 hp([(50,19),(57,13),(67,15),(74,23),(73,31),(78,35),(74,38),(72,46),(65,51),(56,47),(51,40)],INK)
 hp([(54,22),(59,18),(66,19),(71,24),(70,31),(75,35),(71,37),(70,44),(64,47),(57,44),(53,36)],SKIN[2])
 hp([(56,23),(61,21),(67,23),(67,31),(63,34),(57,33),(55,29)],SKIN[3]);hp([(58,24),(62,22),(66,24),(62,26),(57,27)],SKIN[4])
 hp([(68,27),(70,28),(69,32),(74,35),(70,36),(67,34)],SKIN[4]);hr((69,33,71,34),SKIN[5]);hp([(54,34),(58,35),(62,37),(60,40),(56,39)],SKIN[4])
 hr((57,29,61,30),SKIN[0]);hr((65,28,70,29),SKIN[0]);hr((59,31,61,31),'#e1c89f');hr((66,30,69,31),'#e1c89f');hr((60,31,61,32),'#181924');hr((68,30,69,31),'#181924')
 if f==5 and state in ['stance','ready']:hr((57,31,61,32),SKIN[1]);hr((65,30,70,31),SKIN[1])
 hp([(55,39),(60,41),(66,40),(71,38),(70,45),(65,49),(59,47),(55,44)],'#3b292c');hr((63,41,68,41),SKIN[1]);hr((63,42,67,42),SKIN[4]);hr((61,46,65,46),'#825237')
 hr((51,30,54,37),SKIN[1]);hr((52,31,53,34),SKIN[4])
 hp([(48,22),(49,15),(55,11),(64,10),(70,13),(73,19),(71,25),(66,23),(63,19),(58,20),(54,25),(52,39),(50,51),(46,49),(47,35)],'#191923')
 for x,y,h in [(48,23,25),(51,18,17),(55,14,10),(59,12,8),(63,13,8),(67,15,8)]:hr((x,y,x+2,y+h),'#302b31');hr((x,y+2,x,y+h-3),'#51403b');hr((x+1,y+5,x+2,y+6),'#6c5141')
 hr((48,43,50,45),'#b09463');hr((52,37,54,47),'#3e3032')
 im.alpha_composite(head,(ox,oy))
 # Rank-specific sword is drawn in-hand; only its geometry turns, never Judah.
 angle=([-68,-112,-35,48,60,-68][f] if state=='slash' else -92 if state in ['victory','transform'] else -70 if state=='celebrate' else 58 if state in ['walk','run'] else -45 if state=='recoil' else -23 if state=='stance' else -68)
 a=math.radians(angle);ux,uy=math.cos(a),math.sin(a);vx,vy=-uy,ux
 def weapon(points,col):p([(hx+u*ux+v*vx,hy+u*uy+v*vy) for u,v in points],col)
 weapon([(-7,-3),(8,-3),(8,-5),(42,-3),(48,0),(42,3),(8,5),(8,3),(-7,3)],INK)
 blade=['#8b9da6','#a7c3cb','#b6dcd9','#c2e9e0','#e9f5da'][stage]
 weapon([(8,-3),(41,-2),(46,0),(41,2),(8,3)],blade);weapon([(9,-3),(41,-2),(45,0),(9,0)],'#eef1d6');weapon([(10,1),(40,1),(42,0),(11,3)],'#4d8597')
 weapon([(3,-9),(7,-9),(8,-4),(8,4),(7,9),(3,9),(4,2),(4,-2)],g[2]);weapon([(3,-9),(5,-9),(6,7),(4,8)],g[4]);weapon([(-7,-2),(3,-2),(3,2),(-7,2)],'#63475b')
 for u in [-5,-2,1]:weapon([(u,-2),(u+1,-2),(u+1,2),(u,2)],g[3])
 if stage>=3:weapon([(25,-1),(27,-1),(27,1),(25,1)],'#fff6ca')
 if state=='transform':
  for i in range(8):
   x=26+(i*19+f*7)%76;y=28+(i*23-f*9)%122;r((x,y,x+1,y+1),GOLD[3 if i%2 else 4])
 return im

for stage,name in enumerate(['novice','student','scholar','scribe','master']):
 sheet=Image.new('RGBA',(128*54,176))
 for i,state in enumerate(STATES):
  for f in range(6):sheet.alpha_composite(action_sprite(stage,state,f),((i*6+f)*128,0))
 sheet.save(OUT/f'judah-{name}-adventure.png',optimize=True)

# Nonviolent light crescent strip: follows a sword arc against symbolic barriers.
sheet=Image.new('RGBA',(128*6,112))
for f in range(6):
 im=Image.new('RGBA',(128,112));d=ImageDraw.Draw(im)
 arcs=[[(41,10),(75,8),(104,25),(117,54),(111,80),(92,96),(101,75),(100,50),(81,27)],[(30,12),(74,7),(107,25),(123,57),(117,84),(91,103),(109,76),(108,51),(85,26)]]
 if f<5:
  d.polygon(arcs[f%2],fill=['#5ba9bf','#9be9da','#f4ffe0','#d9f9ca','#6ab9c4'][f]);d.line([(69,13),(96,30),(112,57),(105,82)],fill='#ffffe9',width=3)
  for i in range(8):
   x=75+(i*17+f*4)%49;y=12+(i*23+f*9)%83;d.rectangle((x,y,x+1,y+1),fill='#f7e9ac')
 sheet.alpha_composite(im,(f*128,0))
sheet.save(OUT/'slash.png',optimize=True)

# Shared gate frame and separate door halves, so opening does not fake a new world.
gate=Image.new('RGBA',(128,160));d=ImageDraw.Draw(gate)
for x in [7,105]:
 d.rectangle((x,30,x+16,153),fill='#34394d');d.rectangle((x,30,x+3,153),fill='#b9a087');d.rectangle((x+4,30,x+9,153),fill='#75687a')
 for y in range(36,153,15):d.line((x,y,x+16,y),fill='#d1b18d');d.line((x,y+2,x+16,y+2),fill='#2c3044')
 d.rectangle((x-4,148,x+20,157),fill='#b6a083');d.rectangle((x-4,148,x+20,150),fill='#f2d6a0')
d.rectangle((3,24,125,37),fill='#5a4d65');d.rectangle((3,24,125,26),fill='#efc887');d.rectangle((20,16,108,25),fill='#9c7a74');d.rectangle((29,10,99,17),fill='#c2a27d');d.rectangle((34,7,94,11),fill='#4b4057')
for x in range(13,124,10):d.rectangle((x,29,x+3,32),fill='#deb77c')
d.polygon([(51,14),(58,12),(64,16),(70,12),(77,14),(75,21),(65,24),(54,21)],fill='#e9cf9a');d.rectangle((62,16,65,20),fill='#644954')
gate.save(OUT/'challenge-gate.png',optimize=True)
door=Image.new('RGBA',(80,112));d=ImageDraw.Draw(door);d.rectangle((0,0,79,111),fill='#282639')
for x in range(0,80,8):d.rectangle((x,0,x+5,111),fill='#65515c');d.line((x+1,1,x+1,110),fill='#9a7b77')
for y in [15,50,89]:
 d.rectangle((0,y,79,y+6),fill='#9d815a');d.line((0,y,79,y),fill='#e6c68d')
 for x in range(5,80,10):d.point((x,y+3),fill='#352c37')
door.save(OUT/'challenge-door.png',optimize=True)

locations=['wilderness','desert','village','mountain','temple','streets','lions-gate']
for idx,name in enumerate(locations):
 rng=random.Random(1992+idx)
 sky=Image.new('RGB',(960,224));d=ImageDraw.Draw(sky)
 palettes=[['#111d35','#263650','#4b5067','#8d727a'],['#241d39','#4c344b','#80505c','#b78570'],['#171f3a','#303c55','#5a6376','#9b8b88'],['#121d31','#26394e','#4e6173','#91a1a4'],['#24203a','#443650','#726275','#b2998c'],['#181f39','#353954','#686179','#a99a91'],['#131d34','#293c52','#526977','#a8b4a8']][idx]
 for y in range(224):
  band=min(3,y//56);d.line((0,y,959,y),fill=palettes[band])
  if y%56<5 and band:
   for x in range(y%2,960,4):d.point((x,y),fill=palettes[band-1])
 for i in range(75):d.point((rng.randrange(960),rng.randrange(90)),fill='#c2c5bd')
 d.ellipse((746,21,784,59),fill='#e1c99c');sky.save(OUT/f'journey-{name}-sky.png',optimize=True)
 far=Image.new('RGBA',(960,224));d=ImageDraw.Draw(far)
 for layer,col in enumerate(['#465168','#2d3f54']):
  pts=[(0,224),(0,151+layer*21)]
  for x in range(0,1000,80):pts.extend([(x+35,97+layer*25+rng.randrange(30)),(x+80,154+layer*20)])
  pts.append((960,224));d.polygon(pts,fill=col)
 if idx==0:
  for x in range(15,960,53):d.polygon([(x,120),(x-16,177),(x+16,177)],fill='#244a4d');d.rectangle((x-1,160,x+1,198),fill='#3e4245')
 if idx in [2,4,5,6]:
  for x in range(0,960,57):
   h=rng.randrange(35,69);d.rectangle((x,194-h,x+46,200),fill='#55505f');d.rectangle((x+2,195-h,x+7,198),fill='#80717a');d.rectangle((x-2,190-h,x+49,195-h),fill='#b39986')
   for xx in [x+13,x+31]:d.rectangle((xx,204-h,xx+6,213-h),fill='#d0af7e')
 if idx==3:
  d.polygon([(130,140),(208,94),(278,160),(227,136),(207,107),(184,136)],fill='#9babb4')
 far.save(OUT/f'journey-{name}-far.png',optimize=True)
 near=Image.new('RGBA',(960,224));d=ImageDraw.Draw(near)
 floor=['#34413e','#8c6f58','#63585d','#4e5560','#736474','#635f70','#5b6a69'][idx]
 d.rectangle((0,193,960,224),fill=floor);d.line((0,193,960,193),fill='#b1a18b')
 for i in range(210):
  x=rng.randrange(960);y=rng.randrange(195,224);d.line((x,y,x+rng.randrange(2,10),y),fill='#a08f7d' if i%3 else '#353a4b')
 if idx in [2,4,5,6]:
  for y in range(195,224,8):
   d.line((0,y,960,y),fill='#3b3a4c')
   for x in range((y%2)*15,960,40):d.line((x,y,x+3,y+8),fill='#3b3a4c')
 if idx in [2,5]:
  for x in [100,470,810]:
   d.rectangle((x,108,x+69,195),fill='#726376');d.rectangle((x+3,110,x+10,194),fill='#b0928d');d.rectangle((x-3,102,x+73,110),fill='#c4a381');d.rectangle((x+26,160,x+46,195),fill='#2b2b40');d.rectangle((x+20,126,x+50,141),fill='#32384a')
   d.rectangle((x+20,124,x+50,127),fill='#d4b58b');d.line((x+34,127,x+34,141),fill='#d4b58b')
 if idx in [4,6]:
  for x in [90,410,740]:
   d.rectangle((x,95,x+18,195),fill='#766678');d.rectangle((x,95,x+4,195),fill='#c7aa94');d.rectangle((x-5,91,x+23,98),fill='#dfbe96');d.rectangle((x-5,190,x+23,195),fill='#c7aa94')
   for y in range(110,190,13):d.line((x,y,x+18,y),fill='#3a354a')
 if idx in [0,1,3]:
  for x in [160,481,840]:d.polygon([(x,189),(x+7,177),(x+22,180),(x+29,194),(x-3,194)],fill='#4a4d58');d.line((x+8,179,x+19,181),fill='#a29687')
 near.save(OUT/f'journey-{name}-near.png',optimize=True)
def position(n):return f'{n/53*100:.6f}%'
css=['/* Generated from the 54-frame adventure atlas contract. */']
for i,name in enumerate(STATES):
 a=i*6;b=a+5
 css.append(f'@keyframes judah-{name}-frames{{from{{background-position-x:{position(a)}}}to{{background-position-x:{position(b)}}}}}')
 if name in ['slash','recoil']:continue
 duration={'walk':'.7s','run':'.42s','stance':'2.1s','ready':'2.1s','victory':'.8s','celebrate':'.6s','transform':'1s'}[name]
 ending='infinite alternate' if name in ['stance','ready','walk','run'] else 'both'
 css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-frames {duration} steps(5,end) {ending}}}')
for i,name in [(5,'walk'),(6,'run')]:
 frames=list(range(i*6,i*6+6))+[i*6]
 css.append('@keyframes judah-'+name+'-loop{'+''.join(f'{j/6*100:.4f}%{{background-position-x:{position(f)}}}' for j,f in enumerate(frames))+'}')
 css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-loop {".7s" if name=="walk" else ".42s"} steps(1,end) infinite}}')
for name,frames in [('slash',list(range(12,18))+list(range(18,24))+[6]),('recoil',list(range(24,30))+[8,7,6])]:
 css.append('@keyframes judah-'+name+'-sequence{'+''.join(f'{i/(len(frames)-1)*100:.4f}%{{background-position-x:{position(f)}}}' for i,f in enumerate(frames))+'}')
 css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-sequence {"1.1s" if name=="slash" else ".85s"} steps(1,end) both}}')
(OUT.parents[1]/'adventure-frames.css').write_text('\n'.join(css),encoding='utf-8')
print('Built 270 action frame slots; seven original three-plane journeys; symbolic gate, doors and slash.')
