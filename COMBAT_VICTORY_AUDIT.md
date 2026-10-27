# Combat, health and victory audit

> Historical audit. The owner subsequently authorized true defeat-based battles. See TRUE_DEFEAT_COMBAT.md for the implemented rule and resolved presentation defects. The audit test script now tests the replacement behavior.

Date: 2026-10-27. Audited checkout: `68d3c70` (`dial banter life`). This is an audit and characterization-test addition only. No gameplay, animations, questions, saves or deployment configuration were changed.

## Main conclusion

The observed 20%-health victory is reproducible and follows the existing rules. **Level clear and enemy knockout are different conditions.** The game clears a level after ten answers if Judah has at least one life; it does not require enemy health to reach zero. Every correct answer removes ten enemy health. Eight correct answers therefore leave 20% health. The result screen nevertheless uses victory presentation for every surviving clear, which makes the rule confusing.

This was intentional, not introduced by the latest dialogue/reward changes: `COMBAT_HEALTH.md` explicitly documents imperfect clears with surviving guards, `COMBAT_FEEDBACK_PHASE1.md` preserves them, and `GAME_PROGRESSION.md:42` requires preserving the surviving-ten-questions rule unless separately approved.

There are also **confirmed presentation defects on interrupted/restored feedback**. A normal uninterrupted knockout does run its fall; a restored feedback screen does not replay or reconstruct that terminal animation state.

## Current rules and reproduced outcomes

Assuming five starting lives and no previous damage:

| Answers in the level | Shield protection | Enemy remaining | Judah lives | Current result | Roman fall |
| --- | --- | ---: | ---: | --- | --- |
| 10 correct | None needed | 0% | 5 | Level clear | Yes, except reduced-motion/recovery paths below |
| 8 correct, 2 wrong | None | 20% | 3 | Level clear | No: the enemy was not knocked out |
| 8 correct, 2 wrong | One miss blocked | 20% | 4 | Level clear | No |
| 5 correct, 5 wrong | None | 50% | 0 | Game Over | No; Judah receives the finishing sequence |
| 5 correct, 5 wrong | One miss blocked | 50% | 1 | Level clear | No |

The five/five row assumes the fifth unblocked mistake occurs on question ten. Other orderings can end the attempt sooner; the game stops at the life-ending mistake. Zero lives takes precedence over completing the tenth question. Remaining lives carry between levels; clearing a level does not heal Judah. Retry restores five lives.

Regular and fifth-level Gatekeeper encounters use the same clear condition. Gatekeeper answers award double points and correct answers break gate seals, but `gateProgress().open` is based on `levelup`, not all ten seals breaking. An imperfect Gatekeeper can therefore open with the opponent alive and some seals unbroken. This is another presentation consequence of the documented survival rule, not extra damage or a different boss damage formula.

50:50, +15 seconds and Shield are support powers. There are no offensive combo powers in the current implementation. They never add enemy damage. Shield prevents one life loss, not an incorrect answer, enemy damage, or a broken flawless streak. Armor remains cosmetic.

## Findings

### A. Surviving opponent during victory — intentional mechanics, confusing presentation

- `dist/engine.js:58`, `advance()`: checks zero lives first, then clears when `run.index === 9`. It never tests enemy health.
- `dist/combat.js:24`, `combatHealth()`: computes `max(0, 100 - correctAnswers * 10)`. There is no separately decremented saved enemy-health field.
- `dist/app.js:108`, `resultScreen()`: uses the victory class, Judah victory pose and “THE GATE IS OPEN” for any `levelup` result.
- `dist/adventure.js`, `gateProgress()`: opens the gate for `levelup`, even on an imperfect clear.

**Recommendation:** distinguish a surviving quiz/trial clear from an actual knockout. For an imperfect clear, identify the remaining enemy health/accuracy and use an appropriate retreat or passage-granted resolution if approved. Reserve knockout language and a fall for actual zero health. Do not fake a fall or subtract unexplained final damage.

### B. Knockout fall missing after reload/Main Menu — confirmed recovery gap

