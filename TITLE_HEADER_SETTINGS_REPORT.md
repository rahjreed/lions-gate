# Title, header, and Settings cleanup

- Moved the existing personal statistics panel above the title artwork. It still uses the same profile calculations and appears only once.
- Removed header SFX/Music buttons. Settings retains all three persistent controls. The header navigation is hidden when Pause is unavailable.
- Added an original two-note electronic Settings click. Turning SFX off permits its final confirmation through a dedicated short confirmation bus; regular SFX remain muted. Turning it on confirms after enabling. Music and Dialogue clicks respect SFX mute.
- The existing validated run now determines PRESS START versus NEW GAME. Continue eligibility, overwrite confirmation, and Collection → Study Path → Player Name initialization remain unchanged.
- No artwork, questions, engine, storage, cloud synchronization, or progression modules changed.

## Changed files

Runtime presentation: `dist/app.js`, `dist/index.html`, `dist/audio.js`, `dist/title-branding.css`, `dist/usability.css`.

Regression tooling: `scripts/test-header-ui.mjs`, `scripts/test-header-browser.mjs`, `scripts/test-settings.mjs`, `scripts/test-audio.mjs`, `scripts/build-site.mjs`.

Exact historical integrity bridge: `scripts/header-settings-revision.mjs`, `scripts/fixtures/header-settings-revision.json`, `scripts/firebase-revision.mjs`. This reverses only the recorded presentation/audio edits for historical snapshot checks; unrelated edits still fail those checks.

Generated release/cache metadata: `dist/release.js`, `dist/sw.js`, `game-release.json`.

## Verification

- Production-equivalent `node scripts/build-site.mjs` passed all 42 suites; 142 output files and 127 local references checked. Generated local version: 1.29. The recorded release digest matches the final runtime files.
- Settings, audio, start-flow, title-reference, protected-text and new title/header tests passed.
- Isolated Chrome checks passed at desktop 1365px and phone widths 320px, 360px and 390px: scoreboard position, header cleanup, Settings toggles, new-game flow, abandoned setup, dynamic label, no horizontal overflow or uncaught errors.
- Existing isolated cloud-account browser suite passed at 1365×900, 390×844, 360×800 and 320×568, including safe restoration, conflicts, backups, sign-out and guest play. Firebase was mocked; no production data was accessed.
- Audio tests verify oscillator scheduling, mute behavior and the final OFF click. Actual speaker listening, physical phones, Safari and real Google OAuth were not tested in this task.
- No commit, push, merge or deployment performed.
