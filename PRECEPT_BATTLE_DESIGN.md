# Lion's Gate — Precept Battle Mode

The playable arena uses the [Sabbath vs Sunday pilot](content/PRECEPT_BATTLE_SABBATH_PILOT.md) with its original exchanges and citations. V2 updates the arena to percentage health. The [Scripture-to-Scripture draft](content/precept-sabbath-v2-draft.json) is a separate editorial proposal paired with [KJV verse evidence](content/precept-sabbath-v2-kjv-evidence.json).

The V2 proposal presents the Roman's KJV excerpt before his claim. It offers two shuffled responses, each with Akobi's argument first and a short supporting KJV excerpt second. The selected response stays in the lower panel during combat and receives its own feedback. Until the proposal receives explicit approval, the playable arena presents the approved key and one original alternative from each exchange. The original citations are shared context below the pair. The full proposal is available in the [editorial review copy](content/PRECEPT_BATTLE_SABBATH_V2_REVIEW.md).

Before replacing the playable pilot, review each proposed key against its exact claim. Give particular attention to the competing readings of the Lord's day, the scope of days in Romans 14, the scope and implications of Sabbath language in Colossians 2, and the remaining rest in Hebrews 4. In the closing exchange, check that the weaker option claims authority to call Sunday the Sabbath. A claim limited to permission to gather on Sunday would be defensible. The draft includes notes and feedback for both responses.

## Arena flow

From the title, choose **Press Start** or **New Game**, then **Precept Battle**. Accept the first-entry notice if prompted and select **Sabbath vs Sunday**. Back from the notice or topic picker returns to the mode picker. Exiting an active or completed battle returns to the title. **Continue** on the title opens the saved Story run directly. The arena reuses Akobi and the Roman soldier against a stone arena backdrop.

### Required entry screen

Use this player-facing copy:

> ### ⚔️ PRECEPT BATTLE MODE — BEFORE YOU ENTER
>
> Because of the depth of Yah's Word, Precept Battle Mode is designed for players who recognize the authority of both the Old and New Testaments and believe Yah's commandments remain relevant today.
>
> Each battle challenges you to examine biblical teachings, answer opposing arguments, and defend your understanding through Scripture.
>
> **Precept upon precept. Line upon line.**
>
> Are you ready to enter the arena?

- **Enter the Arena** confirms readiness and opens topic selection. Require an explicit button activation. Opening the screen or pressing Enter with focus on the heading must leave the player on the screen.
- **Back** and Escape return to the title menu. Focus the heading on entry and return focus to **Precept Battle** on exit.
- Show this screen once per local browser profile, as specified in the V1 brief. Store acknowledgment under a separate local key. **Replay Battle** starts a fresh attempt directly. This is a readiness confirmation, with no religious identification or agreement required.

Show both health bars and chain progress. Use the question panel below the fighters for every dialogue turn. Label the current speaker **Roman Soldier** or **Akobi**. Display four choices under the Roman's claim, then show Akobi's selected response in the same panel during combat. Put compact Scripture feedback directly beneath the response.

1. The player selects a response. Lock input for the exchange and play the existing combat animation.
2. At impact, apply the damage once and update the health bars. After the animation, show a compact reveal with the best response, a brief explanation, and KJV links.
3. On a correct response, **Continue** opens the next rebuttal. On an incorrect response, **Try this rebuttal again** returns to the same claim with the same choices. Since the reveal teaches the answer, a corrected retry counts as a successful response. Health loss supplies the penalty.
4. After the fifth success, the Roman concedes the first point and pivots to the second argument in the lower panel. Keep both health bars as they are.
5. At the tenth success, play the existing finishing strike, show the final compact reveal, then offer **Replay Battle** and **Return to Menu**. At zero Akobi health, show the final correction and a defeat screen with the same actions. Replay starts both chains from the beginning with full health.

Both fighters start at 100% health. Each wrong answer deals 20 percentage points of damage to Akobi. Each success deals 10 percentage points of damage to the Roman. Wrong answers leave the Roman's health and rebuttal cursor where they were. The fifth success leaves 50% health and the tenth leaves zero. With four errors the player can still win at 20% health. The fifth error ends the attempt, even at the last rebuttal. The pilot has no timer, shields, power-ups, scores, or Story rewards. Pace comes from short dialogue and one response per exchange.

## Editorial model

