# Combat presentation verification — 2026-10-25

## Implementation

- The unchanged Roman atlas now has a restrained 3.6-second planted-foot breathing/weight-shift loop. Its sword and shield move with the existing drawing. Idle motion stops during attacks, recoil and defeat, then resumes at ready. No character artwork was changed.
- Two labelled, accessible arcade meters sit directly above the arena. Judah has three life segments; the Roman guard has ten damage segments. Damage starts at the existing 240ms combat impact, with a bright flash, smooth depletion and delayed red trail.
- Health is derived from existing current-level accepted answers and remaining lives. There is no new saved health counter, damage authority or save migration. Shielded misses leave Judah's meter unchanged. Repeated rendering/events cannot subtract health again.
- A tenth correct answer triggers the existing hurt pose followed by a stepped collapse/fade using an existing atlas pose. Collapse begins at 540ms and finishes at 1300ms; the answer modal opens only afterward. Judah recovers at the original 920ms point. Ordinary answer timing is unchanged. Cancellation invalidates pending callbacks; reduced motion skips the animated fall.
- Reloading a saved final-answer reveal restores the defeated state directly rather than replaying a strike already accepted by the engine.

## Preserved progression tradeoff

Levels still finish after ten answers when Judah survives, regardless of accuracy. Consequently, an imperfect clear can leave the guard with health remaining. The guard falls only at zero health; no artificial damage, forced knockout or extra questions are added. A caption explains this distinction. Each new level resets enemy health to 100%; Judah retains the actual remaining lives from the run. Gatekeeper seals and promotion rules remain unchanged, including imperfect Gatekeeper clears.

## Verification

- `node scripts/build-site.mjs`: all nine existing suites passed, including expanded combat/health tests; 65 distribution files and 64 local asset/module references checked.
- Automated checks cover correct, wrong, timeout, shield, impact snapshots, duplicate rejection, immutable gameplay state, zero lives, imperfect clears, next-level reset/life carryover, exactly-once defeat completion, canceled timers and reduced motion.
- Browser checks in the in-app Chromium browser: idle loop, attack/recoil/ready poses, pre-impact and post-impact meter values, correct and incorrect reveals, shield protection, timeout, zero-life game over, perfect final strike, imperfect clear, next-level reset, saved-life restoration, and a Level 5 Gatekeeper knockout followed by Student promotion.
- During the final-strike browser check, the scene was in `defeat` with enemy health zero and the answer dialog's `open` property false; the dialog opened after `defeated`.
- Desktop and 390px mobile layouts were visually inspected. Both meters remain legible and the mobile layout has no horizontal overflow. Screenshots were captured outside the repository.
- `git diff --check` passed. Engine, questions, storage, audio, Judah art, Roman atlas and deployment configuration were not modified.

## Limits

- Real phones, other browser engines, native reduced-motion preference and instrumented frame-rate profiling were not tested. Reduced-motion logic was covered by automated tests.
- Browser logs contained asynchronous message-channel listener errors without a game stack trace. Gameplay checks completed; their origin was not independently isolated.
- The guard uses subtle whole-sprite motion and an existing-pose collapse, rather than newly drawn idle/fall animation frames.
- No commit, push or deployment was performed.