1. `choose()` commits the accepted answer and saves `feedback` before starting the presentation. This correctly protects points/lives, but the saved run contains no combat timeline/checkpoint or presentation-completed flag.
2. `render()` cancels the current `CombatDirector` and reconstructs the scene. Continue on a saved feedback run calls this normal render path.
3. It opens the answer reveal immediately, without starting/replaying the pending fall.
4. `battleScene()` reconstructs a zero-health Roman using only `romanSoldier(true)`. It does not restore `data-finisher="enemy"` or `data-combat="defeated"`.
5. `dist/combat.css:12` makes the plain `.is-defeated` soldier transparent (`opacity:0`). The live finisher selector at line 54 overrides opacity and keeps the fallen pose visible only while the scene has its finisher attributes.

Browser reproduction: the uninterrupted final correct answer reached `phase=defeated`, `finisher=enemy`, health 0, opacity 1. After refreshing and continuing the same feedback save, health remained 0 and the reveal was open, but phase/finisher were absent and Roman opacity was 0. The engine had not cleared the level early or applied damage twice.

The same reconstruction can occur after a completed fall when a normal re-render is requested, such as toggling audio while feedback is open. Audio toggles are guarded against rendering during active combat, so this is loss of the terminal presentation after combat, not evidence that the toggle interrupts an active fall.

**Recommendation:** persist a presentation-only checkpoint/completion flag tied to the accepted answer. Reconstruct a stable terminal pose on ordinary redraws. For an interrupted pending finish, either resume/replay only its presentation or deliberately show an equivalent static defeated pose according to an approved restore policy. Never call `submit()` again or reapply damage, points, powers or completion rewards.

### C. Zero-life Judah returns standing after restore — confirmed presentation defect

`battleScene()` always constructs Judah with the `ready` pose. If a final-life answer has already been saved but Game Over has not yet been acknowledged through Continue, restoring feedback therefore shows zero lives with Judah ready/standing, without the defeat timeline. This was reproduced in the browser. Continuing still opens Game Over; retry still restores five lives, enemy 100%, question 1 and a clean encounter.

**Recommendation:** derive and restore Judah's defeated terminal pose for zero-life feedback, using the same presentation-only recovery policy as the Roman. Preserve existing Game Over, rewards and retry state.

### D. Reduced motion — intentionally no animated fall

`CombatDirector.start({reducedMotion:true})` applies one static result, one impact callback and immediate reveal. CSS also suppresses motion. The soldier may appear as a static, faded recoil pose rather than falling. Preserve this accessibility behavior; make any future static terminal-pose fix compatible with it.

## Normal sequence and synchronization

| Point | Existing behavior |
| --- | --- |
| Answer accepted | `submit()` applies the result once; run becomes `feedback`; save commits it immediately. A temporary pre-impact HUD snapshot keeps displayed bars at their old values. |
| 140 ms | Swing cue and strike pose. |
| 240 ms | Bars/HUD update and one `-10`, `-1 LIFE`, or `BLOCKED` label is derived from the actual before/after delta. The callback does not apply damage again. |
| 920 ms | Ordinary exchange ends and the answer reveal opens. A surviving enemy returns to ready. |
| 1,210 / 1,330 / 1,470 ms | Finisher ground contact, bounce, settling. |
| 1,600 ms | Enemy/Judah finisher completes; reveal opens. |
| Continue | `proceed()` checks `combat.active` and feedback status before calling `advance()`. Game Over, level clear, next question, or queued untimed dialogue follows. |

The bars have deliberate smoothing: the main fill takes 350 ms and its damage trail takes 650 ms after a 150 ms delay. Those moving pixels can temporarily lag the numeric value without representing additional health. The exact 20%-remaining case was also reproduced from the numeric health value, so it is not explained solely by smoothing.

Rapid-input integration tests found no premature advance, duplicate accepted answer, duplicate impact, duplicate level award, or skipped finish in an uninterrupted exchange. Closed answer dialogs are not interactable before the finish. Pause/background tests preserve remaining callbacks; cancellation invalidates stale work. Ordinary viewport changes update layout rather than re-rendering the combat scene. Battle dialogue waits until combat and the explanation finish and is not an additional damage authority.

