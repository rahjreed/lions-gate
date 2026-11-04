# Permanent Scripture mastery medals

There are **28 available medals**: Bronze (10 consecutive category answers), Silver (25), Gold (50), and Master (at least 100 plus the later-review requirement below), in each of the seven established Biblical Knowledge Engine categories. Existing `knowledge.category` is authoritative; the original 42 questions use the existing `legacyKnowledge` mapping. Tags and book names do not create additional awards. Unknown future mappings are ineligible until deliberately assigned. Every current approved question maps to exactly one category without changing its content.

| Stable category ID | Existing category | Eligible approved questions |
|---|---|---:|
| people | Biblical people, places, and events | 25 |
| torah | Commandments, Torah, and biblical law | 104 |
| yeshua | Teachings of Yeshua | 12 |
| connections | New Testament connections to the Old Testament | 29 |
| context | Difficult and commonly misunderstood passages | 22 |
| kingdom | Prophecy, judgment, and the Kingdom | 14 |
| discernment | Complex Scripture interpretation, discernment, and leadership | 54 |
| **Total** | **One primary mastery category per question** | **260** |

These are the actual supported curriculum categories, rather than invented Torah/Prophets/Gospels subdivisions. The Trophy Room shows both full-bank and currently selected scope counts. A category with no eligible questions in one path remains visible; switching paths/collections never removes its earned medals.

The `kingdom` medal category measures Scripture knowledge about prophecy, judgment and the Kingdom. It is not a Kingdom-arrival/completion achievement and does not alter OT/NT study-path eligibility or the deferred Level 700 Kingdom feature.

## Accepted answers, repetition and review sessions

Only a successful `submit()` triggers `creditMasteryAnswer()`. It independently checks the accepted answer envelope, current collection/path eligibility, approved content fingerprint and recognized category. A persisted run-ID → accepted-answer-ordinal receipt prevents double credit from double-clicks, redraws, callbacks, reloads or reprocessing an old answer. No old run history is backfilled into medals. Normal repeated questions with a new accepted-answer ordinal remain eligible; question selection, cooldown, difficulty, missed-question reinforcement and retry rules are unchanged.

A wrong answer or timeout clears only that category's current streak and current-streak review evidence, including when a shield protects the player's life. Historical best and all earned tiers/timestamps remain. New runs, retries, Game Over and changes of character/collection/path do not themselves reset category streaks.

**Master requires at least 100 consecutive correct category answers and successful later reviews of two distinct questions from the same unbroken streak.** A review must revisit a previously correctly answered question in a different persisted review session. A new session is created only after at least **30 minutes with no accepted answer for that arcade identity**, even if the game window was left open. Starting a new run or refreshing immediately does not create another session. Incorrect answers in other categories count as activity but do not reset this category's streak. Clock rollback cannot create later-review evidence.

If two later reviews occur before the 100th correct answer, Master unlocks at 100. A player who reaches 100 within one session can return after a break and qualify through later reviews, without redoing the entire streak. The full requirement and current review count are visible on every category card.

## Persistence and identity

The existing version-3 save gains `profile.medals = {version: 1, identities: {...}}`; existing rank/wardrobe `profile.mastery` remains untouched. Each identity stores its stable ID, arcade name, category current/best counters, earned tier timestamps, per-question current-streak review records, qualifying review evidence, current session timestamps and answer receipts.

Identity keys use the game's existing 16-character arcade-name sanitization, case-insensitively: `arcade:` plus the encoded normalized name. A new run using the same name continues that identity's mastery. A different name selects another local identity; earlier identities and their Trophy Rooms remain in expandable saved-identity sections. These are local arcade identities, not authenticated accounts. Medal IDs are stable `category:tier` values, with the owner stored separately, so a future signed-in account can associate these records without changing medal IDs.

