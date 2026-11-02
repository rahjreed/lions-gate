# Scripture collection selection

New games use: Title → Press Start → Collection → Player Name → Begin Game.
There are two ordered, unselected native buttons. Choosing one opens name entry;
Back returns to collection selection, and Back again returns to the title. No
save or name is changed until the existing final overwrite confirmation passes.

The stable run field `scriptureCollection` is `kjv80` or `kjv66`. Missing metadata
means `kjv80`, matching all previous releases. Loading a valid old run adds that
default without resetting its queue, score, powers, armor, achievements or name.
Continue and Retry use the existing run field and never require a new selection.
The save key and version remain unchanged. Hall of Masters ordering is unchanged.

`dist/scripture-collections.js` derives membership from the existing canonical
book metadata. It filters the one approved bank without copying or editing its
records. Every primary and supporting citation must belong to the selection.
For 66-book play, an explicitly named Apocrypha book in visible question text,
choices or explanation conservatively excludes the entire record. Nothing is
removed from an explanation or citation list to force it into the smaller pool.
Future records with ambiguous book/person names may need editorial review for
66-book eligibility; the present bank has no such additional exclusions.

Current eligible pools are 260 (80-book) and 250 (66-book), including 10 approved
Apocrypha-based records only in the full pool. The existing difficulty, variety,
disclosure-conflict and spaced-review selector runs after this filter, including
extended battles and retries. A genuinely insufficient custom pool fails with a
bounded error instead of looping; current pools are tested through Level 10001.
Invalid saved 66-book queues containing out-of-collection questions are rejected.

Historical source-hash audits are retained through an exact, reversible feature
revision fixture. They still reject unrelated edits; question/evidence hashes,
approval decisions and the published 260-question bank remain unchanged.

Run `node scripts/test-scripture-collections.mjs` and
`node scripts/build-site.mjs`. Physical iOS/Android/PWA checks remain separate
from desktop browser viewport tests; this feature does not change installation.

## Verified results

- Production build: all 34 configured checks pass; 121 output files and 109 local
  asset/module references verified, including the new offline-cached modules.
- New collection, protected-source and publication checks also pass on a clean
  Git/LF export with the exact tooling changes overlaid (local Node 24, not a
  remote Linux deployment).
- Both new-game choices, Back navigation, desktop/320px/390px presentation,
  keyboard name entry, 66-book answer links and saved Continue were checked in
  the browser. Automated tests cover supporting-reference exclusions, retries,
  Gatekeepers, extended encounters and higher Master levels through 10001.
- Current pools: 260/250. All approved question/explanation/source records,
  artwork, character dialogue and combat animations are unchanged.
- Remaining manual review: physical mobile keyboards, iOS/Android and installed
  PWA behavior. No unresolved current-bank collection eligibility issues found.

## Changed files

- Runtime: `dist/app.js`, `dist/engine.js`, `dist/question-selection.js`,
  `dist/storage.js`, `dist/style.css`.
- New selection/filter UI: `dist/scripture-collections.js`,
  `dist/collection-screen.css`.
- Tests/build: `scripts/build-site.mjs`, `scripts/test-start-flow.mjs`,
  `scripts/test-character-name.mjs`, `scripts/test-scripture-collections.mjs`.
- Exact historical-audit adaptation: `scripts/character-name-revision.mjs`,
  `scripts/collection-flow-revision.mjs`,
  `scripts/fixtures/collection-flow-revision.json`.
- Generated version/offline metadata: `dist/release.js`, `dist/sw.js`,
  `game-release.json`.
- Documentation: this file.
