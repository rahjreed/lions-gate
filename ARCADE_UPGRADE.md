# Scripture Arcade V3

## Inspection and reuse

The existing site is a buildless, static HTML/ES-module app. There is no API, database, account system, or server-owned score authority. The existing 80-book KJV allowlist, Scripture question records, fixed review approvals, public Scripture links, correct/incorrect feedback, and synthesized-audio approach were retained. The former single-round state machine was extracted into a pure endless-run engine rather than introducing a framework or backend dependency.

## Implemented stages

1. Pure engine: ten questions per level, three lives, timeout loss, streak multipliers, perfect bonuses, completed-level ranks, and formula-based degrees. Phase 1 tests passed before visual work. Stage generation was exercised for 2,000 levels; ranks were checked through level 10,001.
2. Browser integration: original SVG pixel landscapes and sword, animated flames/sword/confetti, console-style title/menu/HUD, level and promotion screens, sound effects, original synthesized background music, pause/resume, and responsive layouts. No game characters, sampled music, or game artwork were imported.
3. Thirty passage-reviewed questions: 10 foundation, 10 challenger, 10 context. Four Tradition Traps address wise-men counting, the house in Matthew, the seventh day in Genesis, and stones David selected. Levels 2–4 unlock challenger material; level 5 onward unlocks context material. Every fifth level prioritizes traps and doubles points. Every level uses ten distinct questions, shuffles choices, and selects least-seen then least-recently-seen approved questions. Difficulty plateaus at tier 3; there is no claim of unlimited unique content.
4. Local persistence: resumable runs, nicknames, settings, personal best score and completed levels, six achievement badges, and five environments unlocked after 0/5/15/30/50 completed levels. Hall of Masters defaults to real records on this device; its online-demo tab has conspicuously labeled fictional sample data. Global rankings are not activated.

## Rules

- Base answer score: 100. Multiplier: `min(5, 1 + floor(streak / 3))`, calculated after incrementing the streak. Boss answer score is doubled.
- Mistakes and timeouts reset streak and cost one life unless a shield is active. Shield use still resets the streak on a mistake. Three 50:50, two +15-second, and one shield use per run.
- Perfect-level bonus: `500 + 50 × level`. Levels are completed only after ten answers with at least one life remaining.
- Rank follows the next unlocked level after completed levels. Clearing 5 unlocks Student at level 6; clearing 15 unlocks Scholar; clearing 30 unlocks Scribe; clearing 50 unlocks Master 1st Degree. Further degrees advance every ten completed levels. Score does not determine rank.
- Foundation questions have 35 seconds, challenger questions 40, and context/boss levels 45. Feedback time is unlimited. Pause, hidden-tab auto-pause, and restored runs do not consume time while paused.
- Local completed-run leaderboard sorts by score, then completed levels, then earliest finish, then run ID. Weekly period begins Monday 00:00 UTC. Up to 100 local records are retained. These are editable browser records, not trusted competition results.

## Verification

Run `node scripts/validate-content.mjs`, `node scripts/test-engine.mjs`, and `node scripts/test-storage.mjs` before publication. The storage suite plays 61 perfect levels, observes all 30 questions, clears 12 boss levels, verifies promotions at 5/50/60, and roundtrips persisted state on every level. It also tests malformed saves, unavailable storage, score deduplication, weekly filtering, and spaced repetition.

Browser QA covers the real title/start flow, active question, power-up, pause, reload/continue, timeout feedback, ten-question completion, local rankings, and mobile layout. Pure tests cover higher-level transitions and promotions without injecting artificial progress into player storage.

## Reviewed expansion passages

Each new record was checked against KJV text and its surrounding context on 2026-10-24: Exodus 4:14; Jonah 1:17; Genesis 2:2; Ephesians 6:17; Matthew 2:1–12 and 2:11; 1 Samuel 17:40; Acts 11:26; Romans 12:19; Revelation 21:2; Tobit 12:15; Ecclesiasticus 38:24; 2 Esdras 6:9; Luke 24:44; Hebrews 7:2; Matthew 23:23; Wisdom of Solomon 11:20; Acts 18:24 and 16:14; John 4:5. Assertions are limited to the passage, without identifying modern populations or turning interpretations into facts.

`dist/engine.js`, `storage.js`, `audio.js`, and `art.js` are separate reusable modules. `levelConfig` is the extension point for future bonus-round modes; independent bonus rounds are not enabled in this release. `QUESTION_AUTHORING.md` remains the required editorial gate: a citation alone never verifies an answer.
