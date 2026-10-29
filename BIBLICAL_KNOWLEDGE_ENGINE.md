# Biblical Knowledge Engine

Permanent curriculum/editorial policy: [BIBLICAL_CURRICULUM_AND_DOCTRINE.md](BIBLICAL_CURRICULUM_AND_DOCTRINE.md). Current local inventory: **260 live questions (42 original + 68 earlier additions + 50 course additions + 100 newly authorized Torah additions), 32 held unpublished candidates**. The 250 candidate source records include 218 retained working copies of published IDs. See the [banked publication report](content/banked-publication/REPORT.md). The opt-in adapter in [LOCAL_QUESTION_REVIEW.md](LOCAL_QUESTION_REVIEW.md) preserves the existing display 1–3 / complexity 1–7 schema; publication does not imply independent human Scripture verification.

The [ten-unit course syllabus](BIBLICAL_COURSE_SYLLABUS.md) adds historical organization alongside all 18 subject topics. Its 50 course records are live with owner-authorized AI-assisted review, including 25 provisionally mapped to complexity 4–7. The new deep-Torah batch adds 50 Unit 06 records. Historical progression and semantic-family rotation remain proposals. Existing expanded educational metadata for 160 questions is retained; the 100 new additions use the existing compact explanation/metadata fallback. No lesson panels or optional study mode were introduced. Saved queues are unchanged, and disclosure checks also cover battle extensions. Earlier inventory counts below describe historical releases.

This upgrade changes educational content and publication records only. Combat times, points, lives, retry reward limits, ranks, armor, animations, local-save version 3 and PWA behavior retain their existing rules. Saved queues are restored unchanged. Exactly 218 additions have been published locally with explicit owner authorization; no deployment has occurred.

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

## Planned wilderness finale and Kingdom entry

[GAME_PROGRESSION.md](GAME_PROGRESSION.md) establishes **successful completion of Level 700** as Judah's Kingdom-entry milestone, superseding the earlier proposed Level 450 destination. Level 450 remains the planned Helmet of Salvation unlock and completion of the six-piece armor schedule. Levels 451–700 are the final wilderness campaign with all six pieces retained in the completed design; five pieces still need equipment implementation today.

The proposed campaign extends advanced Scripture comparison, contextual interpretation and leadership tests across 451–525, 526–600, 601–650 and 651–699, culminating in the Level 700 Gatekeeper. Categories remain mixed. Concrete encounter tuning, additional reviewed questions and any selection changes must be reported before implementation. Current runtime stages, the target ceiling at 525, saves, approved questions and endless progression are unchanged. Neither Kingdom transformation nor post-entry gameplay is implemented by this documentation update.

`knowledgeStage(level)` supplies a continuous target from 1 to 7 across levels 1–525. Selection balances the ten-question set around that target, rather than jumping immediately to the hardest available question. Gatekeepers target one additional complexity point, capped at 7, and retain their three trap-type priorities. Targets saturate after 525; endless progression is preserved without claiming an endless supply of increasingly difficult content.

The legacy `difficulty` 1–3 remains the display tier. New records additionally have `knowledge.complexity` 1–7, `knowledge.category`, `knowledge.concept` and `knowledge.mode` (`explicit`, `multi-passage`, `framework`). Use 1–2 for recall, 3 for close context, 4–5 for comparison, and 6–7 for demanding passage-supported discernment and leadership scenarios. Difficulty needs human calibration: number of citations alone does not establish difficulty.

**Current coverage:** The 160 live questions cover complexity 1–7 with counts 31/62/42/10/8/5/2. Advanced breadth remains limited, especially complexity 6–7; existing fallback and rotation rules remain necessary. The 50 Torah everyday-life drafts remain unpublished.

## Rotation and saves

- Keep the existing target of seven commandment/context focus questions and three general questions, as availability permits.
- Prefer a different retry queue and avoid the last 20 answered questions when alternatives exist.
- Balance cumulative exposure, target difficulty, category and concept diversity. A concept penalty reduces clusters without making categories exclusive.
- A previously missed item gets reinforcement priority after a 20-answer delay. A later correct response clears this priority.
- Prevent co-selection when a question explicitly contains another item's sufficiently specific correct answer. Short/common answers and paraphrased disclosures require editorial review.
- Preserve the `{id, order}` queue format. Save optional `misses` and `lastCorrect` history fields; older histories without them remain valid.
- Fall back to available reviewed difficulty if the eligible pool is too small. Never admit a draft to fill a level. Fail clearly if fewer than ten non-conflicting approved items exist.

Repetition cannot be eliminated with 160 questions, especially with focus and Gatekeeper quotas. Retry avoidance and cooldown are preferences, not promises when the pool is constrained.

## Records and safeguards

The original 42 records, citations, answers and fixed approval fingerprints remain intact. A sidecar maps their subjects into the seven curriculum categories without rewriting their reviewed content. Explicit publication appends records from `dist/published-questions.js` (now the exact 68 earlier additions plus 50 authorized course additions).

New records keep all legacy fields and add knowledge metadata and optional `supportingScriptures`. Each supporting citation has the same KJV book/chapter/verse/excerpt/URL fields as the primary citation. The complete content, knowledge metadata, framework and supporting citations are included in the approval fingerprint. Multi-passage records need supporting citations. Framework questions must name `interpretiveFramework` in their player-facing question.

Validation checks the 80-book allowlist, chapter bounds, positive verse/range values, matching source URLs, exact answer mapping, four distinct options, excluded/private material, category/complexity/mode, duplicate IDs/wording and stale approvals. Quality checks flag near duplicates, answer disclosures, answer-length clues, absolute/shortcut distractors and repeated concepts. Publishing requires a completed editorial checklist, rationale, four option rationales, reviewer/date and explicit resolution of any warnings.

