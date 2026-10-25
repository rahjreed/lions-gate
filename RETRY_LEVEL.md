# Retry current level — 2026-10-25

## Player behavior

- Defeat at zero lives offers a primary **Retry Level** action ahead of secondary results, plus a separate **New Game** action. The title screen also offers the saved defeated level after reopening.
- Retry keeps the same run identity, level, completed levels, rank/Master degree, earned points, badges and learning history. It restores three lives and resets the streak, question index, answers/enemy health, Gatekeeper seals, base timer, active shield and eliminated choices.
- Power-up counts return to the inventory available at the start of the defeated level. This respects the existing rule that unused inventory carries between levels; retry does not replenish power-ups spent on earlier levels.
- Question selection prefers questions outside the previous attempt's queue, while retaining verified content, difficulty and focus/trap requirements. Reuse is possible where the eligible pool or quotas require it.
- Deliberately ending a still-live run remains an end-run action, not a defeat checkpoint. New Game starts at Level 1 through the existing new-run flow.

## Points and rewards

Each level stores its highest attempted answer-point total. Retry starts a new attempt total at zero but keeps all previously banked points. A correct answer pays only the portion exceeding that level's previous highest attempt total.

Example: after banking 400 answer points before defeat, retrying up to an attempt total of 400 adds nothing. Reaching 600 adds 200. Failing and repeating that 600-point attempt adds nothing more. Normal first-attempt scoring and incoming streak multipliers remain unchanged; a high incoming streak can leave more points banked than a fresh retry can earn.

Perfect-level bonuses and Gatekeeper clear counts are awarded only on the successful clear, once. Retry cannot reopen an already cleared level. The next level starts a new point ledger. Correct answers with no new points display “Points already banked” in the reveal. Current leaderboard rows are removed when their run becomes active again; repeated defeats replace the same run's record rather than adding duplicate entries.

## Saves and offline behavior

The existing version-3 local-save key and run are retained. An optional validated `levelRewards` checkpoint stores the level, best/active attempt totals and starting inventory. It is saved through the same persistence path as answers and timers.

Older saves without this checkpoint are accepted. Their already awarded current-level answer points are used as the initial high-water mark. Their currently remaining inventory is retained because earlier current-level power usage cannot be reconstructed reliably. New levels/retries subsequently use the new checkpoint normally.

The production build regenerates the service-worker revision with the updated engine, UI and persistence modules. Existing PWA sessions still update only after their windows close, as before. No artwork, combat timelines, question content, rank thresholds or ordinary level-clear rules were changed.

## Verification

- Full production build and automated suite passed, including new retry tests at Levels 1, 5, 75 and 120.
- Tests cover life/timer/shield/power resets, fresh question preference, saved defeat and active retry checkpoints, old saves, rank preservation, repeated failures, improved-then-repeated attempt totals, incoming streak points, single perfect/Gatekeeper rewards, next-level scoring, duplicate-action rejection and leaderboard cleanup.
- Browser checks: Level 3 title-screen retry; active retry reload; correct-answer “Points already banked” feedback; Level 5 defeat/result action and Gatekeeper reset; Level 120 seventh Master degree preservation; prominent mobile Retry/New Game controls at 390×844.
- With the local server stopped, the PWA cache reopened a Level 120 defeat, successfully retried it, preserved score/degree, and restored the active checkpoint again after another refresh.
- Physical installed Android/iOS apps were not tested. Local PWA behavior was tested in the in-app Chromium browser. For a deployed existing PWA, close all its windows to receive the reviewed update.
- Temporary test fixtures were removed. No commit, push or deployment was performed.
