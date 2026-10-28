# Lion's Gate — Local course publication and Scripture lessons

Completed October 28, 2026. **Local only: no commit, push or deployment.**

## Outcome

- **50/50 course questions published locally; 0 excluded. Final live count: 160.**
- The original **110** records are preserved exactly, including answers, citations, explanations, difficulty, stable IDs and previous AI attribution.
- **160 complete lesson profiles; 0 live missing-metadata fallbacks.** All 160 reuse their original explanation paragraph and add reviewed, source-bound title/context/objective metadata. The fallback remains tested for absent/stale metadata.
- Teaching explanation plus context ranges from **46 to 102 words**. **39** have existing evidenced related Scriptures. No unsupported cross-reference was added to fill a field.
- **82 held/Torah candidates remain unpublished.** All 200 candidate source copies are unchanged. The 50 published copies have current ledger approvals, receipts and preserved provisional mappings.

## Review and publication integrity

The owner explicitly authorized AI-assisted editorial review and local publication. The attribution is **Codex — AI-assisted Scripture review; not independent human certification**. Notes explicitly state this is neither owner-performed passage verification nor independent human certification. All seven confirmations and real four-option rationales were recorded through the existing store; no dashboard prerequisite or fabricated human reviewer was introduced.

The source-bound preflight checked all 50 question digests, candidate/evidence SHA-256, 90 distinct exact course ranges against the pinned KJV text, surrounding context, answers, distractors, explanations, scope and difficulty mapping. Default preflight is read-only. The explicit review operation recorded 50 approvals, the existing export CLI produced the exact 50-record export, and the existing publication CLI appended it. The ledger now has **118** decisions/events; the original 68 remain unchanged. A backup of the previous additions module was created by the established publisher.

The two Sabbath disclosure warnings remain recorded and explicitly resolved as intentional reinforcement. Initial queues already had literal disclosure protection. Inspection found that an extended battle's later questions lacked the same whole-encounter check; extension selection now receives the current encounter IDs and excludes conflicting other questions. Existing saved queues are not rewritten, and repetition of the same question remains a last-resort option for a constrained bank. No scoring, damage, victory, lives, timing, rank, armor or power-up rule changed. Paraphrased leakage still requires editorial judgment.

## Lesson interface

The existing retro modal now provides result/reward feedback, correct answer, lesson title, explicit unit label where available, primary reference, teaching explanation, context, learning objective, related-study links and expandable KJV text. The same teaching content appears for correct and incorrect answers. Continue is manual and remains outside the internally scrolling content. Native focus containment includes the study summary and links. No reading deadline or automatic advancement was added.

Combat finishes before the existing modal opens; animation hooks and impact timing are unchanged. Reading does not consume question time. Browser testing observed the timer remain at 26 while reading, then verified pause/resume restored the modal and Continue advanced once. An incorrect answer reduced lives from five to four with enemy health still at 90%; restoring saved feedback did not apply another hit. The final full-profile module was checked on a fresh local origin to avoid the intermediate development service-worker cache.

The 110 legacy lesson contexts are separately backed by exact KJV ranges and adjacent context in legacy-lesson-evidence.json. They do not replace the original question's evidence or review. Profiles bind the unchanged question fingerprint; stale or absent metadata uses the current explanation safely. The lesson module and authoring/evidence hashes are pinned in lesson-review.json.

## Verification

- Full production build: **27/27 configured suites passed**, including the new Scripture-lesson/publication regression suite. **113** production files and **102** local references validated. Version **1.3**; final offline shell revision **4722ae7f1644595ce7d9**.
- Additional historical publication, course-batch, Torah-batch, KR-batch, coverage and Level 700 campaign-boundary checks passed. Historical snapshots use exact documented revisions, not broad hash exemptions.
- Complete 160-question schema, current approval receipts/source integrity, unchanged original 110 digests, untouched candidate files, duplicate-publication rejection and draft-publication rejection passed.
- Zero schema errors, exact duplicate IDs or duplicate stems in the 160 live records. Two course warnings are acknowledged with corresponding tested exclusions. The prior KR batch's 15 warnings are retained; that unrelated batch was not published wholesale.
- Runtime selection reached all 50 new additions through the Level 1–1000 selection regression. Direct tests cover both disclosure directions, extended regular/Gatekeeper encounters, 14-answer battles and frozen saved queues.
- Every lesson tested for correct/incorrect content identity, valid title/context/objective, original explanation reuse, reference preservation, source binding and escaping. Optional metadata and stale-profile fallbacks passed.
- Browser checks: **320×568, 390×844, 1280×800**, normal/advanced lessons, 7543-character fallback lesson, related links, expanded passage scrolling, focus wrapping and Continue. Dialogs/buttons stayed inside the viewport with no horizontal overflow. Final fresh preview console: no captured errors or warnings.
- Actual game: correct and incorrect combat/reveal paths, manual next question, pause/resume and restored saved feedback inspected locally. Physical-device gestures, real audio hardware and the public deployment were not tested by these checks.

## Remaining attention

No confirmed local technical launch blocker remains from this task. AI-assisted review is not independent human certification. Reader calibration and physical Android/iPhone testing are still advisable before release. The existing PWA update workflow may require closing/reopening game windows; it was preserved. Advanced content remains thin (complexity counts **31/62/42/10/8/5/2**), so this does not supply unique lessons for every battle through Level 700. Only 50 questions have explicit historical-unit mapping; the other 110 are not assigned guessed unit completion credit.

The future Scripture Journal is documented in [SCRIPTURE_LESSONS_AND_JOURNAL.md](../../SCRIPTURE_LESSONS_AND_JOURNAL.md). No journal, database, new progress events or save-schema migration was implemented.

## Files modified

- `BIBLICAL_COURSE_SYLLABUS.md`
- `BIBLICAL_KNOWLEDGE_ENGINE.md`
- `QUESTION_PUBLISHING_AUDIT.md`
- `content/BIBLICAL_COURSE_50_REVIEW.md`
- `content/CURRICULUM_COVERAGE.md`
- `content/curriculum-coverage.json`
- `content/editorial/decisions.json`
- `dist/answer-reveal.css`
- `dist/answer-reveal.js`
- `dist/engine.js`
- `dist/published-questions.js`
- `dist/question-selection.js`
- `dist/release.js`
- `dist/sw.js`
- `game-release.json`
- `scripts/build-site.mjs`
- `scripts/test-biblical-course.mjs`
- `scripts/test-kr-101-150.mjs`
- `scripts/test-local-publication.mjs`
- `scripts/test-torah-everyday-life.mjs`

## Files created

- `SCRIPTURE_LESSONS_AND_JOURNAL.md`
- `dist/course-lessons.js`
- `dist/lessons.js`
- `scripts/build-course-lessons.mjs`
- `scripts/course-revision.mjs`
- `scripts/review-course-publication.mjs`
- `scripts/test-scripture-lessons.mjs`
- `content/reviewed/course-50-approved.json`
- `content/reviewed/published-f857be40-a5bc-435b-883a-ed1b383c77ce.js.backup`
- `content/course-publication/baseline.json`
- `content/course-publication/legacy-lesson-drafts.json`
- `content/course-publication/legacy-lesson-evidence.json`
- `content/course-publication/lesson-drafts.json`
- `content/course-publication/lesson-review.json`
- `content/course-publication/runtime-changes.json`
- `content/course-publication/verification.json`
- `content/course-publication/REPORT.md`

The temporary local preview script is verification-only and is removed during cleanup. No hosting, DNS, cloud project or remote production setting was changed.
