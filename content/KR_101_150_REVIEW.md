# KR-101–KR-150 — candidate import and review queue

**50 supplied questions imported. All remain `candidate` (draft/pending review); none approved or published.**

**Current targeted revision:** 21 incorrect choices in KR-105, KR-109, KR-115, KR-130, KR-133, KR-136 and KR-141 have been improved at the user's request. All correct choices and other record fields remain unchanged. Current validation returns **0 errors / 18 warnings**. See [exact before/after changes and selection coverage](KR_101_150_CHOICE_CHANGES.md). The original 25-warning import findings below are retained as history; six weak-distractor alerts and the KR-133 length alert no longer occur.

## Preservation and counts

The repository contained **42 live reviewed questions and 50 earlier candidates**, rather than a numbered first-100 collection. No KR-001–KR-100 collection was found. All existing records were preserved; no missing records were invented or renumbered. There are now 42 live questions and 100 unpublished candidates, or 142 stored question records in total. The editorial numbering of this batch remains KR-101 through KR-150.

The supplied Markdown is preserved byte-for-byte at [sources/kr-101-150.md](sources/kr-101-150.md). Its SHA-256 matches the attached file: `515bf964b78322ce16477fee304efe05405ba300f20456a3c82966dbca9b5ca2`.

At original import, questions, all four choices, answer letters/correct-answer strings, Scripture reference text and explanations were retained verbatim, apart from removing Markdown whitespace. The subsequent authorized distractor edits are explicitly recorded separately; the original source is unchanged. No intended doctrinal content was rewritten or replaced. No existing production file or earlier candidate file changed: all **96 pre-existing files** were checked against SHA-256 snapshots before and after the import/build.

## Schema adaptation

- Engine IDs are `kr-101` through `kr-150` because the existing validator requires lowercase safe IDs. `editorial.sourceId` retains the exact uppercase IDs `KR-101` through `KR-150`.
- `editorial.sourceDifficulty` retains the supplied rating on its original 1–10 scale. This particular batch uses 2–7, which fits `knowledge.complexity` 1–7 **without compression**. The legacy display tier `difficulty` is 1 for source 1–3, 2 for 4–5, and 3 for 6–7. No gameplay difficulty rules changed.
- The supplied section title remains in `topic` and `editorial.sourceSection`; `category`, recognized topic tags and `knowledge.category` map to the existing curriculum. All multi-reference records retain every reference in `scripture` / `supportingScriptures`.
- `Psalm` is normalized to the canon's `Psalms` spelling in the structured citation for KR-106; the original `Psalm 119:160` text is preserved in `editorial.sourceScripture` and the Markdown source. Verse ranges retain their exact endpoints.
- `review.status` is `candidate`; `editorial.manualReviewRequired` is true; no reviewer, approval date, rationale or approval fingerprint was fabricated.

## Evidence and concerns requiring review

**All 50 require independent passage/context review.** The source supplied citations and explanations, not KJV quotations. The schema requires a nonempty `excerpt`, so each citation explicitly says its passage excerpt is **PENDING**, rather than inventing Scripture wording or claiming a completed source check. Replace these pending markers with checked KJV evidence before any later approval. URLs match the engine's citation format; their remote availability and passage accuracy were not independently checked during this import.

The [validation report](kr-101-150-validation.json) now records **0 structural errors, 18 current warnings**, retains the original 25 warnings separately, and includes **37 directed citation-overlap entries representing 29 distinct pairs**. Citation overlap is a review signal, not a finding that two questions are identical. The following warning breakdown describes the original import, before the targeted choice revisions.

- No duplicate internal/editorial IDs or exact duplicate question wording were found across the live bank, earlier candidates and new batch.
- Six warnings concern possible answer disclosure, eleven concern shared concepts/repetition, seven concern absolute/shortcut distractors, and one concerns answer-length clues (KR-133). Some are reciprocal warnings for the same pair. The existing wording was retained.
- Close subject overlap includes KR-102 / `teach-children`, KR-108 / `bke-law-hearts`, KR-109 / `establish-law`, KR-111 / `creation-rest`, KR-138 / `land-animals`, KR-140 / `water-creatures`, KR-144 / the existing handwashing questions, KR-147 / `bke-mercy-hosea`, and KR-148 / `law-prophets-psalms`. KR-101/107/110, KR-103/119/126 and KR-148/149/150 also revisit material within the supplied batch. Decide editorially whether these are useful progression variants or excessive repetition; none was deleted.
- Check every distractor for plausibility and answer uniqueness, especially the passage-pair questions KR-110, KR-137 and KR-150. Structurally each has one designated correct answer; ambiguity is not established by schema validation.
- Review the audience/scope of the supplied wording in KR-123–124, the work terminology in KR-114, and KJV wording versus paraphrase in KR-119–120 and KR-125. No replacement wording has been imposed.
- Review the extent of the explanatory conclusions in KR-105, KR-108–110, KR-117, KR-130, KR-133, KR-136, KR-142–144 and KR-150 in the cited contexts. Preserve the source's explicit distinctions between text, interpretation and historical setting. These are review prompts, not doctrinal verdicts or approval.

The [review template](kr-101-150-review-template.json) has blank reviewer/date/rationale fields, seven unchecked checks and four blank option rationales for each item. It provides **no approval evidence**. The existing review/publish workflow rejects it as incomplete. No publication command was invoked.

## Files and verification

- [Candidate records](candidates/kr-101-150.json)
- [Original editorial source](sources/kr-101-150.md)
- [Validation and preservation hashes](kr-101-150-validation.json)
- [Unchecked review template](kr-101-150-review-template.json)
- `scripts/import-kr-101-150.mjs`: explicit source adapter that uses the existing candidate-only import CLI and refuses to overwrite the batch.
- `scripts/test-kr-101-150.mjs`: preservation, IDs, choices/answers, references, difficulty, schema, draft/publication exclusion and baseline checks.

Passed:

1. `node scripts/test-kr-101-150.mjs` — exactly 50 candidates, source fidelity except the 21 explicitly documented incorrect-choice revisions, protected correct answers/references/explanations/difficulty, candidate-only status, unchecked template, rejection of publication, exclusion from selections through Level 10000, all prior files unchanged.
2. `node --check scripts/import-kr-101-150.mjs` and `node --check scripts/test-kr-101-150.mjs` — syntax valid. No separate lint command is configured in this project.
3. `node scripts/build-site.mjs` — all 17 configured validation/test scripts and production build pass; 95 production files and 90 local references checked. The offline revision remains `a6bb600f4173e3f5f7e5`.

Re-run the dedicated batch check explicitly alongside the existing build; the build script was intentionally left unchanged. No gameplay, combat, UI, routing, progression, live question bank, save or deployment files were edited. No commit, push or deployment was performed.
