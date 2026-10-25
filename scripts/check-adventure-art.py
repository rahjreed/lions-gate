from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'dist'/'assets'/'console'
def check_envelope(frame):
 alpha=frame.getchannel('A');w,h=frame.size
 assert alpha.getbbox(),'Empty Judah frame'
 for edge in [(0,0,1,h),(w-1,0,w,h),(0,0,w,1),(0,h-1,w,h)]:
  assert alpha.crop(edge).getbbox() is None,'Judah art touches a frame boundary'
for rank in ['novice','student','scholar','scribe','master']:
 portrait=Image.open(root/f'judah-{rank}.png').convert('RGBA');assert portrait.size==(3072,320)
 for i in range(16):check_envelope(portrait.crop((i*192,0,(i+1)*192,320)))
 im=Image.open(root/f'judah-{rank}-adventure.png').convert('RGBA');assert im.size==(13824,352)
 frames=[im.crop((i*256,0,(i+1)*256,352)) for i in range(54)]
 for f in frames:
  check_envelope(f)
  assert f.getbbox();assert f.getchannel('A').crop((255,0,256,352)).getbbox() is None,'Clipped sword at right edge'
  assert f.getchannel('A').crop((0,0,256,1)).getbbox() is None,'Clipped raised sword'
 assert frames[3].tobytes()!=frames[9].tobytes(),'Stance and ready must be different'
 assert frames[17].tobytes()==frames[6].tobytes(),'Attack recovery must match the starting guard'
 assert frames[29].tobytes()==frames[6].tobytes(),'Damage recovery must match the starting guard'
 assert len({f.tobytes() for f in frames[30:36]})>=5,'Distinct walking frames required'
 assert len({f.tobytes() for f in frames[36:42]})>=5,'Distinct running frames required'
 assert frames[33].tobytes()!=frames[39].tobytes(),'Running must differ from walking'
 for state in range(9):assert len({f.tobytes() for f in frames[state*6:state*6+6]})>=3
for slug in ['wilderness','desert','village','mountain','temple','streets','lions-gate']:
 for layer in ['sky','far','near']:
  im=Image.open(root/f'journey-{slug}-{layer}.png');assert im.size==(960,224);im.verify()
for name in ['slash','challenge-gate','challenge-door']:
 im=Image.open(root/f'{name}.png');im.verify()
print('PASS: all 350 Judah portrait/action frames and 21 parallax planes decode; walking/running have distinct poses; all four frame edges are clear; no empty states.')
print('New adventure payload:',sum(p.stat().st_size for p in root.glob('*.png') if 'adventure' in p.name or 'journey-' in p.name or p.stem in ['slash','challenge-gate','challenge-door']),'bytes')
