# Lions Gate Sword Sharpener — local quality audit

Date: October 25, 2026. Baseline HEAD: `2eb3408`.

**Verdict:** No remaining confirmed gameplay blocker found after three targeted fixes. The local production build and all nine default automated suites pass. Suitable for deployment review, subject to the device/performance limitations below. Nothing was committed, pushed, or deployed.

## Scope reviewed

All 11 incoming changed/new files were inspected:

| File | Review |
| --- | --- |
| `dist/app.js` | Combat integration, input guards, reveal timing, clocks, navigation, audio, persistence |
| `dist/index.html` | Stylesheet order and image preloads |
| `scripts/build-site.mjs` | Static output validation and combat test inclusion |
| `dist/combat.js` | Frame scheduling, cancellation, reduced motion, impact and finish callbacks, sprite selection |
| `dist/combat.css` | Desktop/mobile placement, atlas frames, layering and motion |
| `dist/assets/console/roman-soldier.png` | Image structure, actual appearance, dimensions and payload |
| `scripts/test-combat.mjs` | Assertions and coverage; executed |
| `scripts/test-combat-browser.mjs` | Browser scenarios and assertions; reviewed, extended, syntax-checked, not executed |
| `combat-preview.png` | Visual inspection |
| `.verification/1100-correct.png` | Visual inspection |
| `.verification/mobile-impact.png` | Visual inspection |

Story traced: answer input → production question engine → local save → combat impact/HUD/audio → accessible answer dialog → next question or level result. This is a static client application; there is no gameplay API or remote database to verify.

## Confirmed bugs fixed

1. **Audio settings interrupted combat.** SFX/music toggles rerendered the app, canceling the active combat director and opening the reveal early. During combat these controls now update their labels/settings without rebuilding the game screen. Browser regression evidence after toggling: `data-combat="recover"`, dialog still closed; normal reveal followed recovery.
2. **Rewards and penalties appeared before impact.** Submission updated the displayed score/lives/streak immediately, before the 240 ms impact; the count-up then restarted from the previous score. The HUD now uses a temporary presentation snapshot until impact, then renders the authoritative engine result and animates it. Saving/scoring still happen immediately and are unchanged. Browser evidence: score `000000` during windup; last life still present during strike; score tick-up observed during impact; final values correct.
3. **Particles and reward popups inherited answer-letter styling.** Broad `.answer>span` selectors gave inserted effect spans unwanted borders/backgrounds. Scoped those rules to the first child in `dist/style.css` and `dist/console.css`. Browser computed styles at impact confirmed `0px` borders on both particle layer and score popup.

Audit implementation changes are limited to `dist/app.js`, `dist/style.css`, `dist/console.css`, and additional assertions in the incoming optional browser regression script. This report is new. The temporary audit fixture was removed. Engine, question content, storage schema, ranks, Judah artwork, and gameplay rules were not edited.

## Executed verification

