"""Package the existing pixel sword and gate branding as opaque app icons."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
out = root / 'dist/assets/icons'
out.mkdir(exist_ok=True)
sword = Image.open(root / 'dist/assets/console/sword.png').convert('RGBA')
gate = Image.open(root / 'dist/assets/console/challenge-gate.png').convert('RGBA')
for size, name, maskable in [(192,'icon-192.png',False),(512,'icon-512.png',False),(512,'maskable-512.png',True),(180,'apple-touch-icon.png',False)]:
    # Keep all essential artwork inside the central 80%-diameter safe circle.
    im = Image.new('RGBA',(size,size),'#101626')
    d = ImageDraw.Draw(im)
    if not maskable:
        inset = round(size*.055)
        d.rectangle((inset,inset,size-inset-1,size-inset-1),outline='#cbaa71',width=max(2,size//64))
        d.rectangle((inset*2,inset*2,size-inset*2-1,size-inset*2-1),outline='#4b5473',width=max(1,size//128))
    g = gate.resize((round(size*.42),round(size*.52)),Image.Resampling.NEAREST)
    im.alpha_composite(g,((size-g.width)//2,round(size*.26)))
    s = sword.resize((round(size*.25),round(size*.58)),Image.Resampling.NEAREST)
    im.alpha_composite(s,((size-s.width)//2,round(size*.20)))
    im.convert('RGB').save(out/name)
