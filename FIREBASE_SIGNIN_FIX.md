# Google sign-in and title account control

## Confirmed root cause

Reproduced the reported **TypeError: Illegal invocation** in isolated desktop Chrome, without calling Google or Firestore. The failing stack pointed to `CloudProgress.authChanged()` at `this.cancel(this.timer)`, with **zero cloud reads**.

The constructor previously stored native `clearTimeout` and `setTimeout` functions directly as object properties. Calling them as `this.cancel(...)` / `this.schedule(...)` supplied the controller as their receiver. Browser Window timer functions enforce their receiver, unlike Node's tolerant timers, so the existing Node-only tests missed the problem. An Auth observer or successful-popup reconciliation could fail before setting the account state.

The constructor defaults now wrap the native calls as `id => globalThis.clearTimeout(id)` and `(fn, delay) => globalThis.setTimeout(fn, delay)`. The native functions receive the correct global receiver. Injected test schedulers remain supported; save/cloud migration/revision/backup logic is unchanged. Repeating the Chrome probe after the fix reaches account reconciliation and one cloud read; native timer scheduling and sign-out cancellation also pass.

`dist/firebase-sdk.js` was inspected and left unchanged: its arrow functions already pass the captured Auth instance to modular SDK functions. `getAuth(app)` and existing persistence were retained. No redirect authentication, auth-domain changes, new providers or storage reset were introduced.

## Account presentation and error handling

- Title control is now a full-width blue arcade button with a light-blue border, above Press Start and Continue, matching their width and spacing. It says **SIGN IN / CLOUD SAVE**, then **MY ACCOUNT / CLOUD SAVE** when Auth reports a user.
- Exact subtitle: **Keep your progress and medals across devices**.
- The old title footer-style account link is removed. The existing Hall account controls, artwork, Start/Continue handlers and other title options are unchanged.
- Native modal, Escape, focus restoration and Guest / Close behavior are preserved.
- The first Google-button tap still loads the SDK; the next deliberate tap calls the popup immediately, before awaiting anything, retaining Android Chrome user activation. No popup is triggered automatically. Repeated taps during a pending popup are ignored; success/failure clears the transient busy state.
- Known Android WebView/Facebook/Instagram/LINE/TikTok user-agent signatures show direct Chrome/Safari guidance before loading the SDK or requesting a popup. Google blocks embedded OAuth user-agents; this does not attempt to bypass that restriction or transfer local data between browsers.
- Auth errors show bounded actionable messages rather than raw credential-bearing SDK messages. Popup blocking/cancellation, networking, domain authorization, unsupported environments and browser-storage failures are handled. Guest progress is untouched by failed sign-in.

## Verification

Final production-equivalent build passed all **41** suites, producing local version **1.25** and offline revision `8d023476133952956f35`. This local version has not been deployed.

`node scripts/test-cloud-auth.mjs` adds Window-branded timer mocks that fail with the old implementation, synchronous-popup timing, successful reconciliation without implicit migration, repeated taps, embedded-browser detection, rejected popup/SDK initialization, credential-message suppression and exact saved-profile preservation checks.

`node scripts/test-cloud-progress.mjs` continues to cover the six collection/study combinations, old saves, lives/medals, explicit migration, revision conflicts, backup/restore, stale operations and offline/quota failures.

Actual isolated Chrome UI checks at **1365×900, 390×844, 360×800 and 320×568** passed:

- Exactly one title account button, before Start/Continue, with matching widths and at least 60px height.
- No horizontal overflow; existing small-screen scrolling fallback preserves access.
- Correct modal opening/closing, Escape/focus restoration and signed-in/out labels.
- Mocked Google success, popup rejection and sign-out through the real UI.
- No automatic cloud writes or local-profile changes during authentication.
- Guest Start still opens the collection screen; Continue resumes the saved run without name entry.
- Browser-native timer calls work; no uncaught JavaScript errors.
- Embedded-browser user-agent gets guidance with no SDK load; Guest Start remains available.

The browser tests replace only the Firebase adapter with a local fixture and block external HTTPS. They **do not** claim an actual Google OAuth completion or production cloud access. Real Android Chrome account chooser/popup behavior, physical Android/iPhone devices, installed PWAs and unidentified embedded browsers still require manual verification after an authorized deployment. Local viewport tests are not physical-device tests.

## Commands

```powershell
node scripts/test-cloud-auth.mjs
node scripts/test-cloud-progress.mjs
node scripts/build-site.mjs
```

Optional browser QA uses temporary tooling, not production dependencies. In one terminal start the existing preview on port 65456, then run the browser test in another:

```powershell
npm install --prefix .verification/browser-tests --ignore-scripts playwright-core
$env:PREVIEW_PORT='65456'
node scripts/preview-production.mjs
```

```powershell
node scripts/test-cloud-auth-browser.mjs
```

Google Chrome must be installed. The test uses a new isolated headless profile; it does not operate the user's existing browser or real account. Preview screenshot: `.verification/browser-tests/account-mobile.png` (disposable QA save, not a real player).

## Changed files

`dist/cloud-progress.js`, `dist/cloud-ui.js`, `dist/cloud.css`; new `scripts/test-cloud-auth.mjs` and `scripts/test-cloud-auth-browser.mjs`; `scripts/build-site.mjs` adds the dependency-free authentication suite; `.gitignore` excludes temporary browser tooling; this report. Production build regenerates `dist/release.js`, `dist/sw.js` and `game-release.json`.

No gameplay, artwork, question, existing save-storage, Firestore rules/index, Firebase configuration, SDK adapter, Vercel or DNS changes. No commit, push, merge or deployment.

Reference: [Google OAuth embedded user-agent restrictions](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow).
