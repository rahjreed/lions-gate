# Answer-feedback polish

This change preserves the existing layout, question bank, scoring engine, lives, ranks, progression, and answer flow. Presentation is isolated in `dist/juice.js` and `dist/juice.css`; the gameplay engine is unchanged.

## Correct answer

One short green border/light pulse, brighter correct option, twelve pixel sparks, floating points/combo beside the chosen answer, a 350 ms score counter, combo emphasis, and a brief sword slash/glow. The existing feedback region now has a larger CORRECT heading, reward/streak line, and a staggered Scripture-confirmation reveal. Next-question entry uses a 270 ms panel/choice arrival; buttons remain usable immediately throughout.

## Miss

One red border impact, a 250 ms panel shake, stronger WRONG ANSWER heading, animated −1 heart, and a short heart pulse. Explanation text reveals gently after the impact. Shielded mistakes use a blue border and a shield cue without a lost-heart animation or life-loss sound.

## Audio

Fourteen original synthesized cues: correct, wrong, life lost, menu select, next question, run start, level completion, promotion, Gatekeeper entrance, pause, resume, power-up, shield, and game over. Each uses bounded oscillator envelopes, with no sampled/copyrighted game sounds. Incorrect-answer and life-loss cues are layered with a 200 ms offset.

SFX and music have independent buses. Audio context resume completes before scheduling a cue; mute immediately zeros the SFX bus, cancels scheduled SFX voices, and invalidates pending playback. Re-enabling uses the new state before playing its confirmation. Music-loop startup also guards against a pause during asynchronous context resume. Audio failures never block gameplay.

## Motion and performance

Effects are presentation-only and do not add timer/answer delays. A new render cancels old animation frames, Web Animations, timeouts, and particles. Correct answers create twelve particles; promotion accents create twenty. Score animation takes about twenty frames. Reduced-motion settings suppress motion, particle bursts, and flashes while retaining readable success/failure labels and colors. Timer pressure uses a gentle glow and warm bar color rather than a strobe.

## Verification

- `scripts/test-audio.mjs`: all cue scheduling, gain envelopes, suspended-context resume, mute/re-enable, pending-resume mute, paused-music startup race, unavailable-audio fallback, and bounded patches.
- `scripts/audio-lab.html`: local QA only, outside deployed assets. All fourteen production patches rendered through real browser OfflineAudioContext with nonzero RMS and unclipped peaks; muted output produced digital silence. This verifies generated waveforms, not the user's speaker volume or device mute setting.
- `scripts/test-juice.mjs`: animation/frame/particle cleanup and reduced-motion behavior.
- Existing content, engine, and persistence suites remain deployment checks.
- Live browser: running AudioContext and correct/next/wrong/life-loss/pause/resume/level-completion events observed; SFX-off next transition did not increase the playback counter. Desktop and 390 px mobile correct/miss presentation, combo milestone, immediately enabled next buttons, old-effect cleanup, full-level scoring, and advancement into level two checked.

Browser autoplay restrictions still require a user interaction to unlock sound. Muting SFX intentionally does not mute separately enabled music. Actual acoustic output depends on device volume, browser/tab mute, and output routing.