These checks cannot establish every verse's existence, quote accuracy, a single defensible answer, plausible distractors or theological validity. The maximum-verse bound is only a malformed-reference safeguard, not a complete verse-count database. Read every cited passage in context, check exact quotations against KJV, and explain why each alternative is wrong **for this question**. Do not treat disputed applications or denominational traditions as explicit textual facts. Prefer observation questions; otherwise name the interpretive framework and cite all supporting passages.

The human review checklist is a local editorial safeguard, not cryptographic proof of who reviewed a file. Never regenerate approvals during a build.

## Batch workflow

Run commands from this repository. Candidate and reviewed working files belong under `content/`, outside `dist/`. They are not imported by the app and are not precached by the PWA.

1. Draft an array using the records in `content/candidates/initial-50.json` as a structural example. Use stable globally unique IDs and distinct concepts. Do not change an already published ID to refer to different content.
2. Import: `node scripts/question-batch.mjs import incoming.json next-batch`. This strips approval metadata, validates structure and creates `content/candidates/next-batch.json` without overwriting an existing file.
3. Validate: `node scripts/question-batch.mjs validate content/candidates/next-batch.json`. This compares the batch with the live bank and reports errors/warnings. Zero warnings is not an approval.
4. Start the separate local review app: `node scripts/review-server.mjs`, then open http://127.0.0.1:4310/. It displays all candidate batches, filters and provisional curriculum coverage.
5. Read every cited passage and supply exact checked excerpts, reviewer/rationale, all seven confirmations, four option rationales and warning resolutions. Approve saves a source-bound decision in `content/editorial/decisions.json`; Revise/Reject never qualify. The editor never rewrites question content. See [LOCAL_QUESTION_REVIEW.md](LOCAL_QUESTION_REVIEW.md).
6. Export current approved records: `node scripts/editorial.mjs export content/reviewed/next-reviewed.json`. This creates a new file without publishing. The raw checklist review command is retired.
7. Inspect the reviewed diff. Only after explicit owner authorization use `node scripts/question-batch.mjs publish content/reviewed/next-reviewed.json`. Publication rechecks current ledger approval, unchanged source, evidence, schema and duplicates, backs up the module, then appends. Later Revise/Reject or changed content invalidates old exports. The authorized first publication contains 68 AI-attributed additions; subsequent batches require their own authorization.
8. Run `node scripts/build-site.mjs` before deployment. This runs the entire configured automated suite, including content, engine, save/retry, combat, armor, pause and PWA tests. Inspect content changes before any separate Git/deployment action.

Builds never import candidates, approve questions or call an AI model. Thousands of records use the same engine and static/offline publication pipeline.

## Initial batch and review status — historical pre-publication snapshot

The following distribution and preliminary source-check notes describe the **first** 50-candidate batch, not all 100 candidates. The later KR batch remains separately documented in `content/KR_101_150_REVIEW.md`; its 1–10 source ratings, pending evidence and targeted choice revisions are preserved.

- Existing reviewed questions: **42**, preserved.
- New candidates: **50**, all still `candidate`; published additions: **0**.
- Seven-category distribution: people 8; Torah 8; Yeshua 7; connections 7; context 7; Kingdom 7; discernment 6.
- Candidate structural/quality report: **0 errors, 0 automated warnings**, not publication-ready.
- Preliminary source checks used KJV passages and their immediate contexts, not website commentary. Where a verse page returned 403/429, chapter pages were used; Exodus 17:12 was checked in Bible Gateway KJV. Actual checked URLs are recorded per item.
- Every candidate still needs independent review of context, exact answer uniqueness, distractors, quotations, scope and difficulty. Multi-passage items need particular care. No prophetic timetable, modern national identity, or disputed dietary/covenant conclusion was approved.
- See `content/INITIAL_50_REVIEW.md` for every candidate, correct answer, citation and source-check URL.

## Verification and expansion toward 500

Current release-specific targets and exact complexity gaps are in [ADVANCED_QUESTION_COVERAGE_PLAN.md](ADVANCED_QUESTION_COVERAGE_PLAN.md): the first 68 additions improve variety without adding complexity 4–7 material. The 50 deferred Torah drafts contain six advanced items, not a complete master-level pool. Recommended advanced-bank floors are 20/20/15/15 at complexities 4/5/6/7 for an initial advanced-content release and 100 at each complexity for the eventual Level 700 campaign; these are planning recommendations, not publication decisions or guarantees against repetition.

The knowledge suite tests all 75-level boundaries, monotonic targets through 10,000 levels and safe-integer extremes, mixed difficulty, category variety, delayed reinforcement, retry freshness, old saves, immutable restored queues, Gatekeeper traps, draft exclusion, publication gating and malformed/duplicate/leaking/framework cases. A synthetic 1,000-record bank verifies capacity; these fixtures are not educational content and cannot enter the live bank. Timing is measured locally and is not a physical-phone benchmark.

To reach **500 live questions** from the current 160, add **340** separately approved records. Review batches of 25–50. A useful eventual allocation is 70 people, 80 Torah, 60 Yeshua, 80 connections, 70 context, 70 Kingdom and 70 discernment questions, counting existing records toward those totals. Cover the traditional Apocrypha deliberately alongside OT/NT passages, and maintain enough genuinely relevant focus-tagged items for the 7:3 rotation. Track coverage and source diversity rather than filling quotas with near duplicates.

Prioritize complexity 4–7, distinct passage comparisons and careful leadership scenarios: this is the current capacity gap. Pilot distractors and difficulty with readers, review miss rates, and adjust unpublished candidates before approval. Expand unique concepts and several variants at different complexities before claiming low repetition across hundreds of levels. Review live content changes explicitly; never invalidate saved queues by silently removing published IDs.