Each chain has five fixed, linked exchanges. Keep their order on replay and shuffle only the four response choices once per attempt. Early moves establish common ground and identify what a passage states. Later rebuttals combine evidence or press harder on implications. The Roman should refine his case after each answer and concede specific points where warranted. His arguments reflect positions some Christians use. His dramatic role does not stand for Christians as a group.

Use the curriculum's seventh-day Sabbath framework. Grade the response that most directly and accurately addresses the current claim using the cited passage. Separate explicit wording, reasonable inference, and a disputed doctrinal conclusion. A passage's silence may establish that the passage contains no explicit transfer command. It cannot settle the entire history or theology of Sunday observance. Distractors should make plausible mistakes about scope, genre, or inference. Avoid using an unrelated verse or an obviously absurd claim as the only contrast.

Use a separate, versioned battle definition. A Story question is independently selectable, whereas a precept exchange depends on the preceding rebuttal.

| Record | Proposed fields |
| --- | --- |
| Battle | Stable ID, revision, topic, title, arena preset, review status, two ordered chains |
| Chain | Stable ID, short label, five ordered exchanges |
| Exchange | Stable ID, Roman claim, four responses, correct response ID, compact explanation, primary Scripture and optional supporting references |
| Response | Stable ID and display text |
| Editorial evidence | Battle revision, source references, reviewer decision, and review notes on each claim, correct response, and distractor |

Retain source and review conventions from the existing editorial workflow, including revision-bound approval and canon checks. Validate unique IDs, exactly two chains of five exchanges, four distinct responses, exactly one matching correct ID, and valid evidence for each graded response. Require a human review of theological fairness, source context, answer uniqueness, and continuity. Draft battles remain outside the public output. The pilot's passages are all within the 66-book collection and also eligible in the 80-book collection. Arena topic choice is independent of the Story save's study path.

Start with Sabbath vs Sunday. Expand only after the pilot works as a connected debate. Select later topics for a clear initial claim, two distinct lines of argument, and ten meaningful textual moves. The law's endurance, faith and works, dietary laws, and the New Covenant are candidates. Restoration and prophecy should follow once the review process can handle multi-passage interpretation.

## Smallest implementation path

1. Add a separate battle module and small pure attempt reducer. Proposed state includes battle ID and revision, phase, successes, Akobi health, the current response order, and pending outcome. Derive chain and exchange from successes, and enemy health from successes times ten. Use phases for answering, animating, reveal, victory, and defeat. Reserve the response immediately, apply the outcome once at impact, and advance the visible prompt only after the reveal closes. Keep attempt state in memory for the pilot. A refresh returns to the menu, and retry creates a new attempt.
2. Add title entry, the required **Before You Enter** screen, topic picker, arena view, and results routes in `dist/app.js`, with separate arena actions and state. Require readiness confirmation before opening topic selection or creating an attempt. Leave the Story run, answer queues, progression, and persistence path intact. Story's `choose` and `proceed` call engine and persistence logic tied to scoring, mastery, dialogue checkpoints, and level advancement. Route arena selections to the arena reducer instead of those handlers.
3. Reuse `CombatDirector`, `paintCombat`, and `romanSoldier` from `dist/combat.js` with an arena-owned director. Use the director's impact and finish callbacks for synchronization, its pause and resume methods for backgrounding, and cancel on exit. Reuse `combatDamageFeedback` with arena before-and-after values. The existing health markup derives opponent identity from Story level and damage from Story answers. Use a small arena meter adapter or extract neutral rendering only when implementing, with Story regression coverage.
4. Use an accessible arena dialog as the separate view and keep feedback inline in its lower question panel. Reuse sprites, motion preferences, existing combat sound cues, and audio settings. Arena pause and exit operate on arena state only. Keep essential Roman prompts visible even if optional character dialogue is disabled.
5. Verify that entering from the title shows the full entry copy, explicit confirmation opens topic selection, and Back and Escape return to the title without creating an attempt. Verify all ten successes, the chain boundary at five, wrong-answer retries, fifth-error defeat, final-hit sequencing, repeated input, pause and background recovery, cancellation during animation, reduced motion, and mobile layout. Verify that entering, replaying, and exiting the arena leaves Story progress, rewards, and saved profile intact. Run the production build and confirm the reviewed battle asset is available offline once runtime wiring exists.

Review the pilot for fairness first. Then implement a single local, unscored arena using the existing stage and combat director. Play it through on desktop and a narrow phone before investing in custom arena art or more topics.
