# Combat presentation — Phase 2

This update changes presentation only. The Scripture engine remains the authority for answers, damage, lives, shields, rewards, progression and retries.

## Existing powers

The available powers are 50:50, +15 seconds and Shield. None is an offensive damage power. Their functions and consumption rules are unchanged; they do not trigger invented combo damage or consume an additional power. Normal successful attacks still deal exactly 10 enemy health, displayed once as `-10`.

## Finishing sequences

- Enemy zero-health finishes alternate deterministically by level between rising knockback and a lower sweeping fall.
- Judah's final unshielded life loss triggers a dedicated recoil, fall and small ground bounce.
- Each sequence lasts 1,600 ms. Ordinary exchanges remain 920 ms.
- The existing impact at 240 ms is still the sole health-display/damage-number event. Ground contact at 1,210 ms, bounce at 1,330 ms and settling at 1,470 ms are presentation events only.
- Brief impact lighting, original synthesized finishing audio and a short ground-contact sound accompany the fall. Existing SFX controls apply.
- The longer middle fall segment gives a localized slow-motion impression. No global game clock, question deadline or audio playback rate is changed.
- Answer reveal opens only after the sequence completes. Existing Continue, victory, game-over and retry flows are retained.
- Reduced motion uses an immediate static result and a single impact, without a fall, bounce or extra delay.
- Pause/background handling freezes the director's remaining callbacks and existing CSS animation playback. Generation guards ignore cancelled or stale callbacks.

## Art and scope

These are variations using the existing attack/recoil atlases and authored motion paths, not new hand-drawn prone sprites. Judah's artwork and the Roman artwork are unchanged. A dedicated fallen-body atlas could improve the silhouette further in a future art task.

## Verification

`scripts/test-finishers.mjs` checks both targets and enemy variations, reduced motion, exactly-once impact/completion, contact/bounce ordering, pause and cancellation at each timeline boundary, a simulated minute in the background, existing support powers, damage/scoring preservation and five-life retries. It runs with the production build.

Verification completed:

- Production build and all 22 configured validation/test scripts passed; 105 production files and 95 local references checked.
- Candidate/source snapshot checks, Torah evidence checks, curriculum coverage, campaign boundaries and read-only publication verification passed. The live bank remains 110 questions. The candidate check still reports its 15 pre-existing editorial warnings; no question records were edited.
- Browser checks covered enemy finishes at 390px and desktop width, Judah's final-life fall at 320px, answer reveals, level completion, Game Over, five-life retry, fresh retry selection, a normal 50:50 hit, audio activation and pause. A frozen-frame harness using the production renderer/CSS was used to inspect and correct landing geometry.
- Desktop browser inspection intermittently stalled. Physical iPhone/Android performance and audible speaker output were not verified. The browser audio context did reach `running` and schedule cues; automated tests cover all 22 sound patches and mute behavior.
- Temporary fixture saves used separate loopback origins. User saves were not edited. No commits, pushes or deployments were performed.
