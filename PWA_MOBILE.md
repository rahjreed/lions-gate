# PWA and mobile verification — 2026-10-25

## Implemented

- Full app name, stable relative app ID/start URL/scope, standalone display, dark launch/theme colors and Apple home-screen metadata. Portrait is prioritized through responsive CSS without locking device orientation.
- Opaque 192px/512px PNG icons, separate maskable 512px icon, and 180px Apple touch icon. These reuse the original pixel sword and gate. Essential maskable artwork fits inside the central safe circle. `scripts/build-app-icons.py` reproduces the committed icons; Python/Pillow is only an authoring dependency, not a production dependency.
- The install button is hidden unless the browser supplies a real `beforeinstallprompt` event. It hides after use/installation and in standalone mode. iOS receives Home Screen instructions rather than a nonfunctional native-prompt button.
- `build-site.mjs` hashes all local distribution files and the worker template to generate a complete revisioned offline shell. Every rank sprite, arena, journey, question module and game file is included. No network service, runtime package, account or new storage schema is required.
- New service workers wait for existing game windows to close; there is no forced takeover or page reload. Failed precaching deletes the incomplete new cache and retains the old working version. Activation removes only this scope's older game caches. Save data is never read or cleared by the PWA code.
- Vercel's existing build still outputs `dist`; manifest and worker response headers are configured locally. Nothing has been deployed.
- Mobile active gameplay uses `100dvh`, safe-area insets, a compact HUD/health display, proportionally scaled arena and a two-column four-answer grid. Answer text remains at least 14px; answers are at least 48px high and power/audio/pause controls at least 44px high. Decorative captions and secondary metadata are reduced during gameplay only. Desktop retains its existing game layout.
- A measured fit class prevents page scrolling only when content fits. Text is never truncated to force a fit. Very small windows, long questions/choices, and enlarged text can scroll normally. The native answer modal retains its own scrollable explanation and accessible keyboard controls.

## Local verification

- Production build and complete automated suite passed. New PWA checks cover PNG dimensions, manifest fields, required assets, offline navigation/module responses, exclusion of external URLs and non-GET requests, failed-update preservation, scoped cache cleanup and supported install-button behavior.
- HTTP 200 with correct MIME types verified for manifest, worker, 192px/512px/maskable/Apple icons.
- Browser service worker reached “Offline game ready.” The local server was then stopped: the game reloaded, restored a Level 5 run and accepted another correct answer offline. Score, lives, enemy health and Gatekeeper seals remained consistent.
- Viewports checked: 320×568, 320×480, 360×800, 390×650, 390×844, 412×915 and 1280×800. Height resizing exercised the dynamic-viewport layout path.
- Representative questions fit fully at standard phone sizes. Short questions also fit at 320×568. The longest combined question/answer record used the scrolling fallback at 320×568; 320×480 also fell back to scrolling. No essential content was clipped and there was no horizontal overflow in these checks.
- Correct-answer combat/reveal, timeout reveal, pause/resume, saved-game reload and Gatekeeper UI checked in the browser. Existing timing/animation tests passed. Character sprites/artwork were not edited.
- A test-only explanation repeated 70 times stayed within a 320×568 modal; the copy scrolled independently and the Continue button stayed visible. Keyboard dismissal also worked. Temporary fixtures were removed.

## Not yet verified / deployment review

- These files are local changes. The deployed site has not received them, so Android Chrome recognition of this new configuration cannot be verified there yet. No installation on a physical Android/iPhone device, Safari engine check, installed standalone launch, notch/home-indicator test, or real browser address-bar interaction was performed. Viewport resizing is a simulation of available-height changes, not a physical-phone test.
- After a reviewed deployment to the existing HTTPS origin, check Chrome's Application/Manifest and Service Workers panels, install on Android, launch from the icon, then enable airplane mode after the initial offline download. On iOS Safari use Share → Add to Home Screen, launch from the icon and repeat the offline/safe-area checks. Close all app/browser windows between update checks.
- Offline gameplay requires one successful complete shell download. External Scripture links still require a connection. Google-hosted fonts are not precached; offline text uses available browser font caches or system fallbacks.
- Saves remain tied to their existing browser/origin. The code does not promise transfer between separate browser profiles or a browser and an isolated installed-app storage context. Browser storage clearing/eviction remains outside application control.
- No commit, push or deployment was performed.

Platform references: [Installability criteria](https://web.dev/articles/install-criteria), [native install-prompt handling](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt), [service-worker update lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