The director uses timed callbacks alongside CSS animations, not `animationend` as a paint-completion acknowledgement. Extreme rendering stalls could affect how many frames a person actually sees; this audit does not claim a physical-device stall reproduction or identify that as the cause of the user's specific session.

## Files/functions responsible

| Concern | Main implementation |
| --- | --- |
| Ten questions, damage result, life loss, death priority, clear | `dist/engine.js`: `submit()`, `advance()`, `levelConfig()` |
| Health, exact feedback numbers, Roman markup | `dist/combat.js`: `combatHealth()`, `combatDamageFeedback()`, `updateCombatHealth()`, `romanSoldier()` |
| Animation phases/guards/terminal attributes | `dist/combat.js`: `CombatDirector.start()`, `pause()`, `resume()`, `cancel()`, `paintCombat()` |
| Input, save-before-motion, reveal/Continue | `dist/app.js`: `choose()`, `proceed()`, `render()`, `act('continue')` |
| Restored character presentation / victory styling | `dist/app.js`: `battleScene()`, `resultScreen()`; `dist/combat.css`: `.is-defeated`, finisher selectors, reduced-motion rules |
| Gate seals vs opening | `dist/adventure.js`: `gateProgress()`; `dist/app.js`: `resultScreen()` |
| Save/retry | `dist/storage.js`: `captureProgress()`, `loadProfile()`; `dist/engine.js`: `retryLevel()`, `resetLevel()`, `nextLevel()` |
| No offensive powers | `dist/engine.js`: `usePower()`; `dist/flawless.js`: stock-restoration ledger |

## Should the victory rules change?

**Recommendation: keep the ten-question survival rule for now, fix the presentation gaps, and clearly separate level clear from knockout.** This preserves current educational pacing, saves, retries, shields and progression.

Requiring zero enemy health while retaining 100 starting health and ten damage per correct answer would require **10/10 on every level**. One error would make victory impossible within those ten questions even if Judah has lives left. That is a major difficulty/progression change and conflicts with the current design instruction to retain survival-based clears unless separately approved.

If every successful clear must instead defeat the opponent, choose an explicit new damage/completion design first. Examples requiring authorization include additional questions until a knockout, or a separately identified completion-finisher damage rule. Both affect mechanics/balance and need updated tests; neither was implemented. A purely visual false knockout with positive health is not recommended.

## Verification and limitations

- New standalone test: `node scripts/test-combat-victory-audit.mjs`.
- 12,288 combinations: all 1,024 ten-answer orderings × initial lives 1/3/5 × regular/Gatekeeper × one Shield/no Shield. Checked exact HP, lives, scores, death priority, surviving imperfect clears and duplicate-submit rejection.
- Actual application-function integration with a deterministic clock: normal final hits, KO, Judah final-life loss, regular/Gatekeeper, reduced motion, rapid answer/Continue input, 240 ms impact, 920/1,600 ms completion gates, cancellation, restored feedback, scene reconstruction and clean retry.
- Presentation-gap cases are **characterization/reproduction tests**, not proof that the gaps are fixed. After an authorized fix, replace those assertions with the approved terminal-pose/resume behavior.
- Existing production build and its 23 configured validation/test scripts passed. Existing suites additionally cover pause/background boundaries, shield/timeout effects, power restoration, retry freshness, saved progress, dialogs, PWA shell and source/publication safeguards.
- Campaign, curriculum and read-only publication checks passed; the bank remains 110 live questions.
- Browser: mobile 8/10 clear with numeric enemy HP 20 and no finisher; desktop uninterrupted KO and feedback reload; restored zero-life Judah; Game Over → Retry (five lives, enemy 100%, question 1).
- Physical Android/iPhone, installed-PWA interruption, audible output and deployed-version/cache differences were not verified. The audit cannot attribute every previously observed missing fall to a specific session without its state/version trace.
- Only this report and the new test script were added. All 107 production-file hashes were compared before/after the build to verify runtime immutability. No commit, push, deployment, save migration or gameplay/animation fix was performed.
