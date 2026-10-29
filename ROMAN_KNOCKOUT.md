# Roman knockout presentation

The existing `roman-soldier.png` is unchanged. The new `roman-knockout.png` is an original AI-assisted reference-matched transparent atlas with eight whole-body knockout drawings and one isolated shield. The poses retain the existing silver armor, gold details, helmet, red crest/cape and sword. Source rectangles in `romanKOFrames` select the actual drawn regions without resampling or duplicating the atlas. All poses share one scale and floor anchor; small vertical placement changes supply contact and bounce, rather than rotating a standing character.

Normal and Gatekeeper enemies use the same 1,600 ms presentation clock:

| Time | Presentation |
| --- | --- |
| 240 ms | Existing final hit; upper-body recoil, shield release and synthesized pain yell |
| 340 ms | Loss of balance and shoulder/arm reaction |
| 540 ms | Knees buckle |
| 760 ms | Descending, seated fall pose |
| 1,030 ms | Separate shield hits the floor with its clang, then wobbles |
| 1,100 ms | Near-ground body pose, with a short slowed descent into contact |
| 1,210 ms | Body impact and ground sound/dust |
| 1,330 ms | Small bounce with a different body drawing |
| 1,400–1,470 ms | Settling and collapsed-pose hold |
| Final 130 ms | Three quick visibility flashes, after the shield has settled |
| 1,600 ms | Guard and shield stay vanished; Judah's victory pose and existing answer reveal |

The presentation never changes simulation time, question timers, damage, score or completion rules. Shield contact is an exactly-once presentation job. Existing pause handling freezes director jobs and DOM animations/transitions. Rapid Continue remains blocked until completion. Interrupted saved finishes replay presentation only; completed saves restore the invisible terminal guard rather than resurrecting him. No save fields were added.

Reduced motion uses a clearly collapsed body and settled shield with a gentle 320 ms fade, without launch, tumbling or flashing. Continue remains gated for that brief fade. Judah's existing defeat and regular-hit timings remain unchanged.

The yell uses an original falling glottal oscillator with three /ah/ formant filters. The shield clang uses short inharmonic oscillator envelopes. Both use the existing SFX bus, unlock/mute protection and cleanup; no external recordings, speech service or copyrighted assets are used. The title/game music is unchanged. Physical speaker balance and whether the stylized yell matches the owner's taste require listening review.

Run `node scripts/build-site.mjs`. The finisher suite imports `test-roman-knockout.mjs`, covering poses, source bounds, contact/fade timing, every new pause boundary and repeated/cancelled events. Existing suites retain full question, health, power-up, retry, save and publication checks. Browser fixture/checkpoint helpers live only under ignored `.verification/launch/`, not the production bundle.
