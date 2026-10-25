# Biblical Knowledge Engine

This upgrade changes educational content selection and authoring only. Combat times, points, lives, retry reward limits, ranks, armor, animations, local-save version 3 and PWA behavior retain their existing rules. Saved queues are restored unchanged. No candidates have been published.

## Curriculum

| Levels | Primary emphasis (not exclusive) |
| --- | --- |
| 1–75 | Biblical people, places, and events |
| 76–150 | Commandments, Torah, and biblical law |
| 151–225 | Teachings of Yeshua |
| 226–300 | New Testament connections to the Old Testament |
| 301–375 | Difficult and commonly misunderstood passages |
| 376–450 | Prophecy, judgment, and the Kingdom |
| 451–525 | Complex Scripture interpretation, discernment, and leadership |
| 526 onward | All categories, continued high-level review |

These are curriculum stages, not new scenery, rank requirements or world transitions. The existing Master title begins much earlier; earning that title does not skip the curriculum. All earlier categories remain eligible. Higher-complexity questions can revisit earlier subjects.

`knowledgeStage(level)` supplies a continuous target from 1 to 7 across levels 1–525. Selection balances the ten-question set around that target, rather than jumping immediately to the hardest available question. Gatekeepers target one additional complexity point, capped at 7, and retain their three trap-type priorities. Targets saturate after 525; endless progression is preserved without claiming an endless supply of increasingly difficult content.

The legacy `difficulty` 1–3 remains the display tier. New records additionally have `knowledge.complexity` 1–7, `knowledge.category`, `knowledge.concept` and `knowledge.mode` (`explicit`, `multi-passage`, `framework`). Use 1–2 for recall, 3 for close context, 4–5 for comparison, and 6–7 for demanding passage-supported discernment and leadership scenarios. Difficulty needs human calibration: number of citations alone does not establish difficulty.

**Current limitation:** The 42 live questions still contain only their original three difficulty tiers. The engine cannot produce genuinely new advanced reasoning by relabeling them. Higher stages presently use the hardest eligible reviewed material with rotation. The 50 new candidates have not changed live gameplay content.

## Rotation and saves

- Keep the existing target of seven commandment/context focus questions and three general questions, as availability permits.
- Prefer a different retry queue and avoid the last 20 answered questions when alternatives exist.
- Balance cumulative exposure, target difficulty, category and concept diversity. A concept penalty reduces clusters without making categories exclusive.
- A previously missed item gets reinforcement priority after a 20-answer delay. A later correct response clears this priority.
- Prevent co-selection when a question explicitly contains another item's sufficiently specific correct answer. Short/common answers and paraphrased disclosures require editorial review.
- Preserve the `{id, order}` queue format. Save optional `misses` and `lastCorrect` history fields; older histories without them remain valid.
- Fall back to available reviewed difficulty if the eligible pool is too small. Never admit a draft to fill a level. Fail clearly if fewer than ten non-conflicting approved items exist.

Repetition cannot be eliminated with 42 questions, especially with focus and Gatekeeper quotas. Retry avoidance and cooldown are preferences, not promises when the pool is constrained.

## Records and safeguards

The original 42 records, citations, answers and fixed approval fingerprints remain intact. A sidecar maps their subjects into the seven curriculum categories without rewriting their reviewed content. Explicit publication appends records from `dist/published-questions.js` (currently empty).

New records keep all legacy fields and add knowledge metadata and optional `supportingScriptures`. Each supporting citation has the same KJV book/chapter/verse/excerpt/URL fields as the primary citation. The complete content, knowledge metadata, framework and supporting citations are included in the approval fingerprint. Multi-passage records need supporting citations. Framework questions must name `interpretiveFramework` in their player-facing question.

Validation checks the 80-book allowlist, chapter bounds, positive verse/range values, matching source URLs, exact answer mapping, four distinct options, excluded/private material, category/complexity/mode, duplicate IDs/wording and stale approvals. Quality checks flag near duplicates, answer disclosures, answer-length clues, absolute/shortcut distractors and repeated concepts. Publishing requires a completed editorial checklist, rationale, four option rationales, reviewer/date and explicit resolution of any warnings.

These checks cannot establish every verse's existence, quote accuracy, a single defensible answer, plausible distractors or theological validity. The maximum-verse bound is only a malformed-reference safeguard, not a complete verse-count database. Read every cited passage in context, check exact quotations against KJV, and explain why each alternative is wrong **for this question**. Do not treat disputed applications or denominational traditions as explicit textual facts. Prefer observation questions; otherwise name the interpretive framework and cite all supporting passages.

