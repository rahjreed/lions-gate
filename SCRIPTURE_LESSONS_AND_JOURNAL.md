# Lion's Gate — Scripture lessons and future journal

Implemented locally October 28, 2026. The owner explicitly authorized AI-assisted editorial review and local publication of the 50 course questions. This authorization is not independent human Scripture certification. No remote publication, commit, push or deployment is part of this update.

## Published bank and evidence

The live bank contains **160 unique questions**: the original 42, the previous authorized 68 additions, and the newly authorized 50 course additions. All original 110 records are unchanged, including answers, references, explanations, difficulty and review attribution. Candidate files remain unchanged working copies. Of 200 candidate source records, 118 now correspond to published IDs; **82 candidates remain unpublished**. No held or unrelated draft was approved.

`scripts/review-course-publication.mjs` performs source-bound preflight. It checks the frozen candidate/evidence hashes, every candidate digest, all 90 distinct course citation ranges against the previously downloaded pinned KJV source, answer mapping, difficulty mapping, context text and quality report. The default operation is read-only. The explicit `--record-authorized-ai-review` operation records only these 50 decisions through `createStore.save`, with all seven attestations, actual four-option rationales, warning resolutions and AI attribution. It does not publish. The review dashboard is not a prerequisite for this authorized terminal workflow.

The existing commands were then used separately:

```powershell
node scripts/editorial.mjs export content/reviewed/course-50-approved.json
node scripts/question-batch.mjs publish content/reviewed/course-50-approved.json
```

These operations are already complete; do not rerun them to duplicate publication. The CLI rejects duplicate publication. Approval receipts bind the current ledger and unchanged candidate source. `content/course-publication/baseline.json` preserves the original bank digests, original 68 ledger decisions/events and all 200 candidate digests. Historical launch manifests, evidence and unchecked candidate templates remain intact.

The course question retains two acknowledged disclosure warnings with `sabbath-day` and `creation-rest`. Useful reinforcement remains in the bank. Existing hard exclusions protect the initial queue; the narrowly scoped extension fix now applies the same rule against the whole encounter when later questions are needed. A saved queue is restored unchanged. Existing short/paraphrased disclosure limitations remain; this is not a promise of perfect semantic separation.

## Player experience

The existing retro answer overlay now presents:

- Correct/incorrect result, points or protected/lost life feedback, and the correct answer.
- A Scripture lesson title, with a historical course unit when explicitly mapped.
- The original reviewed explanation plus concise passage-grounded context.
- Primary Scripture and existing evidenced supporting references under Related Study.
- A specific learning objective and expandable KJV evidence already attached to the question.
- The existing prominent Continue action, fixed outside the internal scrolling lesson area.

All **160 questions have complete presentation profiles**: 50 course profiles and 110 original-bank profiles. **Zero live questions use the missing-profile fallback.** All 160 reuse the original reviewed explanation as their first teaching paragraph; this reuse is not counted as a missing-metadata fallback. Explanations plus context are typically about 40–100 words; the tested upper allowance is 110 words for foundational profiles. Advanced material can take more reading. **39 questions have existing supporting citations**; other questions do not acquire speculative cross-references merely to fill a field.

Profiles are in `dist/course-lessons.js`, compiled explicitly from the two curated JSON authoring files under `content/course-publication/`. `lesson-review.json` pins their hashes and all 160 source fingerprints. `legacy-lesson-evidence.json` retains exact KJV source ranges and adjacent context for the added original-bank teaching. All attribution remains AI-assisted. The lesson-context review does not rewrite or replace an original question's review.

The lesson resolver checks each question fingerprint. A changed or unknown question safely uses its current explanation, topic/title and generated or supplied objective; it never reuses stale expanded context. No lesson rendering writes progress, answers or rewards. The fallback is tested for absent optional metadata and long explanations.

Combat still finishes before the modal opens. Correct/incorrect effects, 10-hit victory, five lives, shields, scores, streaks, ranks, armor and retries retain their rules. There is no reading deadline or automatic Continue. Pause closes the native answer dialog and Resume restores it. The question timer remains stopped in feedback. Keyboard focus includes Scripture links, the expandable passage summary, the scroll region and Continue. The internal scroll region holds long content without moving the footer off-screen.

## Curriculum and educational depth

The ten-unit syllabus and 18-subject curriculum remain complementary. Only the 50 questions carrying explicit historical-unit metadata display a unit label; other lessons have descriptive titles and objectives without a guessed unit assignment. Related passages remain the question's existing primary/supporting evidence.

The live complexity distribution is **31/62/42/10/8/5/2** across complexities **1–7**. Thus the published course adds 25 genuinely intended advanced comparison/application items without relabeling an existing easy question. Existing continuous stage targets, focus quotas and Gatekeeper rules are unchanged. Difficulty is still provisional educational calibration, not a human-certified measure. A 160-question bank cannot promise a unique question at every step to Level 700. Priesthood, purity, interacting judgments, prophecy and leadership still need substantial separately reviewed expansion.

## Future Scripture Journal — proposal only

Do not implement this as a database or new cloud dependency now. A future local-first journal could derive a first view from existing answered-question history and the public lesson metadata. Its design should distinguish:

1. **Encountered**: a question was shown or answered; not proof that the lesson was read.
2. **Reviewed**: the player deliberately revisited a lesson or completed an explicit reading action.
3. **Reinforcement needed**: a concept was missed or remains weak across spaced attempts.
4. **Demonstrated understanding**: repeated appropriate applications after a delay; never infer mastery merely from opening a panel.

Use stable question/lesson IDs, the source content fingerprint, a lesson-content revision hash, optional course-unit ID, curriculum topic/concept and citations. Proposed compact local events could record outcome, encounter time and voluntary review time. Keep legacy saves valid by making any future journal section optional, bounded and independently versioned. Do not award gameplay rewards for reading records without a separately reviewed design.

The interface could offer completed/encountered lessons, Scriptures, mapped units, incorrect answers, topics needing study and a progress overview. Clearly label partial coverage: a single question does not complete a unit, and indexed Torah references do not certify comprehensive commandment learning. The original 110 need a separately reviewed historical-unit mapping before reporting ten-unit completion for them.

No journal UI, journal events, database, cloud-save integration or new save schema is implemented here. Existing lesson identifiers and metadata provide a foundation for that later task.

## Verification commands

```powershell
node scripts/build-site.mjs
node scripts/test-local-publication.mjs
node scripts/test-biblical-course.mjs
node scripts/test-torah-everyday-life.mjs
node scripts/test-kr-101-150.mjs
node scripts/test-curriculum-coverage.mjs
node scripts/test-campaign-boundaries.mjs
```

The production build now includes the new `test-scripture-lessons` suite, in addition to all 26 earlier suites. Tests verify all 160 lessons, correct/incorrect teaching identity, evidence/source hashes, draft exclusion, current approvals, unchanged original content, saved queues, extended encounters and runtime reachability of all 50 additions. UI checks and their limits are documented in `content/course-publication/REPORT.md`.
