# Unified Google account and cloud progress

## Player experience

- The title and account menu use one recognizable **Sign in with Google** button: white fill, 1px gray border, rounded corners, 20px approved multicolor G, Google Sans Medium 14px/20px and normal capitalization. The title subtitle explains that progress and medals follow the account. Guest Start and Continue remain available.
- The button still uses the existing modular Firebase Google popup provider. No Google Identity Services authentication session, redirect flow or second authentication system was added.
- A cold first tap prepares the optional SDK inside the account menu; a fresh deliberate tap opens the popup immediately in its user gesture. Preparing does not automatically open a delayed popup or sign in a guest. Returning authorized Firebase sessions retain existing persistence behavior.
- Successful authentication automatically compares the saved account progress through the existing controller. A new account offers **Connect this progress**, with explicit confirmation. Different saves show **On this device / In your account**, and require a choice plus confirmation. Existing backups, revision checks, decoding and medal retention remain in effect.
- Once comparison or the chosen save operation succeeds, the setup menu closes and a four-second success notification appears. Opening Google or merely receiving an authenticated UID does not close setup.
- A compact clickable indicator below the existing header shows the arcade name and **Connected to Cloud**, **Finishing setup**, or **Action required**. It never uses Google profile names/email. Signed-out players have no empty status row. A completed account has no large title sign-in entry or leftover gap. Pending/conflicted accounts have a setup control instead of another Google sign-in attempt.
- Reopening a completed account keeps the menu open for save review, sign-out and the existing optional public leaderboard controls. The visible sticky Close button, Escape and focus restoration work throughout.
- Opening the account menu during a battle/encounter/journey invokes the game's existing Pause button. Closing account tools leaves the run paused until Resume; it cannot consume question time behind the modal.

## Completion and truthful status

`accountState()` derives UI state from authenticated UID, validated cloud binding, revision, remote save, current setup action, offline state and a transient issue marker. The marker is not part of the saved profile or Firestore schema. Failed reads/writes and conflicts cannot retain a green connection label.

Interactive setup is held open until all its awaited operations finish. When restoring cloud progress retains additional permanent local medals, the existing upload transaction is flushed immediately so those medals reach the account before announcing completion. No counters/streaks are added together, and no approval/revision/backup safeguard is bypassed. If this final write fails, setup remains open with Action required and local progress/backups remain available.

Connected describes an established account/save link. Ordinary gameplay keeps the pre-existing 30-second cloud-save throttle; it does not claim every timer tick is already uploaded. Offline events immediately replace Connected with Action required. Returning online checks account progress again without automatically choosing a conflicting save. A previous success toast is removed when the connection becomes pending or needs attention.

## Google assets and branding

The custom HTML button follows the current [Google branding guidance](https://developers.google.com/identity/branding-guidelines), using the existing Firebase provider rather than introducing another SDK for authentication.

- `dist/assets/account/google-g.png`: unmodified official gradient logo from `https://developers.google.com/static/identity/images/g-logo.png` (200×200 source, rendered without distortion at 20×20).
- `dist/assets/account/google-sans-signin.woff2`: official Google Fonts Google Sans Medium subset requested for the fixed text **Sign in with Google**. Source stylesheet: `https://fonts.googleapis.com/css2?family=Google+Sans:wght@500&display=swap&text=Sign%20in%20with%20Google`. The subset is 2,248 bytes, avoiding the unused 2MB full-font download.
- `dist/assets/account/OFL.txt`: Google Sans SIL Open Font License, copied from the Google Fonts repository.

Assets are served locally and included by the existing PWA build. The sign-in button is raised above the game's scanline overlay to keep Google's white surface, logo and typography clean. No game artwork or general retro styling was changed. Native keyboard activation, visible focus, 44px touch targets, high-contrast text and reduced-motion-compatible presentation are retained.

## Verification

Final production build: **all 41 suites passed**, local version **1.27**, 142 static files / 127 local references verified, offline revision `e01fbc6a3136f5fcd4ec`. This version has not been deployed.

Dependency-free authentication and cloud-controller tests cover branded markup, account-state transitions, receiver-safe browser timers, immediate popup invocation, duplicate taps, embedded-browser guidance, credential-safe errors, six Scripture collection/study-path combinations, old saves, conflicts, backups, quotas/offline failures and permanent medal retention.

Isolated Chrome UI tests at **1365×900, 390×844, 360×800 and 320×568** verified:

- Correct logo/font loading, modern styling, title order and touch sizes; no horizontal overflow.
- Authentication pending during held cloud reads; no premature close or success notification.
- Declined upload confirmation makes no cloud write; confirmed upload backs up and completes before closing.
- Connected accounts remove the whole large entry; reopening the indicator keeps management controls accessible.
- Stale revisions, offline transitions, denied writes and read failures show Action required and preserve local progress.
- Existing conflicting cloud progress requires explicit choice. Restoring retains local permanent medals and saves the merged result before closing.
- Matching existing account data compares and closes without an unnecessary write.
- Sign-out restores the Google button and guest play; Start/Continue still work.
- Account tools correctly pause an active battle, trap modal keyboard interaction, and leave Resume available.
- Known embedded WebViews show Chrome/Safari guidance and never request a Google popup.

All browser tests use a local Firebase adapter fixture and block external HTTPS. Only disposable QA profiles are used. This is **not** a real Google OAuth or physical-device test. Actual Android Chrome/iPhone Safari account choosers, installed PWAs, popup restrictions, unidentified embedded browsers and production Firebase connectivity still need manual device verification after an authorized deployment.

The demo-only Firestore emulator suites also passed: original tests, 70 expanded allow/deny checks, actual SDK transactions, stale opt-out protection, UTF-8 boundaries and 20/20/3 cursor pagination. Production Firebase was not used.

## Commands

```powershell
node scripts/test-cloud-auth.mjs
node scripts/test-cloud-progress.mjs
node scripts/build-site.mjs
npm test --prefix tools/firebase-tests
```

For the optional browser suite, install Playwright Core only in the ignored test directory and start the existing local preview on port 65456:

```powershell
npm install --prefix .verification/browser-tests --ignore-scripts playwright-core
$env:PREVIEW_PORT='65456'
node scripts/preview-production.mjs
```

In a second terminal:

```powershell
node scripts/test-cloud-auth-browser.mjs
```

Chrome must be installed. Screenshots are in `.verification/browser-tests/unified-account-mobile.png` and `unified-account-connected-mobile.png` and depict disposable QA data.

## Changed files

Runtime: `dist/cloud-ui.js`, `dist/cloud.css`, `dist/cloud-progress.js` (transient issue markers and player-friendly error copy only), plus the three account logo/font/license assets above. Verification: `scripts/test-cloud-auth.mjs`, `scripts/test-cloud-progress.mjs`, `scripts/test-cloud-auth-browser.mjs`. Documentation: this report. The production build regenerates `dist/release.js`, `dist/sw.js`, and `game-release.json`.

The Firebase SDK adapter/configuration, Firestore rules/indexes, local save schema/key, gameplay, questions, study paths, character art, combat, scores, achievements, Facebook sharing, support options, Hall ranking logic, PWA update policy, Vercel configuration and DNS are unchanged. No commit, push, merge, deployment, public question publication or production data change was performed.
