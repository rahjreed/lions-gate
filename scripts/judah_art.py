"""Pack reviewed whole-body raster poses into the existing Judah atlas contracts.

The source sheets are generated original pixel art in art/judah, not runtime
assets. Packing isolates complete connected figures, preserves source alpha,
and uses one scale/ground plane per family (never per-frame stretch/rotation).
"""
from pathlib import Path
from functools import lru_cache
from statistics import median
from PIL import Image, ImageChops, ImageFilter

SOURCE = Path(__file__).resolve().parents[1] / 'art' / 'judah'
RANKS = ['novice', 'student', 'scholar', 'scribe', 'master']
ART_SCALE = 2  # More native shading detail; logical frame geometry stays unchanged.

def save_atlas(sheet, path):
    # A shared indexed palette keeps crisp source pixels and bounds downloads.
    sheet.quantize(colors=256,method=Image.Quantize.FASTOCTREE,
                   dither=Image.Dither.NONE).save(path,optimize=True)

@lru_cache(maxsize=8)
def grid(name, rows, columns):
    image = Image.open(SOURCE / f'{name}-source.png').convert('RGBA')
    w, h = image.size
    if name in RANKS[1:]:
        # Outfit edits retain the reference layout. Use its separated masks;
        # a cloth hem touching a neighboring sword must not merge two actors.
        result=[]
        for row in grid('novice',6,6):
            group=[]
            for original in row:
                b=original['bounds']
                region=(max(0,b[0]-6),max(0,b[1]-6),min(w,b[2]+6),min(h,b[3]+6))
                mask=Image.new('L',(region[2]-region[0],region[3]-region[1]))
                mask.paste(original['image'].getchannel('A'),(b[0]-region[0],b[1]-region[1]))
                mask=mask.filter(ImageFilter.MaxFilter(11))
                part=image.crop(region);part.putalpha(ImageChops.multiply(part.getchannel('A'),mask))
                local=part.getbbox()
                bounds=(region[0]+local[0],region[1]+local[1],region[0]+local[2],region[1]+local[3])
                group.append({'image':part.crop(local),'bounds':bounds,'foot':original['foot']})
            result.append(group)
        return result
    alpha = bytearray(image.getchannel('A').point(lambda n: 255 if n >= 96 else 0).tobytes())
    figures = []
    for i in range(len(alpha)):
        if not alpha[i]:
            continue
        alpha[i] = 0
        todo, pixels = [i], []
        while todo:
            j = todo.pop(); pixels.append(j)
            x, y = j % w, j // w
            for k in (j-1 if x else -1, j+1 if x<w-1 else -1,
                      j-w if y else -1, j+w if y<h-1 else -1):
                if k >= 0 and alpha[k]:
                    alpha[k] = 0; todo.append(k)
        if len(pixels) < 1000:
            continue
        xs, ys = [j % w for j in pixels], [j // w for j in pixels]
        bounds = (min(xs), min(ys), max(xs)+1, max(ys)+1)
        mask = Image.new('L', image.size)
        data = bytearray(w*h)
        for j in pixels: data[j] = 255
        mask.frombytes(bytes(data))
        mask = mask.filter(ImageFilter.MaxFilter(3))
        part = image.copy()
        part.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
        bounds = part.getbbox()
        feet = part.getchannel('A').crop((0, bounds[3]-12, w, bounds[3])).getbbox()
        figures.append({'image':part.crop(bounds), 'bounds':bounds,
                        'foot':(feet[0]+feet[2])/2})
    assert len(figures) == rows*columns, f'{name}: expected {rows*columns} complete figures, got {len(figures)}'
    figures.sort(key=lambda f:f['bounds'][3])
    result=[]
    for row in range(rows):
        group=figures[row*columns:(row+1)*columns]
        group.sort(key=lambda f:f['bounds'][0])
        result.append(group)
    return result

def pack(figure, anchor, baseline, scale, size, target):
    scale*=ART_SCALE
    size=tuple(n*ART_SCALE for n in size)
    target=tuple(n*ART_SCALE for n in target)
    image=figure['image']; box=figure['bounds']
    image=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.NEAREST)
    x=round(target[0]+(box[0]-anchor)*scale)
    y=round(target[1]+(box[1]-baseline)*scale)
    assert x>0 and y>0 and x+image.width<size[0]-1 and y+image.height<size[1]-1, (size,(x,y),image.size)
    frame=Image.new('RGBA',size);frame.alpha_composite(image,(x,y))
    return frame

@lru_cache(maxsize=5)
def action_frames(stage):
    source=grid(RANKS[stage],6,6)
    anchors=[f['foot'] for f in source[0]]
    baselines=[median(f['bounds'][3] for f in row) for row in source]
    frames=[[pack(f,anchors[col],baselines[row],.40,(128,176),(51,167))
             for col,f in enumerate(items)] for row,items in enumerate(source)]
    # A separately reviewed hit sheet keeps the sword in Judah's hand throughout.
    hit=grid('damage',5,6)[stage]
    hit_scale=.40*(source[0][0]['bounds'][3]-source[0][0]['bounds'][1])/(hit[0]['bounds'][3]-hit[0]['bounds'][1])
    step=Image.open(SOURCE/'damage-source.png').width/6
    anchor=hit[0]['foot']; baseline=median(f['bounds'][3] for f in hit)
    frames[2]=[pack(f,anchor+col*step,baseline,hit_scale,(128,176),(51,167)) for col,f in enumerate(hit)]
    # The final recovery is pixel-identical to the first guard, preventing a reset snap.
    frames[1][5]=frames[0][0].copy();frames[2][5]=frames[0][0].copy()
    return frames

def action_sprite(stage,state,frame):
    frames=action_frames(stage)
    if state=='stance':return frames[0][(frame+1)%6].copy()
    row={'ready':0,'slash':1,'recoil':2,'walk':3,'run':4,
         'celebrate':5,'victory':5,'transform':5}[state]
    return frames[row][frame].copy()

def portrait_sprite(stage,frame):
    source=grid('portraits',4,5)
    pose,phase=divmod(frame,4)
    figure=source[pose][stage]
    anchor=source[0][stage]['foot']
    baseline=median(f['bounds'][3] for f in source[pose])
    # One common scale across all ranks/poses; two tiny breathing elevations.
    return pack(figure,anchor,baseline,.34,(96,160),(48,153-[0,0,1,0][phase]))
