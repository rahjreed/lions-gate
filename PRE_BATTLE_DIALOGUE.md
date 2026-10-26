# Pre-battle dialogue

Each new run, next-level arrival and retry enters a manual two-line introduction using the existing HUD and combat arena. The question card is absent until the introduction finishes. No question, combat or scoring engine changes are required.

- Original fictional banter: 24 Roman exchanges and 12 separate Gatekeeper exchanges. These are presentation text, never Scripture evidence or question-bank material.
- Level-based deterministic rotation visits every exchange in its pool before rotating the next cycle's starting point. Consecutive encounters of the same type do not repeat; finite pools eventually repeat. Retrying the same level deliberately keeps the same exchange.
- Tap either speech bubble or the main advance button. Enter/Space works on focused buttons or the introduction; Escape skips. Skip is available immediately, including retries.
- Skip & Turn Off saves the preference; the Armory's Pre-Battle Dialogue control re-enables it. Walking journeys have their own independent setting.
- The question timer starts only after completion or skipping. Pause/background suspension works through the existing pause controls; there is no automatic dialogue countdown.
- The existing version-3 local-save key remains unchanged. `settings.skipDialogue` defaults to false for older profiles. Optional `run.dialogue` stores the level, line index and completion flag; Continue restores a pending introduction after refresh. Previously saved mid-question runs continue using their original pause/restore behavior.
- Duplicate completion is ignored. Dialogue cannot submit answers, consume powers, alter scores, reset question timers or award progression. Existing gameplay and sprite hooks are reused.
- The production build includes the new JS/CSS in its existing atomic offline shell. No new network services, voice recordings, permissions or external assets are used.

Verification: `node scripts/build-site.mjs` runs the existing suites plus `test-encounter-dialogue.mjs`. Dialogue tests cover deterministic rotation, regular/Gatekeeper/Master retries, journey arrival, checkpoint restoration, pause/hidden-tab behavior, duplicate completion and immutable gameplay state. Browser checks use isolated loopback saved-game fixtures, preserving the user's normal local save. Physical-device/PWA relaunch testing is separate from browser viewport checks.

Local verification completed: production build and all 20 configured suites passed. Actual browser flows covered the first regular encounter, tapping a bubble, pause/menu/refresh/Continue restoring Judah's reply, disabling dialogue and restoring the OFF preference in the Armory, immediate Level 5 retry skipping into Question 1, the existing Level 4 journey arriving at Level 5 dialogue, and a Level 335 Master retry with retained belt/wardrobe. Both lines and controls fit 320×568 portrait and 844×390 landscape without page overflow; desktop and 390×844 portrait were also inspected. The final Master/Gatekeeper browser console reported no errors. Native phones and installed-PWA relaunch remain unverified.
