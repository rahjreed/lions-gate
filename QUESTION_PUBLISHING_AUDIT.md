# Question publishing audit

**Current local status — October 26, 2026:** the owner authorized recording the 68 prepared AI-assisted review decisions and publishing those exact 68 additions locally. The real ledger now contains 68 original-attribution decisions and 68 staging events. There are **110 live questions and 82 unpublished candidates**; all 150 candidate source files/records are retained. No claim of independent human Scripture verification, commit, push or deployment is made. See [verification report](LOCAL_PUBLICATION_REPORT.md). The preparation account below is historical; the manifest and evidence remain preserved as the pre-publication baseline.

Updated for the local-first review system. **42 original live reviewed questions, 150 unpublished candidates, zero published additions.** The latest [50 Torah everyday-life candidates](content/TORAH_EVERYDAY_LIFE_50_REVIEW.md) carry AI-assisted Scripture-source evidence but no approval decisions. Their generation/import did not modify the editorial ledger or publish questions. Pushing candidate JSON does not import it into gameplay. The refreshed launch manifest now binds all 150 records as 68 selected, 32 held and 50 deferred. It preserves the original 68 review exports and evidence dates; only explicit owner-authorized staging can record those prepared AI-assisted reviews in the real ledger, followed by a separate publication command. See [release handoff](LAUNCH_READINESS.md). The real ledger remains empty during preparation.

## Architecture

| Component | Behavior |
| --- | --- |
| `dist/questions.js` | Validated aggregate of original, extra, focus and published modules. Original 42 preserved. |
| `dist/published-questions.js` | Empty additions array; explicit publication appends here. |
| `content/candidates/initial-50.json` | 50 unpublished candidates, preserved. |
| `content/candidates/kr-101-150.json` | 50 unpublished candidates, preserved with pending evidence markers. |
| `content/candidates/torah-everyday-life-50.json` | 50 new unpublished candidates, exact checked excerpts and provisional 1–10 difficulty calibration; source audit is not approval. |
| `scripts/review-server.mjs`, `tools/question-review/` | Separate loopback-only review app, outside production output. |
| `content/editorial/decisions.json` | Created on the first explicit decision; latest decisions and event history. |
| `scripts/editorial.mjs` | Exports current ledger-approved questions to a new reviewed JSON file. |
| `scripts/editorial-core.mjs`, `scripts/editorial-store.mjs` | Evidence, source hashes, approval receipts, revisions, process lock, atomic writes. |
| `scripts/question-batch.mjs` | Import, validate, unchecked template and explicit publication. Raw checklist review is retired. |
| `scripts/difficulty-map.mjs` | Tested opt-in editorial 1–10 to runtime 1–7 / display 1–3 adapter. No automatic legacy remapping. |
| `dist/question-rules.js`, `scripts/question-quality.mjs` | Existing schema, canon/reference, answer and duplicate/quality checks retained. |
| `dist/question-selection.js` | Unchanged verified/fingerprint-only runtime selection. |
| `scripts/build-site.mjs`, `vercel.json` | Static dist build/hosting; no editorial UI/server/ledger in production. |

## Owner workflow

From `sites/lions-gate-sword-sharpener` using Node 24:

1. Run `node scripts/review-server.mjs`, then open `http://127.0.0.1:4310/` on the same computer.
2. Read every passage and check exact KJV wording, answer uniqueness, distractors, explanation/context, difficulty and quality warnings. Seven confirmations, four choice rationales, reviewer and rationale are mandatory. Missing/placeholder primary or supporting evidence blocks approval/publication.
3. Save an explicit decision. Approval saves a ledger record, not a live question. Revise/Reject do not qualify. Requested content corrections must be made separately with owner authorization; source changes invalidate approval.
4. When later authorized, run `node scripts/editorial.mjs export content/reviewed/approved-batch.json` and inspect the new file/diff.
5. Only after explicit publication authorization, run `node scripts/question-batch.mjs publish content/reviewed/approved-batch.json`.
6. Run `node scripts/build-site.mjs`, inspect changes, and regenerate coverage when authorized. Git/deployment remain separate decisions.

Publication rechecks current ledger/source receipts, including current decision, hash and evidence. Later rejection/revision revokes old exports. Duplicate IDs/wording, incompatible schema, nonunique choices, answer mismatch and unresolved warnings block publication. The old published module is backed up outside public output before atomic replacement. No import/build/export/deployment automatically approves candidates.

## Remaining human responsibilities

Validation cannot prove biblical accuracy, actual human review, exact quotations or comprehensive verse existence. Independently read all cited passages in context. Intentional repetition can be accepted with recorded reasons. Local ledger files are trusted repository data, not authentication against a local file editor. Coverage associations are provisional. Difficulty mapping is implemented and tested, but pedagogical calibration needs reader evaluation and a larger reviewed bank. Existing small-pool fallback remains unchanged.

See [LOCAL_QUESTION_REVIEW.md](LOCAL_QUESTION_REVIEW.md) for launch, security, persistence, locking, mapping table, tested progression boundaries and full publication instructions. Inventory remains **42 live + 100 candidates**. None of the 100 were approved or published by this task.