Missing legacy medal data starts empty without resetting the game or inventing historical awards. Invalid optional medal data is isolated from existing saves; valid earned tiers are retained independently of corrupt current-streak fields. Master records include the review evidence needed to validate their own award. No Firebase, authentication, network writes or cloud synchronization is implemented. Local storage and the device clock remain locally editable and are not trusted global leaderboard proof. As with existing whole-profile saves, use one active game window to avoid competing tab writes.

## Presentation and Hall of Masters

TROPHY ROOM is a secondary title-menu link. It shows all seven categories, 28 distinct tier slots, earned/locked labels, earned UTC dates, current/best streaks, progress bars and the explicit Master-review requirement. CSS supplies all medal visuals; no character artwork or assets were generated or changed.

An earned medal adds a five-second, nonblocking status notification inside the existing answer reveal after combat finishes. It uses the existing promotion sound (and existing SFX mute/volume behavior), adds no clicks/delays and respects reduced motion. Persisted awards are not replayed as celebrations after reload; the in-memory presentation is also deduplicated.

New real Game Over records may snapshot the owner's top three earned medals: highest tier first, then earliest earned date and stable medal ID. Old records and fictional demo rows receive no fabricated medal data. Ranking/score comparisons are unchanged. Snapshots describe medals known when that run was recorded, not retroactive cloud profiles.

## Changed files and checks

- Added `dist/mastery-medals.js` and `dist/mastery-medals.css`.
- Updated `dist/app.js`, `dist/storage.js` and `dist/index.html` for accepted-answer credit, optional persistence, Trophy Room, notifications and real Hall snapshots. The combat/question engine, approved questions and existing artwork are untouched.
- Added `scripts/test-mastery-medals.mjs`, `scripts/mastery-medals-revision.mjs` and `scripts/fixtures/mastery-medals-revision.json`; updated `scripts/study-path-revision.mjs` to preserve exact historical audit hashes.
- Updated the build runner and existing start-flow, share-score, combat-feedback, combat-victory and dialogue-expansion harnesses to execute the integrated code with its new medal dependencies. Unrelated gameplay mutations still fail historical checks.
- Production builds regenerate `dist/release.js`, `dist/sw.js` and `game-release.json` through the existing version/cache mechanism.

Focused checks cover all thresholds, 28 total awards, category-only reset, shielded/timeouts, legitimate repeats, duplicate events, later-session reviews, clock rollback, all six scopes, old/corrupt optional saves, retry/new-run preservation, top-three snapshots, unchanged score ordering and single nonblocking celebrations. Actual start-flow tests preserve a seeded prior identity's earned medal through a confirmed new game/name. Browser checks cover real single-answer credit, reload, desktop/390px/320px Trophy Room layout and focus; an explicitly unsaved visual fixture checks earned tiers and notification styling without altering a real player's achievements. No commit, push, merge or deployment is authorized by this work.

Final result: all **39 production test suites passed**, producing local game version **1.20** with a matching final content digest. The temporary visual fixture was removed before the successful build. Later-session timing was tested with controlled clocks, not by waiting for a physical 30-minute session break; native iOS/Android/PWA devices were not physically tested. No blocker remains for the local feature; cloud sync and server-trusted medal verification remain deliberately unimplemented.

## Category availability by Scripture scope

Permanent awards remain visible when a selected scope has zero eligible questions in a category. Counts below describe the current unchanged bank, not new content.

| Collection/path | people | torah | yeshua | connections | context | kingdom | discernment |
|---|---:|---:|---:|---:|---:|---:|---:|
| kjv80/complete | 25 | 104 | 12 | 29 | 22 | 14 | 54 |
| kjv80/ot | 21 | 103 | 0 | 10 | 6 | 11 | 34 |
| kjv80/nt | 4 | 0 | 11 | 3 | 15 | 3 | 3 |
| kjv66/complete | 24 | 104 | 12 | 29 | 21 | 12 | 48 |
| kjv66/ot | 20 | 103 | 0 | 10 | 5 | 9 | 30 |
| kjv66/nt | 4 | 0 | 11 | 3 | 15 | 3 | 3 |
