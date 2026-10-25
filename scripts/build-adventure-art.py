"""Original three-quarter action poses and separate parallax planes.
Integer-coordinate raster authoring; never rotates the existing front sprite.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import random, sys
from judah_art import ART_SCALE, save_atlas, action_sprite
from judah_animation import write_animation_css
OUT=Path(__file__).resolve().parents[1]/'dist'/'assets'/'console'
OUT.mkdir(parents=True,exist_ok=True)
STATES=['stance','ready','slash','celebrate','recoil','walk','run','victory','transform']

for stage,name in enumerate(['novice','student','scholar','scribe','master']):
 sheet=Image.new('RGBA',(128*54*ART_SCALE,176*ART_SCALE))
 for i,state in enumerate(STATES):
  for f in range(6):sheet.alpha_composite(action_sprite(stage,state,f),((i*6+f)*128*ART_SCALE,0))
 save_atlas(sheet,OUT/f'judah-{name}-adventure.png')

write_animation_css(OUT.parents[1]/'adventure-frames.css')

if '--judah-only' in sys.argv:
 raise SystemExit(0)

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
print('Built 270 action frame slots; seven original three-plane journeys; symbolic gate, doors and slash.')
