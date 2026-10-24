"""Original palette-limited raster artwork. Integer pixels only; no resampling/AA.
Run deliberately when editing art. Pillow is an authoring dependency, never runtime.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import random

OUT=Path(__file__).resolve().parents[1]/'dist'/'assets'/'console'
OUT.mkdir(parents=True,exist_ok=True)
INK='#111321'
SKIN=['#422c2c','#654031','#895339','#ac7049','#c58c5c','#e1ac76']
PALETTES=[['#504c43','#756c54','#a2916c','#c3b18a','#e2d4ac'],['#253d4f','#355b69','#56828a','#83a3a0','#b8c6b1'],['#252c4b','#35456a','#536b91','#8097b0','#b0c4ca'],['#173b3f','#24585b','#3a7c79','#6aa59b','#a7c7b2'],['#5e5c62','#96917c','#c6b991','#e4d6ab','#fff0c8']]
GOLD=['#574033','#906438','#c2954e','#e4bc70','#ffe4a2']

def sprite(stage,frame):
 im=Image.new('RGBA',(96,160));d=ImageDraw.Draw(im)
 # Four authored poses, each with four breathing/blink/settling frames.
 pose,f=divmod(frame,4);dy=[0,0,-1,0][f] if pose==0 else [0,-2,-1,0][f]
 cloth=PALETTES[stage];trim=GOLD if stage>=2 else PALETTES[max(0,stage-1)]
 def p(points,c):d.polygon([(x,y+dy) for x,y in points],fill=c)
 def r(box,c):x,y,a,b=box;d.rectangle((x,y+dy,a,b+dy),fill=c)
 d.ellipse((18,153,81,158),fill='#080d1c80');d.rectangle((27,155,72,157),fill='#080d1c90')
 # Staggered stance, trousers, laced boots, sole highlights.
 p([(30,108),(49,108),(48,141),(42,151),(24,151),(28,139)],INK)
 p([(50,107),(65,107),(69,139),(76,148),(74,153),(54,153),(51,140)],INK)
 p([(33,111),(45,111),(43,137),(30,140)],'#3d3940');p([(36,114),(40,114),(37,134),(32,137)],'#605550')
 p([(53,111),(62,111),(65,138),(55,140)],'#302f3d');r((56,117,58,135),'#55494b')
 p([(28,137),(43,136),(43,148),(38,152),(22,152),(22,148),(27,145)],'#4a3531')
 p([(54,136),(66,136),(69,144),(75,147),(75,151),(55,151)],'#4a3531')
 r((24,150,41,151),'#a17d58');r((56,150,73,151),'#a17d58');r((30,138,33,147),'#8f6644');r((57,138,60,147),'#8f6644')
 for y in [139,142,145]:r((33,y,39,y),'#b08b5c');r((60,y,65,y),'#b08b5c')
 # Long rank-specific hems and dimensional torso silhouette.
 hem=116 if stage<2 else 133
 p([(29,49),(39,43),(58,43),(68,49),(73,76),(68,91),(73,hem),(54,hem+2),(46,hem-1),(25,hem),(29,88),(22,69)],INK)
 p([(31,51),(40,47),(57,47),(65,52),(67,79),(62,89),(68,hem-3),(50,hem-1),(45,hem-4),(29,hem-3),(34,88),(28,70)],cloth[1])
 p([(35,52),(43,48),(56,48),(60,60),(57,83),(48,91),(35,83)],cloth[2])
 p([(36,53),(42,51),(41,66),(38,78),(34,73)],cloth[3]);p([(44,51),(54,51),(58,65),(54,76),(50,77),(51,61)],cloth[3])
 p([(59,54),(64,56),(65,77),(60,88),(57,81)],cloth[0])
 p([(36,91),(43,91),(38,hem-6),(32,hem-5)],cloth[2]);p([(49,93),(54,91),(59,hem-5),(49,hem-4)],cloth[2])
 p([(42,97),(46,94),(44,hem-6),(40,hem-5)],cloth[0]);p([(59,94),(63,95),(66,hem-5),(62,hem-5)],cloth[0])
 for x,y in [(37,60),(36,64),(55,70),(34,98),(33,104),(51,108),(52,114),(60,102)]:r((x,y,x+1,y+2),cloth[4] if x%2 else cloth[3])
 # Split collar, woven belt and brass buckle.
 p([(38,47),(44,44),(48,52),(52,44),(59,47),(53,58),(46,60)],cloth[0])
 p([(40,48),(44,47),(48,54),(46,57)],cloth[4]);p([(53,48),(57,48),(51,56),(49,56)],cloth[3])
 r((30,86,65,91),'#352b2b');r((31,86,64,87),'#a57c4e');r((46,86,53,92),trim[3]);r((48,88,51,90),'#45342f')
 p([(56,91),(61,91),(59,112),(54,116)],'#795539');r((56,95,57,108),'#c3a174')
 # Left arm gestures change silhouette; success hand near chest, miss hand open.
 if pose in (1,3):
  p([(29,52),(23,56),(19,77),(26,84),(41,77),(44,65),(38,62),(33,71),(29,73)],INK)
  p([(27,56),(23,61),(22,75),(27,79),(36,74),(37,68),(33,67),(28,73)],cloth[2])
  p([(35,68),(38,62),(40,61),(42,63),(44,63),(44,71),(40,76),(35,75)],SKIN[1]);r((38,65,40,72),SKIN[3]);r((41,65,42,69),SKIN[4]);r((37,72,40,73),SKIN[2])
 else:
  p([(29,52),(23,55),(18,76),(20,88),(18,96),(22,103),(29,101),(31,93),(29,83),(34,67)],INK)
  p([(26,56),(23,61),(21,76),(24,85),(29,82),(31,65)],cloth[2]);r((23,62,24,75),cloth[3])
  p([(23,84),(28,84),(28,94),(26,100),(22,99),(21,95)],SKIN[2]);r((23,86,25,93),SKIN[4]);r((22,95,23,97),SKIN[3]);r((26,95,27,98),SKIN[1])
 # Right forearm, Scholar book / Scribe scroll / Master illuminated codex.
 p([(64,52),(71,55),(77,77),(73,91),(65,91),(64,81),(68,74),(62,65)],INK)
 p([(67,57),(70,59),(74,75),(70,83),(66,80),(70,74)],cloth[1]);p([(68,59),(70,61),(72,72),(70,75),(67,67)],cloth[3])
 if stage>=2:
  r((63,80,80,105),'#171925');r((65,81,79,103),'#573e4a' if stage<4 else '#31485b');r((67,82,77,100),'#d4c29a');r((69,84,77,99),'#f0deb3')
  for y in range(85,100,3):r((70,y,76,y),'#9c8d70')
  r((65,81,67,104),trim[2]);r((65,100,79,104),'#43394a');r((67,101,77,102),trim[3])
  if stage==3:r((73,77,80,103),'#bdab83');r((75,79,79,101),'#eadbb6');r((73,77,80,79),'#fff0c8')
 p([(67,83),(72,82),(75,85),(75,92),(72,94),(66,91)],SKIN[2]);r((68,84,72,87),SKIN[4]);r((67,89,73,90),SKIN[1]);r((69,92,72,92),SKIN[3])
 if stage>=1:
  p([(34,49),(38,48),(60,83),(56,86)],trim[0]);p([(35,50),(37,50),(58,83),(56,84)],trim[2]);r((41,59,43,61),trim[4])
 if stage>=3:
  p([(27,51),(35,47),(33,78),(30,114),(26,131),(21,128),(25,87)],cloth[0]);p([(27,55),(31,51),(29,87),(25,125),(23,126)],cloth[2])
  p([(61,47),(69,52),(73,120),(76,130),(68,133),(62,92)],cloth[0]);p([(64,51),(67,54),(68,92),(73,128),(70,130)],cloth[2])
  for y in range(63,125,6):r((26 if y>90 else 29,y,27 if y>90 else 30,y+2),trim[2]);r((68 if y<100 else 70,y,69 if y<100 else 71,y+2),trim[3])
 if stage==4:
  p([(28,50),(37,44),(48,54),(59,44),(69,50),(64,67),(51,61),(47,62),(32,69)],'#28263f')
  p([(29,51),(36,47),(47,58),(32,65)],'#5e4b78');p([(59,47),(67,52),(63,63),(51,58)],'#79618e')
  p([(31,50),(36,47),(47,57),(59,47),(64,49),(48,62)],GOLD[2]);p([(34,49),(36,49),(47,59),(59,49),(61,49),(48,60)],GOLD[4])
  r((46,58,50,63),GOLD[0]);r((47,58,49,61),'#9fe1ce')
  for x in range(32,64,5):r((x,129,x+1,131),GOLD[3])
 # Neck and face: six skin tones, cheek planes, nose bridge, beard and eye glints.
 p([(40,35),(57,35),(56,48),(49,53),(40,47)],SKIN[0]);p([(43,38),(54,38),(53,47),(48,49),(43,46)],SKIN[2]);r((44,39,47,45),SKIN[3])
 hx=(-1 if pose==2 else (1 if f==2 else 0));hy=2 if pose==2 else 0
 face=Image.new('RGBA',(96,160));fd=ImageDraw.Draw(face)
 def fp(pts,c):fd.polygon(pts,fill=c)
 def fr(b,c):fd.rectangle(b,fill=c)
 fp([(37,12),(45,8),(57,11),(63,21),(61,36),(56,43),(47,46),(39,41),(35,29)],INK)
 fp([(39,17),(47,12),(57,16),(60,24),(58,35),(54,41),(47,43),(40,38),(37,28)],SKIN[2])
 fp([(41,18),(48,16),(56,19),(56,26),(52,29),(49,34),(41,32),(39,26)],SKIN[3])
 fp([(42,20),(47,18),(52,19),(50,22),(42,24)],SKIN[4]);fp([(54,20),(57,22),(57,28),(54,30),(53,25)],SKIN[1])
 fp([(39,31),(43,33),(46,33),(45,37),(40,36)],SKIN[4]);fp([(52,32),(57,30),(56,35),(51,37)],SKIN[3])
 fr((39,25,45,26),SKIN[0]);fr((51,24,56,25),SKIN[0]);fr((41,27,44,28),'#e7d2aa');fr((51,26,54,27),'#e7d2aa')
 fr((43,27,44,28),'#171925');fr((53,26,54,27),'#171925')
 if f==3 and pose==0:fr((40,27,45,28),SKIN[1]);fr((51,26,55,27),SKIN[1])
 if pose in (1,3):fr((39,24,45,24),SKIN[0]);fr((51,23,56,23),SKIN[0])
 fp([(48,25),(50,26),(49,32),(51,33),(47,34),(46,32)],SKIN[1]);fr((48,27,48,31),SKIN[5]);fr((47,33,49,33),SKIN[3])
 fp([(39,35),(42,37),(47,38),(53,36),(57,34),(56,40),(51,44),(45,44),(40,41)],'#3b292c')
 fr((45,37,51,37),SKIN[1]);fr((46,38,50,38),SKIN[4]);fr((45,41,51,41),'#664234');fr((47,43,49,43),'#9a6243')
 # Distinct swept crown and individually shaded shoulder-length locks.
 fp([(34,17),(36,9),(41,6),(52,5),(60,9),(64,17),(65,34),(63,46),(59,48),(58,28),(57,17),(49,14),(42,18),(39,28),(38,44),(33,42),(32,30)],'#191923')
 for x,y,h in [(34,19,24),(38,12,16),(42,9,10),(47,7,9),(52,8,9),(57,11,11),(61,20,26)]:
  fr((x,y,x+2,y+h),'#302b31');fr((x,y+2,x,y+h-3),'#51403b');fr((x+1,y+5,x+2,y+6),'#6c5141')
 fr((32,33,34,43),'#25232b');fr((36,37,38,48),'#3e3032');fr((60,38,62,49),'#3e3032');fr((36,43,38,44),'#b09463');fr((61,41,62,42),'#b09463')
 im.alpha_composite(face,(hx,hy+dy))
 # Woven hem stitches, deliberately sparse rather than random noise.
 for x in range(31,66,4):r((x,hem-5,x+1,hem-5),trim[2])
 return im

for stage,name in enumerate(['novice','student','scholar','scribe','master']):
 sheet=Image.new('RGBA',(96*16,160))
 for frame in range(16):sheet.alpha_composite(sprite(stage,frame),(96*frame,0))
 sheet.save(OUT/f'judah-{name}.png',optimize=True)

def scenery(env):
 rng=random.Random(260+env);im=Image.new('RGB',(640,280));d=ImageDraw.Draw(im)
 skies=[['#10172e','#1c2541','#333653','#554962','#88676c'],['#0b2234','#183c49','#2d5860','#577777','#91a19a'],['#101b39','#192d51','#294768','#536687','#8b89a0'],['#211a35','#322543','#4d3753','#795361','#aa807c'],['#101b33','#1c2e4d','#384266','#655d86','#a094b0']][env]
 for y in range(180):
  band=min(4,y//36);d.line((0,y,640,y),fill=skies[band])
  if y%36<5 and band: 
   for x in range(y%2,640,4):d.point((x,y),fill=skies[band-1])
 for i in range(90):
  x=rng.randrange(640);y=rng.randrange(125);d.point((x,y),fill='#b7bec5')
  if i%12==0:d.line((x-1,y,x+1,y),fill='#d1d3bf');d.point((x,y-1),fill='#7d97b0')
 d.ellipse((494,20,539,65),fill='#b3a199');d.ellipse((493,18,536,61),fill='#e7d4a4')
 for i in range(25):
  x=rng.randrange(499,530);y=rng.randrange(24,55)
  if (x-515)**2+(y-40)**2<370:d.rectangle((x,y,x+2,y+1),fill='#bcab8c')
 # Three independently drawn depth planes with faceted ridges.
 for layer,(base,col,lit) in enumerate([(162,'#41445c','#69647a'),(191,'#30394e','#4b5367'),(216,'#1f2f41','#3b4555')]):
  pts=[(-20,280),(-20,base)]
  peaks=[]
  for x in range(-20,700,80):
   y=base-rng.randrange(20,71);pts.extend([(x+25,y),(x+80,base+8)]);peaks.append((x+25,y))
  pts.append((660,280));d.polygon(pts,fill=col)
  for x,y in peaks:
   d.polygon([(x,y),(x+34,base),(x+8,y+20),(x+2,y+12),(x-9,y+17)],fill=lit)
   for j in range(10):
    xx=x+rng.randrange(2,28);yy=y+rng.randrange(20,45)
    if yy<base:d.line((xx,yy,xx+3,yy+1),fill=col)
 if env==1:
  for i in range(29):
   x=i*25-20;h=rng.randrange(28,67);y=215-h;d.rectangle((x, y+10,x+2,226),fill='#322e32')
   for tier in range(5):
    yy=y+tier*8;w=4+tier*4;d.polygon([(x,yy-9),(x-w,yy+8),(x+w+3,yy+8)],fill=['#244a4c','#31625a','#45776a'][i%3]);d.line((x-w+2,yy+7,x-1,yy+7),fill='#6a8c73')
 if env==2:
  d.rectangle((0,181,640,240),fill='#254d65')
  for i in range(170):
   x=rng.randrange(640);y=rng.randrange(185,237);w=rng.randrange(2,20);d.line((x,y,x+w,y),fill=['#38697a','#527d87','#91a7a3'][i%3])
  d.polygon([(55,205),(72,193),(96,195),(111,205)],fill='#1f3044');d.line((77,164,77,198),fill='#596b78');d.polygon([(79,166),(79,192),(95,190)],fill='#a0aca5')
 if env>=3:
  for x in [53,95,530,573]:
   d.rectangle((x,114,x+21,220),fill='#343749');d.rectangle((x+2,119,x+5,216),fill='#656079')
   for y in range(127,216,13):d.line((x+1,y,x+19,y),fill='#242c40');d.rectangle((x+9,y+3,x+12,y+8),fill='#c29b70' if env==4 else '#776880')
   d.rectangle((x-3,111,x+24,119),fill='#8d7887')
   if env==4:d.pieslice((x-4,91,x+25,119),180,360,fill='#8b829c');d.rectangle((x+10,86,x+11,95),fill='#d1b985')
 # Foreground stone terrace; tile seams and chipped edges.
 d.rectangle((0,225,640,280),fill='#202637')
 for y in range(229,280,12):
  d.line((0,y,640,y),fill='#3e4052')
  for x in range((y//12%2)*21-42,660,42):
   d.line((x,y,x+2,y+11),fill='#111c2d');d.line((x+3,y+1,x+38,y+1),fill='#4d4658')
 for i in range(100):
  x=rng.randrange(640);y=rng.randrange(228,280);d.line((x,y,x+2,y),fill='#555063' if i%3 else '#111c2d')
 # Monument columns: five shade planes, masonry, channels, ornament and light spill.
 for x in [194,398]:
  d.rectangle((x-6,91,x+45,232),fill='#131c2e');d.rectangle((x,97,x+39,225),fill='#796576');d.rectangle((x,97,x+5,225),fill='#b08b91');d.rectangle((x+6,97,x+12,225),fill='#8f7485');d.rectangle((x+28,97,x+34,225),fill='#55455e');d.rectangle((x+35,97,x+39,225),fill='#352e48')
  for y in range(105,225,16):
   d.line((x,y,x+38,y),fill='#3d354e');d.line((x+1,y+1,x+32,y+1),fill='#a1838c');d.line((x+18,y+1,x+18,y+15),fill='#55465d')
  for xx in [x+8,x+24]:
   d.rectangle((xx,112,xx+3,208),fill='#4e435b');d.line((xx,113,xx,207),fill='#c09695')
  for y in [110,211]:
   d.rectangle((x+12,y,x+26,y+9),fill='#302e46');d.line((x+14,y+2,x+24,y+2),fill='#d4af79');d.line((x+16,y+4,x+22,y+4),fill='#977249');d.point((x+19,y+6),fill='#f0d19a')
  for y in [93,221]:
   d.rectangle((x-7,y,x+46,y+10),fill='#675062');d.rectangle((x-9,y,x+48,y+2),fill='#ead1a3');d.rectangle((x-7,y+3,x+46,y+5),fill='#c59b7b');d.line((x-7,y+9,x+46,y+9),fill='#342c42')
 d.rectangle((231,87,400,105),fill='#251f37');d.rectangle((232,88,400,90),fill='#d5b482');d.rectangle((234,93,399,97),fill='#82647b')
 for x in range(237,398,9):d.rectangle((x,94,x+3,97),fill='#e5bf7f');d.point((x+1,99),fill='#997354')
 d.rectangle((289,77,350,96),fill='#33283c');d.rectangle((292,77,347,79),fill='#e5c38f');d.rectangle((293,80,346,92),fill='#8f6d6c');d.rectangle((298,81,341,90),fill='#302a40')
 # Original open-book crest, not pseudo-scripture.
 d.polygon([(308,83),(318,85),(319,89),(307,87)],fill='#ead4a4');d.polygon([(320,85),(331,83),(332,87),(320,89)],fill='#c4a47d')
 for i in range(4):
  x=271-i*15;y=232+i*9;w=99+i*30;d.rectangle((x,y,x+w,y+8),fill='#584354');d.line((x,y,x+w,y),fill='#d2a08b');d.line((x,y+2,x+w,y+2),fill='#927185');d.line((x,y+8,x+w,y+8),fill='#241e34')
 for x in [170,465]:
  d.rectangle((x-2,194,x+3,230),fill='#4d3734');d.line((x-1,196,x-1,229),fill='#b68b5d');d.rectangle((x-8,190,x+9,194),fill='#292b39');d.rectangle((x-7,189,x+8,190),fill='#c6a36c')
 return im

for env in range(5):scenery(env).save(OUT/f'world-{env}.png',optimize=True)

# Original faceted sword and four distinct fire silhouettes.
im=Image.new('RGBA',(48,112));d=ImageDraw.Draw(im)
d.polygon([(23,1),(29,9),(29,61),(25,68),(18,65),(18,10)],fill='#122a45');d.polygon([(23,4),(26,11),(26,60),(23,65),(20,61),(20,11)],fill='#a4d5d2');d.polygon([(23,4),(23,62),(20,60),(20,12)],fill='#f1f6da');d.rectangle((24,13,25,58),fill='#5e9ea9');d.line((22,14,22,55),fill='#ffffff')
for y in range(19,56,9):d.line((24,y,25,y+2),fill='#c9eee1')
d.polygon([(4,61),(11,60),(12,65),(34,65),(37,60),(43,61),(41,72),(29,73),(27,77),(19,77),(17,73),(6,72)],fill='#584037');d.line((5,62,11,62),fill='#ffe3a1');d.line((12,67,34,67),fill='#ffe3a1');d.rectangle((8,69,38,70),fill='#c3914d');d.rectangle((21,73,26,95),fill='#4d3e5e');d.rectangle((21,75,22,93),fill='#a9849b')
for y in range(78,94,4):d.line((21,y,26,y-1),fill='#d4ac71')
d.rectangle((19,96,28,101),fill='#bc8745');d.rectangle((20,96,27,97),fill='#ffe1a1');d.rectangle((22,98,25,99),fill='#8de3d0');d.rectangle((22,102,25,104),fill='#73523f')
im.save(OUT/'sword.png',optimize=True)
fire=Image.new('RGBA',(64,32))
for f in range(4):
 a=Image.new('RGBA',(16,32));d=ImageDraw.Draw(a);shift=[0,2,-1,1][f]
 d.polygon([(3,29),(1,21),(4,16),(5,20),(7,8+shift),(10,2+shift),(10,15),(13,12),(14,24),(11,30)],fill='#b25039');d.polygon([(4,27),(4,22),(7,15),(8,20),(10,10+shift),(11,23),(13,24),(10,29)],fill='#ef9b46');d.polygon([(6,27),(6,24),(8,19),(10,25),(10,29)],fill='#ffe0a0');d.point((7,5+f*2),fill='#e9b36c');fire.alpha_composite(a,(f*16,0))
fire.save(OUT/'fire.png',optimize=True)
print('Built five 16-frame Judah sheets, five 640×280 worlds, sword and fire. Original integer-pixel raster art.')
