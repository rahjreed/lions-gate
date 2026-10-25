# Judah: whole-body art and animation overhaul

The disconnected procedural limb drawing has been replaced with original cohesive full-body raster poses. Judah retains brown skin, locs, a beard, humble Hebrew-warrior clothing and all five ranks. The new shoulder girdle, ribcage, waist and pelvis connect naturally; elbows, wrists, knees and ankles follow the poses. His stable fighting stance uses bent knees and balanced weight.

New face/loc shading, skin planes, linen folds, leather and steel detail extend across the family. Novice remains olive/brown; Student blue/teal with sash; Scholar indigo with restrained gold seams; Scribe forest teal; Master ivory with a purple mantle. Portraits share the same identity and materials.

The attack uses whole-body coiling, raised-blade anticipation, hip/shoulder rotation, a down/across strike, extended follow-through and guard recovery. Taking damage moves the head, shoulders, chest, knees and protecting arm together. The sword stays in his right hand. Idle uses six guard/breathing drawings.

## Compatibility

- All 350 slots are updated: five 16-frame portrait sheets and five 54-frame action sheets. Filenames, rank rules and pose hooks remain.
- Logical frames remain 96x160 and 128x176. Native resolution is doubled to 192x320 and 256x352 to retain finer shading. Percentage-based selection stays compatible.
- A Judah-only transparent art wrapper compensates for the full-body framing while preserving figure layout. Motion comes from the drawings; the old CSS translation offsets on Judah were removed. Roman assets and styling are unchanged.
- Visual attack fits the existing 920 ms combat window. Damage starts at the unchanged 240 ms impact and has 680 ms to recover. CombatDirector, impact events, reveal timing, scoring and gameplay clocks are unchanged.
- Both recoveries finish on the pixel-identical canonical guard. The old attack's unrelated celebration frames and 1.1-second overrun were removed from visual playback.

## Source and regeneration

Original source sheets and prompt specifications are in art/judah/. The built-in image-generation tool created the art. No external copyrighted sprites were used. scripts/judah_art.py isolates complete figures, aligns a common scale/ground line, packs the slots and writes an indexed 256-color PNG palette without dithering. It does not rotate or independently animate body parts.

With Python and Pillow available:

```powershell
python scripts/build-pixel-art.py --judah-only
python scripts/build-adventure-art.py --judah-only
python scripts/check-adventure-art.py
node scripts/build-site.mjs
```

scripts/judah_animation.py writes only Judah's atlas playback CSS. Source PNGs are outside dist/ and are excluded from the static runtime payload.

## Verification

- Production build and all nine automated suites passed, including combat, engine and storage tests.
- All 350 frames decode, fit inside all four cell edges, and preserve distinct movement/action poses. Both recovery endpoints match the initial guard for every rank.
- Automated timing checks tie attack duration to combat completion and damage duration to the remaining post-impact window.
- Browser inspection used the production renderer, CSS and CombatDirector at gameplay size. Anticipation, overhead windup, impact, follow-through, recoil and recovery were captured at representative times. Full Novice/Master playback returned to ready.
- Actual quiz tests covered correct-answer attack/reveal and wrong-answer recoil/reveal, preserving points and life loss. Desktop and 390px mobile-width layouts were inspected, with no horizontal overflow or application JavaScript errors observed.
- Student promotion/transformation and the Level 6 walking/running journey were checked in the real game.
- Browser diagnostics included asynchronous message-channel errors matching the embedded-browser integration; no game-module exception was identified.
- Test profiles were disposable localhost profiles; existing user progression was not overwritten.

## Quality assessment and limits

Anatomy, silhouette, shading and whole-body action now approach the soldier's finish much more closely. This remains six-pose arcade animation. Additional hand-refined in-betweens and small face/hand continuity corrections could improve fluidity further; professional-quality parity is a visual review judgment, not something a build certifies.

The ten runtime PNGs total about 1.63 MB. Higher-resolution textures use more decoded memory (about 19.5 MB per loaded action atlas). Physical low-end phones, Safari/Firefox and sustained frame-time profiling were not tested. Indexed palettes reduce downloads, but not texture memory.

Gameplay, questions, scoring, lives, shields, saved progression, audio logic and deployment configuration were not edited. No commit, push or deployment was performed.
