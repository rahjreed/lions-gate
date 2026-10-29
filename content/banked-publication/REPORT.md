# Lion’s Gate — Authorized banked question publication

## Result

**100 eligible questions published locally; 260 live questions total. Version 1.11. No commit, push or deployment.**

The owner’s exact authorization was “i authorize all banked questions”. The 132 unpublished records were reconciled as 50 source-checked everyday-Torah records, 50 source-checked deep-Torah records and 32 previously held records. Authorization allowed recording AI-assisted reviews and local publication of the eligible 100; it did not repair unresolved content issues or justify fabricating successful checks for the 32 holds.

- 50/50 everyday-Torah and 50/50 deep-Torah records published without changing their stems, choices, intended answers, explanations, references or ratings.
- 260 unique live = original 42 + earlier 68 + course 50 + newly published 100.
- 218 explicit decisions and audit events. All original 118 decisions/events remain intact, including timestamps, reviewer attribution and rationales.
- 250 unchanged candidate-source copies: 218 correspond to live records; 32 remain held. The generated coverage inventory has 510 source-qualified records, 292 unique IDs and references in 106/187 Torah chapters. No complete chapter audit is claimed.
- The original 160 live records, educational metadata, app/engine/save/combat code, compact answer UI, source evidence and hashes remain unchanged. The new 100 use the existing compact metadata fallback; no lengthy lesson panels or new mode were added.

## Review and publication

The source-bound preflight checked all 100 candidate digests and **196 citation occurrences** against the existing pinned KJV text (SHA-256 `fb7b8c10feb607c22b3461e837bfd267c09814f39ce23756a1928f7739a52b3c`), including recorded adjacent/chapter context, correct-option mapping, four option rationales and the existing difficulty adapter. Quality/schema checks produced zero errors/warnings for the eligible set. Prior source-audit dates and attribution remain in the unchanged evidence and new decision notes.

Reviewer attribution is **Codex — AI-assisted Scripture review; not independent human certification**. Notes explicitly state this is not owner-performed passage verification. The existing `createStore.save` recorded the 100 decisions with source digests, revision checks, seven AI-performed confirmations and the retained option rationales. No human verification was fabricated.

The existing export CLI produced `content/reviewed/banked-100-approved.json`; its exact 100 IDs were compared with the captured baseline before the existing publishing CLI appended them. Publication rechecked current approvals, evidence, source receipts, duplicates and review integrity. Its normal backup of the previous additions module is retained under `content/reviewed/`. The earlier manifests remain immutable historical preparation records rather than being silently expanded to cover this release.

## Verification

- **PASS** `node scripts/build-site.mjs`: all **29 configured suites**, 117 production files and 105 local asset/module references; full offline shell regenerated. This includes combat, timing/health/finishes, pause/dialogue/settings, PWA, retries, save migration, armor, mastery, selection and compact reveals.
- **PASS** `node scripts/test-banked-publication.mjs`: exact 100-record release, unchanged original 160 and 118 prior decisions, 218 current receipts/events, all 250 source hashes, 32 exclusions, duplicate-release rejection, old in-progress save restoration, normal/Gatekeeper/Level 700/high-level victories and five-life retries.
- **PASS** `node scripts/test-local-publication.mjs`: all 260 available across the 1,000-level selection simulation; prior authorized exports and provenance preserved.
- **PASS** `node scripts/test-deep-torah.mjs`, source-bound banked preflight, curriculum generation/check and content/schema/disclosure guards.
- **PASS** compact-reveal/educational-metadata suite: 160 existing expanded profiles retained and 100 compact fallbacks; 101 questions with evidenced supporting citations.
- **Local browser**: actual production title displays version 1.11; How to Play shows **260 passage-reviewed questions**, with 105 Foundation / 91 Challenger / 64 Context display tiers. No physical Android/iPhone or public-deployment testing is claimed.
- **Three older standalone suites still fail**: `test-biblical-course.mjs`, `test-torah-everyday-life.mjs`, `test-kr-101-150.mjs` stop at the pre-existing `dist/answer-reveal.css` snapshot mismatch. Expected historical hash: `01d8ac46311395d69763309b08fd3a167e25312abd41f6790b0d59578e223b49`; unchanged current/HEAD hash: `a627df280f20630dbff4deb1f63e030b3b7dacf759dc82f8abbf29c6ffd44f93`, from the earlier committed Scripture Lesson reversal. No assertion was weakened to pass that mismatch, and no CSS/gameplay change was made here. A separate audit-baseline reconciliation remains necessary before claiming every standalone suite is green.

## Difficulty coverage

| Runtime complexity | Live questions |
|---|---:|
| 1 | 41 |
| 2 | 78 |
| 3 | 65 |
| 4 | 26 |
| 5 | 24 |
| 6 | 17 |
| 7 | 9 |

Difficulty remains provisionally calibrated. Complexity 7 has nine questions, so the bank still cannot promise low repetition through Level 700; do not inflate ratings or treat quantity as mastery calibration. No selector, progression or difficulty rules changed.

