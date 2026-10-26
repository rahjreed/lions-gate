# Lion's Gate — release handoff

## Readiness

The existing public game at https://lionsgate.callistadigital.com/ was loaded and played successfully during this audit. The local release update is prepared, not published or deployed. No cloud projects, DNS, deployment settings, or production data were changed.

- 42 existing live questions: Scripture-source audited, retained verbatim.
- 68 additional candidates: source-backed, validated, prepared for explicit release authorization.
- 32 candidates: quarantined with individual reasons in `content/launch/release-plan.json`.
- Proposed release bank: 110 questions. The current live module still contains only the original 42.
- The audit is attributed to **Codex, an AI-assisted Scripture-source review**, not personal owner approval or independent human certification.

Actual KJV passages and surrounding context were checked using eBible.org's KJV with traditional Apocrypha (standard 1769 edition, publisher update September 26, 2026). Selected evidence, edition information, source URLs, and archive/text hashes are recorded in `content/launch/scripture-evidence.json`; the downloaded corpus is ignored verification material. All 142 question records have evidence for every cited primary/supporting passage. The 80-book canon restriction remains enforced.

## Changes and limitations

Fixed answer reveals omitting supporting Scripture links: multi-passage questions now show all citations. A regression test covers three references. The offline cache revision was rebuilt; no save keys, gameplay rules, scoring, combat, character art, or progression were changed.

Prepared candidate copies replace incomplete evidence excerpts with exact passage text and use documented, opt-in difficulty calibration. Original question text, four choices, keyed answers, explanations, and candidate files are unchanged by the launch preparation. Every prepared-copy adjustment is in `content/launch/change-log.json`. Two selected questions intentionally reinforce different facts about fringes; the shared-topic warning is explicitly acknowledged. The original KR batch retains 18 quality warnings; these are not represented as all resolved. Unresolved candidates remain outside the proposed release.

The 110-question bank is suitable for an initial playable release but will repeat during endless play. Most content is introductory/context/comparison material; it is not a complete advanced/Master curriculum. Full Torah and advanced multi-passage coverage still need expansion and review. Quarantining a question can reflect distractor quality, scope, difficulty, duplication, or answer-disclosure concerns, not necessarily a false keyed answer.

Local and hosted review tooling was preserved. Local approval can omit written reasons while retaining the required confirmations and Scripture evidence. No dashboard work is needed to release this prepared batch.

## Verification completed

- `node scripts/build-site.mjs`: all 18 production validation/test scripts passed; 95 production files and 90 local asset/module references checked. Covers engine, saved progress, retry, audio synthesis/mute, effects, Judah/armor/adventure, combat/health/opponents, answer modal, PWA, celebration, pause, viewport, question engine and local editorial isolation.
- `node scripts/test-launch.mjs`: 142 audited records; 68 prepared/32 held; all 110 proposed questions selected across 1,000 levels with history; regular and Gatekeeper progression through Level 5; saved-run round trips; stale/tampered package rejection; idempotent approval staging in a disposable fixture only.
- `node scripts/test-kr-101-150.mjs`: schema, original content protection, 21 previously documented distractor edits, candidate exclusion, publication rejection, and 96 historical file snapshots enforced. Only the two documented answer-reveal/cache changes supersede historical hashes (`content/launch/runtime-fixes.json`).
- `node scripts/test-curriculum-coverage.mjs`: source hashes, coverage, citations, 142 original records, and unpublished candidate isolation passed.
- Hosted review tests/build passed locally using mocked authorization/persistence; no live Supabase or Vercel setup was performed.
- Actual public browser play: full Level 1, correct answers, shielded mistake, unshielded life loss, combat, answer modals, imperfect-level completion, pause/resume, refresh and saved-run continuation. Actual local production files also tested for correct/incorrect answer combat, Scripture reveal and pause/resume.
- Mobile browser overrides: 390×844 and 320×568 gameplay fit without horizontal/vertical overflow; all four answers remained visible. Small-screen public reveal and celebration inspected. Desktop/default browser gameplay also exercised.

Limits: no physical iPhone/Android installation, native zoom-gesture, speaker-output or real offline-network test was performed. Gatekeeper progression was automated, not visually played through in this browser audit. Local preview reported no captured warnings/errors. The public tab logged asynchronous message-channel errors; these did not interrupt the playthrough, but their origin was not independently isolated. Live hosted administration is deferred and is not a game-launch dependency.

## Existing hosting and release steps

Work in this inner repository: `C:\Users\Owner\Documents\GitHub\lions-gate\sites\lions-gate-sword-sharpener`.

Git remote: `https://github.com/rahjreed/lions-gate.git`; inspected branch `main`, previously matching `origin/main` at `66dd6ed`. This is a static dependency-free Node 24 application authored in `dist/`, not a Vite build. Existing `vercel.json` specifies Other/framework null, empty install command, `node scripts/build-site.mjs`, and output `dist`. It was not changed. No new repository, Vercel project, Supabase project or DNS record is needed for this release. The public hostname already resolves and serves the game.

The authenticated Vercel project's Git linkage/root settings were unavailable; confirm them in the existing game's project before release if Git auto-deployment does not run. Use this actual repository root, Node 24, build command above, and `dist` output. Do not create a replacement project or modify unrelated projects.

**Only after explicit owner authorization to publish the 68 prepared questions and release the game update**, run:

```powershell
node scripts/test-launch.mjs
node scripts/stage-launch.mjs --authorize-publication
node scripts/question-batch.mjs publish content/launch/reviewed-candidates.json
node scripts/build-site.mjs
node scripts/test-kr-101-150.mjs
node scripts/test-curriculum-coverage.mjs
```

The first command is a pre-publication preflight expecting 42 live questions. Staging records the AI-attributed source reviews without overwriting conflicting editorial decisions. The existing publishing CLI validates approval, freshness, evidence and schema before writing the additional live module. Approval staging alone does not publish. All 32 held candidates must remain excluded.

Then review/commit the publication and rebuilt cache, push the authorized changes to the existing `main`, and verify the existing Vercel deployment. Check public title/start, answer modal and all citations, saved progress, mobile layout, Gatekeeper entry, manifest/assets, and a fresh service-worker update on the same hostname. Git push/deployment and candidate publication have **not** been performed during preparation. A preparation commit alone does not include the 68 questions in gameplay.

The single remaining owner decision is: authorize publication of the 68 prepared additions and release of the verified game update to the existing public site.
