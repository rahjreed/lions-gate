# Judah — mastery ranks and legacy wardrobe compatibility

Current rank milestones use successfully completed levels, not entry into a level or cumulative replays. The new standard ranks are:

| Completed levels | Rank / wardrobe |
| --- | --- |
| 0–34 | Novice |
| 35–109 | Student |
| 110–184 | Scholar |
| 185–259 | Scribe |
| 260–334 | Master · 1st Degree |
| 335–409 | Master · 2nd Degree |
| 410–484 | Master · 3rd Degree |
| 485–559 | Master · 4th Degree |
| 560–634 | Master · 5th Degree |

After 260, degree = `floor((completed - 260) / 75) + 1`. The title has no artificial degree ceiling; the existing eight-diamond decorative cap is not a rank cap. All degrees use the existing Master wardrobe. Calculations cover the runtime's existing safe-integer level domain, including its upper boundary; no new level cap is introduced.

`rankFor()` supplies current title/degree. `rankProgress()` supplies exact remaining-level counts and bar values. Main menu, gameplay HUD, results, guide, Armory previews/badges and Hall of Masters use the new policy. The Hall displays current rank/degree and retains the same score/completed-level/date/ID ordering. Scores, question logic, combat timing, audio, base artwork and animation assets are unchanged.

## Completion and permanent ownership

Promotion occurs in the existing successful-clear action, after the last answer's feedback. Starting a milestone, answering its last question before clear, defeat or retry do not grant it. No points or combat bonuses are added for mastery.

An optional `run.rankHighWater` retains the highest completed level known to the profile/run. Replaying a cleared level or deliberately starting a new run does not re-award a promotion or remove current wardrobe access. The high-water mark does not add to score, change the current encounter level, advance a question, or sum repeated levels toward mastery. New rank badges are deduplicated in the existing badge list.

## Older saves

The local key `lions-gate-arcade-v3` and profile version 3 remain unchanged. The prior system derived rank and appearance from completion counts (5/15/30/50, then every 10 levels); it did not store a complete rank-unlock ledger. Saved Student/Master badges are retained verbatim.

On first load of a profile without the new `mastery.version: 2` marker, migration snapshots the highest recorded completed level from the existing profile, valid run and saved records as `mastery.legacyCompleted`. Pre-existing record IDs and their original completed levels are captured in `mastery.legacyRecords`. It does not invent missing history or add a current higher rank based on an old badge alone. The migration is saved with the same local key and is idempotent.

- The new title is always computed using the new schedule. A player with 61 completed levels is currently Student, with a separately labeled legacy Master · 2nd Degree honor and continued Master wardrobe access.
- Legacy wardrobe access is shown in the Armory and retained throughout portrait, idle, attack, damage, recovery, victory and transition poses. The original sprite/belt sheets are reused, without new or edited artwork.
- Main menu and Armory explain the legacy honor. Previously earned rank badges below a new threshold are labeled legacy rather than silently removed or presented as new-policy awards. Historical Hall records show their frozen legacy honor separately from their recalculated current rank.
- A legacy pending promotion label is cleared during the one-time migration so an old label cannot be replayed as a new-policy promotion. The underlying run, score, lives, questions, rewards, completed level and retry checkpoint remain intact.
- Subsequent progress does not increase the frozen legacy honor. New-policy players cannot earn an old-policy Master title at Level 50. Current wardrobe ownership persists through new runs independently of the active encounter level.

Limitation: local saves are not authenticated historical records. If completion history was already deleted or corrupted, migration cannot reconstruct every earlier wardrobe/degree. It preserves available valid counts and existing badges, with a clear legacy distinction.

## Armor is separate

The owner explicitly confirmed the schedule in this rank update: Belt 75, Shoes 150, Breastplate 225, **Sword 300, Shield 375, Helmet 450**. This supersedes the earlier Shield/Helmet/Sword ordering. The Armory retains biblical listing order. Only the belt currently has implemented unlock/render layers; all other pieces remain planned. No armor effects, combat shield behavior or earnability were added. Existing belt ownership persists.

Kingdom entry remains planned after completing Level 700; this rank update does not implement entry or post-entry gameplay.

## Verification

`test-mastery.mjs` covers all requested boundaries, degree 4/5 and very high safe levels, successful-clear timing, defeat/retry, duplicate promotion prevention, old/new saves, legacy record/wardrobe preservation, all main pose families, armor milestones and unchanged leaderboard ordering. The production build includes this test alongside the existing full suite. Browser inspection uses isolated loopback fixtures, without overwriting the user's actual saved game.

Verified locally: production build and all 19 configured suites passed, plus candidate integrity, Torah evidence, campaign boundaries, local publication and curriculum coverage checks. Actual browser checks covered a restored 61-level legacy profile (menu, Armory and Hall), and the final answer/Continue flow promoting Novice to Student after completing Level 35. The promotion screen fit 390×844 and 320×568 viewports. Master boundaries were verified automatically; physical phones and installed PWA relaunch were not tested in this update.
