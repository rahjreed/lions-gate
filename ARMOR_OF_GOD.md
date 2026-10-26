# Armor of God — current implementation and progression roadmap

## Delivered scope

This implements the user's permitted Belt-first fallback. **Only Level 75: Belt of Truth is earnable.** The Armory now previews all six pieces in Ephesians 6:14–17 order, with names, Scripture references, milestones and distinct locked/equipped states. The other five pieces are marked planned and not yet earnable; their collection icons are not equipped character layers. The Full Armor achievement is not enabled or silently granted.

The authoritative campaign plan is [GAME_PROGRESSION.md](GAME_PROGRESSION.md): **Kingdom entry follows successful completion of Level 700**, not 450. In the completed design Judah retains all six pieces through Levels 451–700. That fully armored stretch and the Kingdom transition remain unimplemented; current saves and playable content are preserved.

The belt is an original gold-edged teal waist belt with stitched detail and a bright buckle. It is additional cosmetic equipment, not a rank replacement. Judah's existing face, skin, locs, anatomy, outfits, base images and animation timing are unchanged.

The achievement reveal cites [Ephesians 6:14 in the KJV](https://www.kingjamesbibleonline.org/Ephesians-6-14/), whose truth/girding instruction is the source for this cosmetic belt. The Level 75 threshold is a game achievement rule, not a claim made by the biblical passage.

## Atlas approach

- Existing pipeline: five 16-frame portrait atlases and five 54-frame action atlases, with separately fitted damage poses and pixel-identical recovery frames.
- Added ten sparse transparent belt atlases, one per existing rank/family, covering **350 frames**, plus a standalone award icon. Character atlas files were not duplicated or changed.
- Belt atlas layers total **74,079 bytes**; including the icon, the equipment artwork is **74,615 bytes**. Production remains dependency-free. Python/Pillow is only used by the authoring script.
- The visual layer inherits the base sprite's computed atlas background position/size. There is no separate animation clock, CSS body transformation or runtime image redrawing. The outgoing rank-transformation layer also retains its belt.
- Pose-specific waist geometry, original silhouette masks, steel-blade preservation and foreground-arm cutouts keep the belt attached and behind intersecting weapon arms. The belt cannot extend into the head/hair region.
- `scripts/build-belt-art.py` reproduces the layers. `art/judah/belt-fit.json` records source hashes, frame bounds and recovery hashes; changing the source artwork requires reviewing/refitting the belt.

## Unlocks and persistence

- The existing profile gains an optional `armor` object containing canonical `unlocked` and `pending` ID lists. Existing save version/key and run data are preserved.
- Unlock checks use successfully completed levels (`bestCompleted` / saved run's `completed`), never the current level number. Level 75 entry, defeat, retry and the final answer's pre-clear feedback do not unlock the belt.
- Successful completion permanently unlocks and equips the belt. A pending, keyboard-accessible native achievement dialog survives refresh until acknowledged. Acknowledgment is saved and duplicate claims are ignored.
- Equipment survives retries, refreshes, offline relaunches and deliberate New Game. Earlier saves with an already-earned completion record receive the belt retrospectively once; unearned IDs are not trusted from a raw equipment list.
- The belt appears on title portraits, gameplay poses, combat replacements/recovery, celebration/victory, walking/running transitions, rank transformations and Armory previews. The Armory displays permanent ownership and the Scripture reference.
- No points, damage, shields, lives, power-ups, question difficulty or rank thresholds change. Unlocking/acknowledging armor does not mutate the run.

## Verification

- Production build and full automated suite passed, including new armor tests for the completed-75 boundary, milestone defeat/retry, pre-clear feedback, save/reload, legacy saves, one-time reveal, New Game permanence, rank preservation, cosmetic-only state and all rank/pose markup.
- All 350 layer frames have bounded waist geometry; base source hashes are unchanged; attack/damage recovery hashes match the first guard. Generated armor URLs are included in build reference checks and the complete PWA cache revision.
- Raster contact sheets were reviewed for master action poses, portrait waist placement and the distinct rank damage poses.
- Browser: completed Level 75 from the final question; verified no premature belt during answer feedback; achievement appeared after clear. The reveal fit at 390×844 and 320×568 with its button and Scripture reference visible.
- Refresh preserved the pending award; acknowledgment removed it. Level transition, actual sword attack and actual damage reaction showed identical base/overlay atlas positions. The pose review covered all 13 portrait/action pose families, including outgoing transformation layers, at gameplay and enlarged sizes.
- Browser checked Armory ownership and all rank previews, a Level 76 retry retaining the belt, and offline reload/restore with the local server stopped, without a duplicate award.
- Physical installed Android/iOS apps, Safari rendering and OS reduced-motion preferences were not tested. CSS inherits the existing reduced-motion frame selection, but that native preference remains visually unverified.
- Temporary browser fixtures and owned preview server were removed/stopped. No commit, push or deployment was performed.

## Remaining milestones

| Completed level | Remaining equipment |
| --- | --- |
| 150 | Shoes of Peace |
| 225 | Breastplate of Righteousness |
| 300 | Sword of the Spirit |
| 375 | Shield of Faith |
| 450 | Helmet of Salvation, then Full Armor of God achievement once all six pieces exist |

Each remaining item needs original artwork fitted to all existing frames, occlusion review (especially hands, locs and face), cumulative-layer composition tests, its own Scripture-grounded reveal and milestone tests. The same sparse-layer approach can avoid duplicating armored character atlases for every combination. Full Armor must wait until all six completed milestones have reviewed visual equipment.

These are completed-level unlock requirements, not a wilderness ending. The Armory's biblical display order is independent of acquisition order. No equipment is delayed to Level 700 or removed upon reaching a later level.

For an existing PWA cache, allow the update to download, close all game windows and reopen before reviewing the new artwork.