## Held records

All 32 retain their original IDs, content and reasons. They have no approval decisions or live copies. Their remaining issues require targeted editing/source review before any future release.

| ID | Existing unresolved reason |
|---|---|
| bke-impartial-leaders | Narrow wording to impartial treatment before approving; preserve both office contexts. |
| kr-101 | Overlap with the no-addition objective in KR-107/110; improve restrictive/extreme distractors before adding more recall. |
| kr-102 | Daily instruction is supported; strengthen priest-only/feast-only alternatives and distinguish the existing children-teaching objective. |
| kr-106 | Judgments enduring forever is supported; opposing options are shortcut extremes rather than nuanced readings. |
| kr-107 | Supported prohibition; refine speculative ruler/nation distractors and distinguish KR-101 reinforcement. |
| kr-108 | Law-in-heart promise is supported in Israel/Judah context; same objective already supplied by bke-law-hearts, with weak opposing choices. |
| kr-109 | Shares Romans 3:31 with the live establish-law item; mixed justification distractors need contextual editorial refinement. |
| kr-110 | Correct citations supported, but unrelated verse pairs make the purported advanced scenario a recognition shortcut. |
| kr-111 | Same creation-day objective as live creation-rest; retain draft for later distinct blessed/sanctified objective. |
| kr-112 | Creation rationale supported; Roman-empire/festival distractors are too obviously unrelated for its supplied difficulty. |
| kr-113 | Household/stranger scope supported; priest-only/adults-only choices need stronger plausible scope distinctions. |
| kr-114 | KJV says no work; ordinary-work qualifier needs explicit scope review rather than a silent doctrinal rewrite. |
| kr-116 | Holy-day wording is supported, but personal-pursuits paraphrase needs scope review against pleasure/ways/words in context. |
| kr-118 | Gates/commerce narrative supported; abolishing Sabbath and temple-market alternatives need strengthening. |
| kr-123 | Review the comparative more-important formulation against the stated not/with wording; do not silently resolve adornment applications. |
| kr-124 | The meek/quiet-spirit focus is supported, but retain wives/holy-women context and improve highly implausible wrong options. |
| kr-125 | Print any marks is the KJV wording; modern tattoo terminology/scope requires deliberate editorial review. |
| kr-126 | Same stated purpose as KR-103; unrelated reference distractors and disclosure/repetition need refinement. |
| kr-128 | Direction of prayer supported; balance the conspicuously detailed correct choice against the alternatives. |
| kr-131 | Temple/heaven distinction supported; correct-option length and extreme competing claims provide shortcuts. |
| kr-134 | Near-kin restriction supported; adulthood/harvest/rulers-only alternatives are implausible. |
| kr-137 | Parent/Corban connection supported; replace unrelated verse pairs before treating it as advanced reasoning. |
| kr-138 | Same verse and animal-criteria objective as the live land-animals question; preserve draft without adding duplicate recall. |
| kr-140 | Same verse and fins/scales objective as live water-creatures; preserve draft without adding duplicate recall. |
| kr-142 | Acts 10:28 answer is explicit; unrelated Sabbath/inheritance/prayer alternatives need contextual replacement. Do not settle dietary debates. |
| kr-144 | Immediate handwashing dispute supported; supplied difficulty overstates recall and Mark 7 commentary warrants focused scope review. |
| kr-145 | Torah quotation supported; unrelated verse-number options test recognition and need plausible context alternatives. |
| kr-146 | Leviticus quotation supported; near-neighbour answer disclosure with bke-neighbor-love and weak reference alternatives. |
| kr-147 | Hosea is supported, but bke-mercy-hosea names Hosea in its stem and would disclose this short answer; current hard filter misses short names. |
| kr-148 | Same Luke 24:44 divisions objective as live law-prophets-psalms; implausible nonbiblical divisions. |
| kr-149 | Berean examination supported; extreme distractors and difficulty 6 overstate straightforward recall. |
| kr-150 | Broad strongest-combination wording plus unrelated triple citations permits shortcut reasoning; needs a bounded comparison objective. |

## Artifacts and code scope

- Live additions: `dist/published-questions.js`; normal generated release/offline files: `dist/release.js`, `dist/sw.js`, `game-release.json`.
- Decisions: `content/editorial/decisions.json`; exact export: `content/reviewed/banked-100-approved.json`; original ledger/live/inventory snapshot and held list: `content/banked-publication/baseline.json`.
- New explicit review/preflight script: `scripts/review-banked-publication.mjs` (read-only by default; record flag was used only after this owner authorization). New exact-publication regression/helper: `scripts/test-banked-publication.mjs`, `scripts/banked-release-state.mjs`.
- Existing content/publication regression tests now recognize the third exact owner-authorized export while preserving the old inventories, ledger history and unchanged hashes. The build includes the new publication regression. No approval/publication is invoked by building.
- Current inventory documentation and generated coverage updated; earlier evidence, candidate batches and preparation manifests preserved.

Local work is complete. Nothing was committed, pushed, deployed or changed in cloud infrastructure.