| Check | Result and evidence |
| --- | --- |
| Production build/default suite | PASS: `node scripts/build-site.mjs` (same command behind both `npm test` and `npm run build`); Node v24.22.1, 65 production files, 64 local references |
| Content validation | PASS: 42 approved questions; 80-book scope; personal-reference, excluded-content, citation and stale-review rejection |
| Engine | PASS: scoring, multipliers, timeout, life/shield rules, duplicate submissions, powers, perfect bonus, transitions, ranks through level 10001, 2,000 generated stages |
| Storage | PASS: 61 perfect levels, 12 bosses, promotions/degrees, save roundtrips, corrupt/blocked storage, badges, record deduplication and weekly filter |
| Audio | PASS: all 18 cue schedulers, mute/re-enable, suspended context, race handling and unavailable-audio fallback |
| Juice | PASS: animation/frame/timer cleanup, particle cleanup, reduced motion, no engine-state dependency |
| Judah/focus | PASS: rank/degree coverage, 7:3 focus weighting, all three trap types and draft/stale-review rejection |
| Adventure | PASS: phases, suspension, skip/cancellation, five complete levels, timer isolation, seals, routes, art coverage |
| Answer reveal | PASS: correct/wrong/timeout/shield content, immutable source, escaping, long-text region, focus, lifecycle and scroll locking |
| Combat | PASS: correct/wrong/timeout/shield, single impact, duplicate rejection, cancel, reduced motion, score/life immutability |
| Raster art validation | PASS: `scripts/check-adventure-art.py`; all 270 action-frame slots and 21 scenery planes decode; distinct walk/run poses, no empty states, swords in bounds |
| HTTP assets | PASS: all 65 production files returned HTTP 200 from the local server |
| Desktop browser | PASS at 1100×900: correct/wrong feedback, actual score tick-up, recoil/strike/recovery, impact SFX diagnostics, dialog and continuation |
| Mobile browser layouts | PASS at 390×844 and 320×568: no horizontal document overflow; answer, HUD, powers and modal fit. These are desktop Chromium viewport tests, not physical-device tests |
| Long explanation | PASS: production reveal/controller with a 32-paragraph fixture at 320×568 and 1100×900; internal scrolling, accessible scroll region, visible Continue, keyboard completion and focus restoration |
| Keyboard | PASS: dialog Tab containment, Escape continuation, Enter Continue, focus on question/result; no timer running during reveal |
| Pause and reload | PASS: pause retained the same clock value across checks; reload recovered pending feedback and score; promoted Student run resumed at Level 6 with 30,650 points |
| Powers | PASS in browser: +15 seconds, exactly two eliminated choices, consumed shield and protected wrong answer; powers persisted into following question |
| Timeout/game over | PASS in browser: short real countdown produced one penalty and time-expired reveal; last-life wrong answer reached zero lives, then Game Over only on Continue |
| Gatekeeper finish | PASS in browser: 9→10 seals, 1,000-point answer, 750 perfect bonus, Student art/rank, Level 6 journey and automatic arrival. Fixture used the real engine to reach the final boss question; this was not a manual replay of all 50 questions |
| Real Web Audio rendering | PASS: browser `scripts/audio-lab.html` rendered all 18 production cues with nonzero RMS and peaks below clipping; muted output was digital silence — 19 checks passed |
| Browser diagnostics | No application-module exception observed on the clean test origin. Earlier session logged asynchronous message-channel errors associated with browser integration; these were not attributed to game code. The disposable fixture origin requested an absent default `/favicon.ico` (404); no referenced production asset was missing |

Tests used isolated localhost origins and disposable engine-generated profiles. The live site's and user's existing saved progression were not accessed or overwritten.

## Judah artwork recommendation — no artwork changed

The mismatch is visible in the existing preview and live combat. Judah has flatter, larger color areas and a narrower, more schematic torso/limbs; the soldier has denser anatomy, metal/leather highlights, folds and texture. Judah's action frames are **128×176**; the soldier atlas is **1536×1024**, six **512×512** cells displayed smaller. That difference in effective pixel density contributes to the mismatch; increasing CSS size alone will not add detail.

For a later art pass, establish a shared native pixel scale, lighting direction, outline weight, ground line and human proportions. Redraw Judah with fuller shoulders/forearms/hands, clearer facial planes, clustered dread highlights, cloth folds, controlled shadow ramps and material highlights. Carry the same quality through every action frame and all five rank outfits, preserving his Black identity, dignity and recognizable silhouette. Preview at actual game size, including mobile, before replacing atlases. Avoid simply upscaling or smoothing the current sprite.

## Remaining attention and verification limits

- The soldier PNG is **2,295,756 bytes (~2.30 MB)** and is preloaded on the title page. This is a concrete first-load payload concern on slow mobile connections. Optimize losslessly or re-author at the agreed sprite scale in a separately approved art/performance pass; it was not changed in this audit.
- Combat uses bounded scheduled phases; no runaway combat loop or state mutation was found. This is not proof of sustained FPS on low-end phones. No CPU/network throttling, frame-time profiling or long-session memory soak was performed.
- No physical Android/iPhone, Safari, Firefox, hardware speaker listening, or screen-reader session was tested. Waveform generation and active audio diagnostics do not prove subjective loudness or a device's audio routing.
- Reduced-motion behavior and hidden-tab journey suspension passed automated controller tests; OS reduced-motion preference and real tab-visibility suspension were not independently reproduced in the embedded browser. Creating another hidden test tab did not establish a real visibility transition.
- `scripts/test-combat-browser.mjs` is an **optional standalone Playwright runner**, outside the dependency-free default suite. It was reviewed, extended with pre-impact HUD/audio-toggle/effect-style regressions, and syntax-checked, but was not executed. Focused equivalent gameplay cases were exercised through the available browser interface. Its newly added assertions remain runner-unverified.
- The earlier direction described symbolic obstacles; the current incoming changes add a human Roman soldier in ordinary rounds. This is a product/art-direction decision for the owner, not a mechanics bug; it was preserved.
- No deployed Vercel instance or deployment configuration was changed/tested during this local audit. Local build success does not certify a future deployment environment.

Review the uncommitted diff before deciding to commit/deploy. No confirmed remaining issue requires a gameplay redesign or progress migration.
