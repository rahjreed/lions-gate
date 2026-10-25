# Judah source art and prompt set

Created with the built-in image-generation tool. These original project assets are retained so atlas builds need no further generation request.

## Accepted prompt specifications

1. **novice-source.png:** transparent 6×6 full-body pixel-art sheet for an original brown-skinned Black Hebrew warrior with shoulder-length locs and beard. Humble olive/brown split linen tunic, leather belt/boots/wrist wraps, dark trousers, steel sword with modest brass guard. Cohesive connected athletic anatomy, balanced bent-knee guard, dimensional skin/hair/cloth shading, crisp early-1990s arcade pixel clusters. No armor, scenery, text, effects, copyrighted character imitation or detached parts. Rows: six idle/breathing guards; six coiled sword attack/strike/follow-through/recovery poses; six hit reactions; six walking; six running; six modest victory poses.
2. **student-source.png:** edit the novice sheet while preserving the exact 6×6 layout, poses, scale and identity; clothing only changes to muted blue/teal with a modest diagonal leather sash.
3. **scholar-source.png:** same edit constraints; indigo split tunic with restrained brass/gold stitched borders and sash; no armor.
4. **scribe-source.png:** same edit constraints; forest-teal fabric tunic/over-robe with restrained gold seams; no armor.
5. **master-source.png:** same edit constraints; ivory/sand tunic, restrained gold seams, short dignified muted-purple mantle and sash; no crown or armor.
6. **damage-source.png:** replacement transparent 6×5 hit sheet, one rank per row. Columns: initial guard/flinch; chest/head recoil; strongest weight-absorbing recoil with protecting left arm; forward recovery; near guard; normal guard. Keep a visible steel sword held in the right hand throughout—no dropped, floating or disappearing weapon. Same anatomy, materials and pixel-art finish, complete figures with transparent margins.
7. **portraits-source.png:** matching transparent 5×4 full-body portrait sheet. Columns: five outfits in rank order. Rows: calm upright idle, modest success gesture, thoughtful reflection, dignified advancement/victory. Narrow stance, vertical sword held close to body, consistent anatomy/identity, complete locs/feet/blade.

The first generated hit row was rejected for omitting the sword. The dedicated damage sheet replaces it. Rank outfit edits retain reference masks when packed so adjoining source edges cannot merge actors. Final attack/hit recovery slots deliberately reuse the initial guard.

Packing uses nearest-neighbor sampling, a common family scale/ground line and an indexed 256-color palette. No body part is independently rotated, stretched or moved. Runtime playback selects complete whole-body frames.