The human review checklist is a local editorial safeguard, not cryptographic proof of who reviewed a file. Never regenerate approvals during a build.

## Batch workflow

Run commands from this repository. Candidate and reviewed working files belong under `content/`, outside `dist/`. They are not imported by the app and are not precached by the PWA.

1. Draft an array using the records in `content/candidates/initial-50.json` as a structural example. Use stable globally unique IDs and distinct concepts. Do not change an already published ID to refer to different content.
2. Import: `node scripts/question-batch.mjs import incoming.json next-batch`. This strips approval metadata, validates structure and creates `content/candidates/next-batch.json` without overwriting an existing file.
3. Validate: `node scripts/question-batch.mjs validate content/candidates/next-batch.json`. This compares the batch with the live bank and reports errors/warnings. Zero warnings is not an approval.
4. Create an unchecked checklist: `node scripts/question-batch.mjs template content/candidates/next-batch.json content/next-review.json`.
5. A reviewer reads all passages, checks the context and wording, supplies `reviewedBy`, `reviewedOn`, `rationale`, all seven `checks`, four nonempty `optionRationales` and `resolvedWarnings` (copy any warning text only after resolving it). Leave uncertain IDs out of the evidence file; they stay candidates. Correct drafts before reviewing. Do not mark uncertainty as verified.
6. Export completed reviews: `node scripts/question-batch.mjs review content/candidates/next-batch.json content/next-review.json content/next-reviewed.json`. Only completed verified records are exported. This does not touch live content.
7. Inspect the reviewed diff and preview the questions. When content publication is expressly authorized, use `node scripts/question-batch.mjs publish content/next-reviewed.json`. It checks approvals and duplicates, saves a backup outside the deployed shell, and appends to the published module. No publication command was run for this task.
8. Run `node scripts/build-site.mjs` before deployment. This runs the entire configured automated suite, including content, engine, save/retry, combat, armor, pause and PWA tests. Inspect content changes before any separate Git/deployment action.

Builds never import candidates, approve questions or call an AI model. Thousands of records use the same engine and static/offline publication pipeline.

## Initial batch and review status

- Existing reviewed questions: **42**, preserved.
- New candidates: **50**, all still `candidate`; published additions: **0**.
- Seven-category distribution: people 8; Torah 8; Yeshua 7; connections 7; context 7; Kingdom 7; discernment 6.
- Candidate structural/quality report: **0 errors, 0 automated warnings**, not publication-ready.
- Preliminary source checks used KJV passages and their immediate contexts, not website commentary. Where a verse page returned 403/429, chapter pages were used; Exodus 17:12 was checked in Bible Gateway KJV. Actual checked URLs are recorded per item.
- Every candidate still needs independent review of context, exact answer uniqueness, distractors, quotations, scope and difficulty. Multi-passage items need particular care. No prophetic timetable, modern national identity, or disputed dietary/covenant conclusion was approved.
- See `content/INITIAL_50_REVIEW.md` for every candidate, correct answer, citation and source-check URL.

## Verification and expansion toward 500

The knowledge suite tests all 75-level boundaries, monotonic targets through 10,000 levels and safe-integer extremes, mixed difficulty, category variety, delayed reinforcement, retry freshness, old saves, immutable restored queues, Gatekeeper traps, draft exclusion, publication gating and malformed/duplicate/leaking/framework cases. A synthetic 1,000-record bank verifies capacity; these fixtures are not educational content and cannot enter the live bank. Timing is measured locally and is not a physical-phone benchmark.

To reach **500 reviewed questions**, add **458** approved records. If all initial 50 pass independent review, **408** more are needed. Review batches of 25–50. A useful eventual allocation is 70 people, 80 Torah, 60 Yeshua, 80 connections, 70 context, 70 Kingdom and 70 discernment questions, counting existing records toward those totals. Cover the traditional Apocrypha deliberately alongside OT/NT passages, and maintain enough genuinely relevant focus-tagged items for the 7:3 rotation. Track coverage and source diversity rather than filling quotas with near duplicates.

Prioritize complexity 4–7, distinct passage comparisons and careful leadership scenarios: this is the current capacity gap. Pilot distractors and difficulty with readers, review miss rates, and adjust unpublished candidates before approval. Expand unique concepts and several variants at different complexities before claiming low repetition across hundreds of levels. Review live content changes explicitly; never invalidate saved queues by silently removing published IDs.
