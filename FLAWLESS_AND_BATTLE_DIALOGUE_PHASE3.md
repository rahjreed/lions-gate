# Flawless rewards and battle dialogue — Phase 3

## Inventory rule

The game starts each run with 3 × 50:50, 2 × +15 seconds and 1 × Shield. These remain distinct powers with their existing functions, spending rules and retry snapshots.

Every two consecutive, newly completed flawless levels restore one use. Selection takes the greatest proportional deficit from those starting stocks; equal deficits resolve in the fixed order 50:50, time, Shield. For example, empty time and Shield stocks both have a 100% deficit, so time is restored first. Stocks top up only to 3 / 2 / 1. Existing valid saves with higher time/Shield counts (up to the existing overall per-type maximum of 3) are preserved, not reduced or replaced. This preserves the original allocation rather than creating a shared or random inventory.

If all stocks are full, the pair ends with `POWER-UPS FULL` and the streak resets; there is no hidden overflow reward. A restored use displays `POWER-UP RESTORED!`, the type, a short golden pulse/burst and an original synthesized sound. SFX mute and reduced-motion settings apply. No points or additional combat damage are added.

## Completion and save integrity

- Flawless means exactly ten accepted correct answers. Manual correct answers still count after any existing support power.
- Wrong answers and timeouts break the flawless chain, including Shield-protected errors. Defeat, deliberate retirement and restarting an incomplete level break it as well. A fresh retry can begin a new chain.
- A separate `run.flawless` ledger records the pending 0/1 count, last eligible level, completion high-water mark and last reward. Answer streaks, multipliers, perfect-level bonuses and ranks remain independent.
- The replay floor includes previously completed levels and the saved profile's completion high-water mark. Those levels cannot generate restoration rewards when replayed or restarted in a new run. Inventories do not transfer between new runs.
- Old version-3 saves remain valid. Missing feature fields start without an inferred historical flawless streak. Malformed optional Phase 3 fields are dropped without discarding otherwise valid lives, scores, powers or progress.
- Rewards are awarded in the existing completion transaction, before its save. Repeated Continue/completion callbacks cannot award another use. Retry inventory still comes from the existing level-start snapshot.

## Battle exchanges

`run.battleDialogue` stores two once-per-attempt triggers: nine correct answers (enemy at 10%) and an actual life decrease from above one to exactly one. Eight original exchanges per trigger rotate deterministically by level. Names use the existing opponent naming system, including Gatekeeper titles.

The accepted answer, combat animation and Scripture explanation finish first. Continue advances the engine to the next question's prepared state, then shows the existing encounter panel **before rendering that question or starting its timer**. No exchange is inserted when there is no next question (level clear or Game Over). A Shield block is not a life-loss trigger. The two trigger types are marked when queued, and an active exchange plus its reply step persist across reloads. One-life exchanges take priority when both are pending; they never overlap. Retries start a fresh encounter ledger.

Tap either bubble, use the primary advance control, or skip. Existing Escape/Enter controls and Pause remain available. The original dialogue-off preference now applies to introductions and battle exchanges together. Approval, Scripture content and question selection are unaffected.

## Verification

`scripts/test-phase3.mjs` runs in the production build. It exercises stock selection/caps, earning/spending, full inventory, duplicate/replayed clears, old/corrupt optional saves, errors/Shields, retries/restarts, Gatekeeper/high-level cases, exact application Continue/dialogue callbacks, saved replies, event priority, opt-out, timer isolation and single restoration audio.

Browser QA uses isolated loopback saves. Delivery results distinguish actual browser checks from physical-device/audio testing. No cloud services or publication changes are involved.

Completed checks: production build and all 23 configured scripts passed (107 production files, 96 local references), along with candidate/source integrity, Torah evidence, curriculum, campaign boundaries and read-only publication checks. The live bank remains 110. The 15 pre-existing candidate editorial warnings remain unchanged.

Actual browser checks covered restoration and its audio scheduling at 390px, a complete reward screen at 320×568 without scrolling, inventory carried into the next level, enemy-low dialogue at 320px, saved reply restoration after refresh, a Shield-blocked error followed by the real one-life trigger, desktop dialogue, pause/resume and opt-out. The application test also verifies focus returns to the question heading. Physical-device performance and audible speaker output remain unverified.
