# Lion's Gate — wilderness and Kingdom progression

Design decision updated October 26, 2026. **Kingdom entry occurs after successful completion of Level 700**, replacing the earlier proposed Level 450 destination. Reaching or starting Level 700 is not completion. Level 450 is the final planned armor milestone, not the end of the wilderness campaign.

This document establishes the approved narrative destination and proposes the campaign leading to it. It does not implement new combat rules, question selection, unlocks, transformations, save fields, scenery, or post-entry gameplay.

## Armor schedule — unchanged

| Successfully completed level | Permanent cosmetic equipment | Current implementation |
| --- | --- | --- |
| 75 | Belt of Truth | Earnable, fitted to Judah's ranks and poses |
| 150 | Shoes of Peace | Planned; Armory preview only |
| 225 | Breastplate of Righteousness | Planned; Armory preview only |
| 300 | Shield of Faith | Planned; Armory preview only |
| 375 | Helmet of Salvation | Planned; Armory preview only |
| 450 | Sword of the Spirit | Planned; Armory preview only |

The Armory lists belt, breastplate, shoes, shield, helmet, sword in Ephesians 6:14–17 order; acquisition order follows the table. No milestone is moved to Level 700. The eventual Full Armor achievement belongs to completing all six equipment milestones at Level 450, not to Kingdom entry.

In the completed design, Judah wears all six pieces continuously through Levels 451–700, including idle, attacks, recoil, recovery, victory, promotions and journeys. They accumulate alongside rank clothing rather than replacing Judah or resetting his rank. Armor remains cosmetic; the Shield of Faith equipment must not be confused with the existing consumable life-protection shield. The five unfinished equipment systems must be authored, fitted and tested before claiming this fully armored campaign is delivered. The current game still equips only the implemented belt.

## Final wilderness campaign — proposed gameplay, not implemented

Keep ten four-choice Scripture questions per level and the existing fifth-level Gatekeeper cadence as the baseline. Revisit all earlier categories with greater contextual depth. Difficulty should rise gradually within and between these bands rather than suddenly resetting at a boundary.

| Levels | Campaign purpose | Proposed Scripture and leadership challenge | Proposed combat presentation/challenge |
| --- | --- | --- | --- |
| 451–525 | Stand in the full armor | Advanced commandment context, Torah/Prophets/Yeshua connections, discernment of quotations and traditions; leadership through faithful service | Full equipment remains visible; introduce the final campaign's encounter progression while retaining readable anticipation, impact and recovery |
| 526–600 | Exercise righteous judgment | Multi-passage reasoning about witnesses, impartial judgment, restitution, inheritance and duties toward vulnerable people; distinguish stated conditions and exceptions | Gradually increase the demands of regular and Gatekeeper encounters, with clear cues and fair recovery opportunities |
| 601–650 | Lead under pressure | Covenant responsibility, counsel, accountability, mercy, justice and prophetic warnings; compare leadership choices against the actual passages | Escalate encounter sequences and Gatekeeper emphasis; retain pause, retry and accessible feedback |
| 651–699 | Final wilderness proving | Integrated Torah, Prophets and apostolic context; demanding leadership scenarios, restoration, judgment and Kingdom government; reinforce earlier mistakes without repetitive answer disclosure | Highest wilderness challenge, paced toward the final gate without abrupt stat inflation or unreadable attacks |
| 700 | The Lion's Gate | A culminating Gatekeeper encounter testing Scripture-grounded discernment and readiness for responsible leadership | Conclude the wilderness campaign only after the level's normal successful-clear condition; finish combat/reveal presentation before the eventual entry sequence |

These are design objectives, not shipped mechanics or new question approvals. Before implementation, report concrete proposed combat, pacing, timing or difficulty changes for approval and test their balance. Do not silently reduce question timers, add damage, change health/lives/shields, introduce new failure conditions, or require a perfect level to enter the Kingdom. Leadership tests should remain four-choice Scripture questions, with one defensible answer, exact citations, helpful explanation, reviewed plausible distractors, and a stated framework where interpretation is disputed. Never use unreviewed drafts to fill these bands.

The current runtime target reaches complexity 7 at Level 525 and then saturates. Sustained escalation through 700 needs a separately reviewed selection/encounter plan and enough genuinely advanced approved content; changing level labels alone cannot provide it. Do not expand the question schema or its 1–7 complexity scale without a separate compatibility plan. Existing earlier topics must continue to recur at higher reasoning levels.

## Kingdom-entry boundary and next phase

After successfully completing Level 700, Judah reaches the Lion's Gate associated with the tribe of Judah and enters the Kingdom, beginning the next major phase of the game. The gate-of-Judah motif draws on Ezekiel 48:31, which names a gate of Judah among the tribal gates. The Lion's Gate name, level numbers and campaign staging are game narrative design.

The future transition must wait for final combat recovery, answer reveal and the successful-clear flow. Defeat, timeout resulting in game over, retry, entering the level, or merely answering its final question before the existing clear action must not trigger entry. Completion need not mean ten correct answers: retain the game's existing surviving-ten-questions rule unless a separate gameplay change is approved.

Kingdom transformation, new character appearance, post-entry encounters, rewards, world systems and Level 701 behavior are **deferred**. No new entry reward, duplicate grant, save migration, level cap or one-time cinematic is implemented now. A future implementation must handle existing saves already beyond Level 700 without losing progress or replaying grants; its migration/acknowledgment design requires review first.

## Existing runtime audit

- `dist/engine.js`: `advance()` records successful completion and returns `levelup`; `nextLevel()` increments without a 450/700 ending. Ten-question levels, fifth-level Gatekeepers, existing lives, scoring and Master degrees continue normally beyond both boundaries.
- `dist/knowledge.js`: seven 75-level curriculum bands end at 525; `endless` means curriculum saturation after 525, not Kingdom entry or a narrative ending. There is no Level 450 entry trigger.
- `dist/adventure.js`: a repeating journey selects an existing Lion's Gate approach for fifth-level encounters (and through the regular location cycle). The generic symbolic gate can open after ordinary level clears. Neither is a Kingdom-entry event. A future narrative transition must distinguish these reusable assets from the unique Level 700 milestone.
- `dist/app.js`: ordinary results, promotion and next-level/journey controls; no special Kingdom screen or transformation.
- `dist/storage.js`: version-3 saves preserve completed levels, retries, ranks and current equipment; no Kingdom phase flag.
- `dist/armor.js`: the display catalog has the six schedule values above; only the belt participates in reconciliation/unlocks. Level 450 is the planned sword threshold, not a runtime ending.

Accordingly, the current playable game still advances from 700 to 701 normally. This is intentional preservation pending a separately authorized Kingdom implementation, not a claim that Kingdom entry is already playable. No hardcoded ending needed removal. Older armor documentation had an outdated 300/375/450 item sequence; it is corrected to the current schedule without changing gameplay.

## Verification and future acceptance

`node scripts/test-campaign-boundaries.mjs` tests the current 449/450/451, 525/526 and 699/700/701 boundaries, successful clears, save restoration, retained belt ownership, retry at 700, fifth-level Gatekeepers, and continued progression without premature transformations. These are preservation tests, not proof of a finished final campaign.

Before the campaign/entry implementation ships, also verify cumulative six-piece equipment across all ranks and poses, progressively challenging approved content, fair encounter tuning, mobile presentation, pause/retry, successful-clear-only entry, once-only persistence, and backward compatibility for saves on both sides of 700. Post-entry gameplay remains a separate design and implementation task.
