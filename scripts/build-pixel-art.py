"""Original palette-limited raster artwork. Integer pixels only; no resampling/AA.
Run deliberately when editing art. Pillow is an authoring dependency, never runtime.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import random

OUT=Path(__file__).resolve().parents[1]/'dist'/'assets'/'console'
OUT.mkdir(parents=True,exist_ok=True)
from judah_art import ART_SCALE, save_atlas, portrait_sprite as sprite
import sys

for stage,name in enumerate(['novice','student','scholar','scribe','master']):
 sheet=Image.new('RGBA',(96*16*ART_SCALE,160*ART_SCALE))
 for frame in range(16):sheet.alpha_composite(sprite(stage,frame),(96*frame*ART_SCALE,0))
 save_atlas(sheet,OUT/f'judah-{name}.png')

if '--judah-only' in sys.argv:
 raise SystemExit(0)

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
