from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'dist'/'assets'/'console'
for rank in ['novice','student','scholar','scribe','master']:
 im=Image.open(root/f'judah-{rank}-adventure.png');assert im.size==(6912,176)
 frames=[im.crop((i*128,0,(i+1)*128,176)) for i in range(54)]
 for f in frames:
  assert f.getbbox();assert f.getchannel('A').crop((127,0,128,176)).getbbox() is None,'Clipped sword at right edge'
  assert f.getchannel('A').crop((0,0,128,1)).getbbox() is None,'Clipped raised sword'
 assert frames[3].tobytes()!=frames[9].tobytes(),'Stance and ready must be different'
 assert len({f.tobytes() for f in frames[30:36]})>=5,'Distinct walking frames required'
 assert len({f.tobytes() for f in frames[36:42]})>=5,'Distinct running frames required'
 assert frames[33].tobytes()!=frames[39].tobytes(),'Running must differ from walking'
 for state in range(9):assert len({f.tobytes() for f in frames[state*6:state*6+6]})>=3
for slug in ['wilderness','desert','village','mountain','temple','streets','lions-gate']:
 for layer in ['sky','far','near']:
  im=Image.open(root/f'journey-{slug}-{layer}.png');assert im.size==(960,224);im.verify()
for name in ['slash','challenge-gate','challenge-door']:
 im=Image.open(root/f'{name}.png');im.verify()
print('PASS: all 270 action frame slots and 21 parallax planes decode; walking/running have distinct poses; swords stay within frame; no empty states.')
print('New adventure payload:',sum(p.stat().st_size for p in root.glob('*.png') if 'adventure' in p.name or 'journey-' in p.name or p.stem in ['slash','challenge-gate','challenge-door']),'bytes')
