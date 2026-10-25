"""Judah-only atlas playback. CombatDirector still owns all gameplay timing."""
from pathlib import Path

def write_animation_css(path):
    states=['stance','ready','slash','celebrate','recoil','walk','run','victory','transform']
    def position(n): return f'{n/53*100:.6f}%'
    css=['/* Generated Judah visual playback; 54-frame atlas, unchanged 920ms combat. */']
    for i,name in enumerate(states):
        css.append(f'@keyframes judah-{name}-frames{{from{{background-position-x:{position(i*6)}}}to{{background-position-x:{position(i*6+5)}}}}}')
        if name in ['slash','recoil']:continue
        duration={'walk':'.7s','run':'.42s','stance':'2.1s','ready':'2.1s','victory':'.8s','celebrate':'.6s','transform':'1s'}[name]
        ending='infinite alternate' if name in ['stance','ready','walk','run'] else 'both'
        css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-frames {duration} steps(5,end) {ending}}}')
    for i,name in [(5,'walk'),(6,'run')]:
        frames=list(range(i*6,i*6+6))+[i*6]
        css.append('@keyframes judah-'+name+'-loop{'+''.join(f'{j/6*100:.4f}%{{background-position-x:{position(f)}}}' for j,f in enumerate(frames))+'}')
        css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-loop {".7s" if name=="walk" else ".42s"} steps(1,end) infinite}}')
    # Full-body anticipation, overhead coil, impact, follow-through and guard.
    # A hit starts at 240ms, leaving exactly 680ms to recover before reveal.
    tracks=[('slash','.92s',[(0,6),(6,12),(140/920*100,13),(240/920*100,14),(340/920*100,15),(52,16),(76,17),(100,6)]),
            ('recoil','.68s',[(0,25),(15,26),(38,27),(65,28),(89,29),(100,6)])]
    for name,duration,keys in tracks:
        css.append('@keyframes judah-'+name+'-sequence{'+''.join(f'{at:.6f}%{{background-position-x:{position(f)}}}' for at,f in keys)+'}')
        css.append(f'.judah-{name} .judah-sprite{{animation:judah-{name}-sequence {duration} steps(1,end) both}}')
    Path(path).write_text('\n'.join(css)+'\n',encoding='utf-8')
