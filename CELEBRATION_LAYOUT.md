# Celebration cleanup — 2026-10-25

- Scoped to level-clear and promotion screens. Game Over, active gameplay, menus, scoring, progression, character artwork and animation frames are unchanged.
- The mobile result uses one shared art row for the sword, Judah and optional Gatekeeper gate. Score, completed levels, best streak, rank/lives, all earned achievements, next-level action, menu actions and review control remain visible. Duplicate top HUD information is omitted because those values appear in the result itself.
- Responsive spacing and typography replace large vertical margins. Next-level controls remain 48px high; other result buttons and the review summary remain at least 44px high. The Master caption can extend naturally rather than wrapping beneath its insignia.
- Uses dynamic viewport sizing and safe areas. Page scrolling is disabled only when the result fits. Exceptionally small windows, enlarged text and expanded question reviews retain a scrolling fallback. Closing the review restores the fit lock.
- The installation/offline-status panel is hidden on celebrations at all sizes. Service-worker registration, caching and local saves are unchanged. The production build includes the new stylesheet in its generated offline revision.

## Verification

- Production build and full automated suite passed, including a new layout-state regression test for review expansion/collapse, resize fallback, existing gameplay/menu cleanup and desktop scroll behavior.
- Browser: ordinary perfect clear, imperfect clear, Gatekeeper promotion, and eighth Master degree promotion with all six achievements.
- Full promotion fits with no horizontal or vertical page overflow at 360×640, 360×800, 390×650 and 412×915. 320×568 and 320×480 use the scrolling fallback without clipping controls.
- Expanded review unlocks scrolling; collapsing it restores fit. Confetti, sword float, Judah transformation and rank-in animations retain their existing animation names. Next-level journey transition still works.
- With the local server stopped, cached Level 120 reopened successfully at 390×650 with the complete celebration fitted and the offline-status panel hidden.
- Physical Android/iPhone devices, native safe-area/address-bar behavior and enlarged-text OS preferences were not tested. Browser viewport tests are local Chromium checks.
- Temporary fixtures and owned preview servers were removed/stopped. No commit, push or deployment was performed.

For an existing PWA cache, allow the update to download, then close all game windows and reopen so the waiting service worker can activate.
