# Mobile viewport repair — 2026-10-25

## Root cause and scope

The title screen has much smaller minimum content requirements than gameplay. Gameplay combines controls, health, an arena, a variable-length question and four answer choices. Its previous minimum-content sizing could exceed short portrait screens, and its mobile rules stopped at 760px wide, excluding common phone landscape dimensions.

The existing visual-viewport resize listener only remeasured layout overflow; it did not use the actual visible viewport dimensions. This left the shell dependent on CSS viewport units while mobile keyboards/toolbars changed the visible area. The mobile player-name field was also 13px, a likely iPhone focus-zoom trigger. The previous viewport metadata allowed user zoom. These are code findings; reproducing the user's exact Safari behavior requires a physical iPhone.

## Changes

- Added `viewport.js`: measures the visible viewport on resize, orientation changes and page restoration. Writes shared CSS dimensions without altering game state. Normalizes any browser-forced zoom override rather than shrinking content into a magnified viewport.
- Added `viewport.css`: applies measured dimensions, safe-area padding and readable mobile input fonts (16px). Extends responsive sizing to short phone landscape windows. No whole-game scale transform was introduced.
- Gameplay first attempts its normal layout, then uses tighter spacing and proportional arena sizing only when measured content overflows. If that still cannot fit, vertical scrolling remains enabled. All answer targets remain at least 48px high in compact mode.
- Answer reveals use the measured visible area, retain internal explanation scrolling and keep Continue accessible. At exceptionally short heights below 280px, the entire dialog can scroll.
- Added fixed-scale viewport metadata, `touch-action: pan-y`, non-passive multi-touch and Apple gesture cancellation, plus touch double-tap safeguards. Single-finger scrolling and ordinary rapid control taps remain available.
- Production build regenerates the existing service-worker asset list/revision, including the new viewport files. Manifest, install behavior and local-save format are unchanged.

No character assets, combat timing, scoring, health calculations, questions, difficulty, armor logic, retries or saved-progress modules were edited.

## Verification

All browser checks below used the desktop Chromium in-app browser with viewport resizing. They are not physical-device or Safari-engine tests. QA fixtures use isolated localhost storage, not the deployed game's saved progress.

| Check | Result |
|---|---|
| Every live question at 375 × 667, with simulated 44px top / 34px bottom safe areas | 42/42 fit; 9 use compact spacing; no horizontal overflow; all four answers present and touch targets ≥44px |
| Every live question at Android-style 360 × 640 | 42/42 fit; no horizontal overflow |
| Every live question at 320 × 568 | 41/42 fit; longest question has a reachable scrolling fallback; no horizontal overflow or clipped answers |
| Fresh title → name field → gameplay at 390 × 744 | Default scale 1, 16px input, all controls/answers visible |
| 390 × 744 → 844 × 390 → 390 × 644 | Measured viewport updates; no horizontal overflow; short landscape can scroll; pause preserves question and timer |
| Larger phone 412 × 915 | Gameplay fits; pause/resume works |
| Desktop 1280 × 800 | No horizontal overflow; existing desktop vertical scrolling retained |
| Correct and incorrect answer reveals | Correct content/status and Continue displayed inside viewport |
| 32-paragraph explanation at 390 × 644 and 844 × 390 | Internal text scrolling works; Continue remains visible |
| Extreme 568 × 250 dialog | Whole-dialog scrolling fallback works; Continue reachable |
| Game Over at 360 × 640 and 320 × 568 | Retry, New Game, level and score visible together |
| Promotion/celebration at 375 × 667 | Fits; achievements and buttons visible |
| Promotion at 320 × 568 | All important content reachable; 2px vertical fallback retained rather than clipping |
| Simulated background lifecycle | Question time retained, combat suspended, one result/impact, answer reveal restored, pagehide checkpoint saved |
| Synthetic gestures and event unit tests | Pinch/Apple gesture/background double-tap cancellation passes; single-touch pan and ordinary button taps preserved |
| Production build / configured full suite | PASS: all 17 validation/test scripts; 95 production files and 90 local references checked |
| PWA automated tests | PASS: complete offline shell, atomic update failure, scoped cache cleanup, unchanged saves and supported install UI |

Final production build: `node scripts/build-site.mjs` on Node v24.22.1. Offline revision: `6fa1e744915fc58a66e9`.

The new viewport unit suite also covers visual/layout viewport differences, keyboard-like visible-height reduction, rotation, browser-enforced scale normalization, tiny-window fallback, metadata and normal desktop input behavior. The fit suite covers adaptive compact spacing and accessible fallback.

## Remaining device checks

- Actual iPhone Safari and Android Chrome pinch/double-tap gestures, native focus keyboard and dynamic toolbar animation.
- Installed Android/iOS PWA viewport behavior, safe-area values and relaunch/update on a physical device. Full-height layout sizing and offline packaging are locally verified; installation itself is not.
- Safari can ignore viewport zoom limits. CSS and gesture cancellation provide additional defenses, but a webpage cannot guarantee suppression of browser accessibility overrides or OS magnification. Do not describe synthetic event tests as proof that all native zoom is disabled.

Relevant platform references: [WebKit interaction behavior](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/), [Apple gesture events](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html), [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action), [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

Browser logs showed extension-style asynchronous message-channel errors during navigation; no application exception was observed in the checked flows. These logs do not establish a clean physical-device console.

No commit, push or deployment was performed.
