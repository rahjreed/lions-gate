# True defeat-based combat

Owner-authorized implementation, 2026-10-27. Supersedes the survival-of-ten-questions rule documented in the historical COMBAT_VICTORY_AUDIT.md.

## Rules and compatibility

- Ten correct answers defeat either a regular opponent or Gatekeeper. Each successful answer removes exactly 10% enemy health. Wrong answers and timeouts cost one life unless protected by the existing consumable Shield.
- Battles continue beyond question ten until the opponent reaches zero health or Judah reaches zero lives. Examples: 10/0, 10/1, 10/2 and 10/4 win after 10, 11, 12 and 14 questions; 9/5 loses after 14. Shielded errors may extend the battle further.
- Five remains the maximum lives. Existing carry-over lives between levels are preserved; new runs and retries restore five. No offensive power exists: 50:50, extra time and Shield keep their support functions and consumption rules.
- Scoring, multipliers, perfect bonuses, ranks, armor, question content and approved-bank membership are unchanged. Retry rewards still pay only improvements above the encounter's previous points high-water mark.
- Flawless still means ten correct answers and no mistakes, including shielded mistakes. Two consecutive new flawless clears restore one existing support-power use according to the established stock rules.
- Save version/key remain 3. Original ten-entry queues, existing remaining lives, records and already-completed levels remain valid. Historical imperfect clears are not revoked. Incomplete battles use the new defeat rule on continuing.

## Files and functions

- `dist/engine.js`: `HITS_TO_WIN`, `successfulHits`, `advance`, `resetLevel`, `validRun`. Victory tests successful hits, not question index. When the initial queue runs out, the existing approved difficulty-aware selector supplies one additional question, preferring questions not already in the encounter. Its recent-history, difficulty, topic and approval checks remain in force. Repetition is possible with a constrained eligible bank. Validation accepts extended queues while retaining the initial ten-question uniqueness check. The 20-entry save bound accommodates all possible encounters with five lives and up to three saved Shield uses; it does not end combat or cap progression.
- `dist/battle-dialogue.js`: `queueBattleDialogue` now uses remaining successful hits rather than an index-under-nine check. Ninth-hit and one-life exchanges still work after question ten and never queue after a terminal hit.
- `dist/app.js`: question count and hit progress replace the misleading `/10 questions` indicator; continuation text and player manual use actual knockout conditions. `playCombat` retains one 240ms damage-display impact. `restoreCombatPresentation` replays an interrupted presentation without resubmitting its answer, and restores terminal poses for completed presentations or older saves. The additive `combatPresentation` checkpoint is persisted at answer acceptance and completion. Timers stay stopped during feedback and finishes. Existing pause/resume and rapid-input guards remain intact.
- `dist/storage.js`: malformed optional presentation metadata is discarded without losing the valid saved run.
- `dist/combat.js` / `dist/combat.css`: final-hit anticipation uses the existing stance drawing, followed by a deeper lunge, stronger slash/contact, held follow-through and recovery. Existing two fall variations have a revised arc, ground compression and smaller rebound. Finish duration remains 1600ms; normal hits remain 920ms. Downed poses remain visible after redraw and in reduced motion. No atlases were regenerated.
- `dist/audio.js`: original `enemyDefeat` falling harmonic digital-grunt patch, lasting about 290ms. Plays at enemy ground contact, or with the simplified reduced-motion knockout. Existing SFX bus, unlock, mute, envelopes and bounded gains apply. Judah's existing defeat sounds remain.
- `dist/index.html`: removes the obsolete ten-questions-per-level metadata claim. The regenerated service worker includes the changed offline shell; save storage is unchanged.
- `GAME_PROGRESSION.md`: records the authorized rule while preserving Level 700 design boundaries and armor milestones.
- Tests: updated `test-combat.mjs` and `test-phase3.mjs`; converted the historical audit characterization script to `test-combat-victory-audit.mjs` regression coverage and included it in `build-site.mjs`.

## Verification

- Production build: 107 files, 96 resolved asset/module references, all 24 configured validation/test scripts passed.
- Supplementary campaign-boundary, curriculum-coverage, local-publication and both candidate snapshot/evidence suites passed; whitespace validation passed. The 15 pre-existing KR-101–150 candidate quality warnings remain unchanged. All 110 published records and evidence retain their protected hashes.
- New regression coverage: 12,288 answer-order/life/Shield/regular/Gatekeeper combinations; complete 10/0, 10/1, 10/2, 10/4, 9/5 and shielded 15-question encounters; saves after every answer at Levels 1, 5, 335 and 700; fresh extensions and retry points protection.
- Actual app-function integration: single impact/advance, normal and terminal exchanges, reduced motion, rapid taps, pending-finish restoration, old saves and stable terminal redraws. Existing tests cover pause/background timing, powers, flawless rewards, ranks, armor, PWA caching and publication isolation.
- Browser inspection: real regular encounter continues from question 11 to 12 and wins only at zero HP; Gatekeeper final slash/fall; nine-hit/five-loss Game Over and retry; Shield-blocked error; 320x568 and 390x844 mobile layouts; completed-feedback reload; SFX reports running with `enemyDefeat`. Desktop production-frame contact/airborne/ground/settled views were inspected separately. Some reloads logged browser message-channel-closed errors without a game stack or observed gameplay failure; the Gatekeeper log was empty. Their browser-integration origin is an inference, not confirmed.

## Limits

The fall reuses existing recoil artwork with timed movement/rotation; it is not a newly drawn multi-frame prone atlas. Reduced-motion terminal behavior is covered by automated frame/CSS checks and a static production-frame preview, rather than a physical-device preference test. Browser audio scheduling/unlock/mute were verified; final subjective sound quality should be reviewed locally. Physical Android/iOS/PWA installation and device audio were not tested. Interrupted pending presentations restart their short visual sequence; they never repeat damage, score or power consumption. Published question records and evidence remain unchanged. No commit, push or deployment was performed.
