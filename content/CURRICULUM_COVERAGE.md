# Coverage tracker guide

Policy: [Biblical curriculum and doctrine](../BIBLICAL_CURRICULUM_AND_DOCTRINE.md). Publication behavior: [audit](../QUESTION_PUBLISHING_AUDIT.md).

`curriculum-coverage.json` is a generated documentation index, outside the game's imports and PWA shell. It currently inventories 42 live reviewed records plus 100 candidates, with zero published additions. It does not create educational questions or perform Scripture verification.

The framework contains:

- All 18 required curriculum topics, plus a general-foundations index for historical/wisdom material that does not fit a law topic.
- Ten appointed-time plans, each with six study dimensions: timing, duration, observances/participants, stated purpose, historical context and supported cross-references. Keyword hints are not certified coverage.
- 187 chapter slots: Genesis 50, Exodus 40, Leviticus 27, Numbers 36, Deuteronomy 34. Each lists related live and candidate IDs, planned/unassessed objectives, manual-entry links and chapter-review state. A null verse range means no exact catalog range has been entered; it does not mean the chapter lacks commandments.
- Every existing question's book/chapter/verse ranges, original topic, explanation as a provisional learning-objective summary, curriculum-category hints, runtime difficulty, supplied editorial rating when present, related passage IDs, gaps/unassessed objectives and review/publication state.
- Input hashes so the inventory can be checked against the actual bank. Copied explanations and existing wording are source material, not newly authored questions or fresh approval evidence.

Category assignment is a provisional keyword index. Related IDs reflect intersecting citation ranges, not guaranteed semantic duplication or complete commandment coverage. Existing reviewed items indicate partial learning coverage only. No chapter or complete commandment catalog has been certified. Uncovered-objective fields initially identify work still to assess, rather than claiming that every listed gap is absent everywhere in the bank.

## Maintenance

Run from the repository root:

```powershell
node scripts/build-curriculum-coverage.mjs
node scripts/test-curriculum-coverage.mjs
```

The builder reads existing questions and overwrites **only** `content/curriculum-coverage.json`. Do not manually edit that generated file. Keep manual research in **`content/curriculum-catalog.json`**, which the builder reads but never overwrites. It currently has no entries or completed chapter reviews.

For each future manual `entries` record, use these fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable catalog-objective identifier, distinct from a question ID. |
| `book`, `chapter`, `verse`, optional `endVerse` | Exact source range, checked against Scripture in context. Split ranges/entries when necessary; do not invent a cross-chapter range in a single verse field. |
| `teaching` | Identifiable commandment, ordinance, judgment or teaching; record actor, recipients and conditions in its scope description. |
| `curriculumCategories` | One or more of `01`–`18` or `general`; correct provisional labels manually here. |
| `learningObjective` | What understanding is to be assessed, not a new multiple-choice question. |
| `difficultyProgression` | Planned editorial ratings, integers 1–10, calibrated by reasoning. |
| `relatedQuestionIds` | Existing relevant question IDs; distinguish live from draft in the derived index. |
| `uncoveredLearningObjectives` | Specific missing/unassessed conditions, exceptions, purposes or connections. |
| `reviewStatus` | `planned`, `in-review` or `reviewed`; a catalog review does not approve linked candidate questions. |
| `reviewedBy`, `reviewedOn` | Required provenance when marking the catalog entry reviewed. |

`chapterReviews` can later record `book`, `chapter`, `status`, `reviewedBy`, `reviewedOn` and a scope/rationale. A chapter-complete assertion needs an actual comprehensive chapter audit; individual related questions cannot certify it. These fields do not authorize publication or establish an exhaustive global law count.

For each chapter, read the entire text, enumerate identifiable teaching units and their exact ranges, record stated reasons and conditions, then add relevant Prophets/Gospel/apostolic connections. Record uncertainty explicitly. Preserve purposeful reinforcement while assessing distinct learning objectives and answer-disclosure risks. Keep modern racial identifications and speculative calendar claims out of the catalog.

The editorial rubric is 1–10. Unknown ratings remain null; the current runtime is still 1–3 / 1–7. A tested opt-in adapter now maps explicitly calibrated 1–10 ratings for future reviewed exports; see ../LOCAL_QUESTION_REVIEW.md. Existing source ratings and gameplay remain unchanged. Human calibration is still required.

After later publication, the original candidate JSON may still exist. The builder distinguishes a retained working copy sharing a live ID from the authoritative live record using `publicationState` and a source-qualified `recordKey`. The inventory counts records/copies, not an invented renumbered first-150 bank.
