# Local Biblical Question Review

The optional hosted companion is documented in [admin-review/README.md](admin-review/README.md). The localhost interface remains available unchanged. Publication of adopted hosted approvals additionally requires online revalidation with the dedicated Supabase project; local-only approvals retain the workflow below. No hosted project or domain was deployed/configured during implementation.

From `sites/lions-gate-sword-sharpener`, using Node 24:

```powershell
node scripts/review-server.mjs
```

Open **http://127.0.0.1:4310/** on the same computer. `npm run review` also works if npm is available. Stop with Ctrl+C. Optional `REVIEW_PORT` selects a port from 1024–65535. Use the printed 127.0.0.1 address, not localhost or a LAN address. `NODE_ENV=production` refuses to start.

This repository is a dependency-free static game authored in `dist/`, not a React/Vite app. This separate Node tool needs no database, installation, game route or public administration UI. It is outside `dist/` and the PWA cache.

## Review workflow

All JSON batches in `content/candidates/` are loaded. Filter by existing curriculum topic (`topic`), runtime complexity, batch, status, or ID/text. Details include four options, proposed answer, explanation, topic/category, display tier, complexity, supplied editorial rating, all Scripture citations, and quality warnings. Coverage uses the existing provisional inventory; candidate counts do not represent approved/live coverage. Zero-live topics identify expansion priorities.

1. Read every primary and supporting passage in context using the established 80-book KJV scope and curriculum policy.
2. Supply checked KJV excerpts. Empty/short excerpts and known placeholder markers are hard errors, including supporting passages. KR placeholders remain unchanged in the source; checked excerpts are saved in the decision sidecar and applied to future exports.
3. Enter reviewer, rationale and four choice-specific rationales. Address each automated warning individually. Purposeful reinforcement may be accepted with an explanation.
4. Confirm all seven checks: passages, references, quotations, unique/accurate answer, distractors, explanation/context, cross-question review.
5. Choose **Approve**, **Needs revision**, or **Reject**. Approval asks for explicit confirmation and never publishes. Revision/rejection need a reviewer/rationale but not completed approval checks. They revoke any earlier export's publication eligibility.

Needs revision records a request, not a question rewrite. Make later owner-authorized corrections in the candidate JSON, then review again. Source changes invalidate old approvals. Refresh after external edits; concurrent tabs must reload if another tab saved a newer revision. Unsaved form input is not persisted; use Needs revision to record unfinished work.

## Persistence

The first explicit decision creates `content/editorial/decisions.json`: schema version, latest decisions and append-only event snapshots. It stores reviewer, server time, rationale, confirmations, four option rationales, accepted warning strings, checked excerpts, optional calibration, source SHA-256 and revision. Reopening the tool restores this file independently of browser storage or game saves. Candidate JSON is never rewritten by the interface.

Writes use an exclusive process lock and atomic replacement. Invalid ledgers fail closed. Back up the ledger with editorial work; it is not automatically synchronized. Receipts detect changed content/decisions, not dishonesty by a trusted operator with repository write access.

If a crash leaves `content/editorial/write.lock`, stop all editorial/export/publication processes and inspect its PID/time. Only after confirming that process is inactive, manually remove the lock. Never delete the ledger to clear a lock.

## Export and publication — later explicit authorization required

No browser publish or arbitrary file-writing endpoint exists. Export current, explicitly approved, not-already-live records to a **new** file:

```powershell
node scripts/editorial.mjs export content/reviewed/approved-batch.json
```

No approvals means an error, not publication. Stale approvals fail closed. Existing output files are never overwritten. Inspect the exported diff. For a separately authorized publication:

```powershell
node scripts/question-batch.mjs publish content/reviewed/approved-batch.json
node scripts/build-site.mjs
```

Publication rechecks current sources/ledger receipts, schema, four distinct choices, exact answer mapping, canon/reference structure, primary/supporting evidence, duplicates and accepted warnings. Old exports cannot bypass later Revise/Reject decisions. It backs up the module under `content/reviewed/`, then atomically appends to `dist/published-questions.js`; original questions remain intact. Duplicate publication is blocked. Restart the editor after publication and regenerate coverage with `node scripts/build-curriculum-coverage.mjs` when authorized.

Raw `question-batch.mjs review` is retired; old checklist files cannot bypass the ledger. Import, validate and unchecked template commands remain. Builds never approve or publish. Git and deployment are separate actions.

## Tested opt-in difficulty bridge

The blank-by-default calibration input uses `scripts/difficulty-map.mjs`, showing an export preview. Existing `editorial.sourceDifficulty` is displayed, never automatically reinterpreted. Blank calibration preserves runtime fields exactly.

| Editorial rating | Runtime complexity | Display tier |
| --- | --- | --- |
| 1–2 | 1 | 1 |
| 3 | 2 | 1 |
| 4–5 | 3 | 2 |
| 6 | 4 | 2 |
| 7 | 5 | 3 |
| 8–9 | 6 | 3 |
| 10 | 7 | 3 |

Calibration persists in the ledger. Export includes fingerprinted `knowledge.editorialDifficulty` and `knowledge.difficultyMapping = editorial-1-10-v1`, alongside mapped complexity/tier. A changed calibration needs another explicit decision and invalidates old exports.

The unchanged selector gradually targets complexity 1–7 across levels 1–525, with overlapping 75-level topic emphases. With enough eligible questions, its ceiling rule first admits complexity 6 at regular level **351**, complexity 7 at **438**; admission does not guarantee immediate selection. Gatekeepers target one point higher. Earlier subjects remain eligible. The existing fallback may admit harder approved questions earlier when fewer than ten eligible records exist. This is preserved behavior, not a strict world lock. Tests cover mapping monotonicity, boundaries, stage selection, opt-in behavior and advanced/master availability. Human pilot calibration and a larger approved pool are still needed. No real candidate was remapped/published, so existing balance and saved queues remain unchanged.

## Security and limitations

IPv4 loopback only; exact Host/Origin checks; cross-site rejection; random HttpOnly/SameSite cookie; same-origin JSON/custom-header checks on writes; body limit; restrictive CSP; three fixed static UI paths. Fixed contained file paths reject symlinks/junctions. Revisions and an exclusive file lock protect overlapping writes. No frontend administrative credentials. Never expose this local server through hosting, a tunnel or public proxy. It is a single trusted local-operator tool, not multi-user authentication.

Validation establishes structure and recorded evidence, not biblical truth. It does not automatically fetch/compare KJV quotations or contain exhaustive verse counts. A plausible fabricated excerpt cannot be reliably detected by schema checks. Independently verify every reference, quotation, answer and interpretation. Coverage associations remain provisional and do not certify exhaustive commandment coverage.

## Verification

```powershell
node scripts/test-editorial.mjs
node scripts/test-kr-101-150.mjs
node scripts/test-curriculum-coverage.mjs
node scripts/build-site.mjs
```

Editorial tests use isolated temporary fixtures for approval/rejection/publication, never real candidates or the live module. They exercise security, persistence, stale/revoked approvals, evidence, uniqueness/schema, concurrent writes and difficulty. None of the 100 real candidates was approved, rejected or published during implementation.

## Implementation file inventory

Created for this workflow:

- `scripts/review-server.mjs`
- `scripts/editorial-core.mjs`
- `scripts/editorial-store.mjs`
- `scripts/editorial.mjs`
- `scripts/difficulty-map.mjs`
- `scripts/test-editorial.mjs`
- `tools/question-review/index.html`
- `tools/question-review/review.js`
- `tools/question-review/review.css`
- `LOCAL_QUESTION_REVIEW.md`

Updated for this workflow (including documents/tests that were already uncommitted from earlier work):

- `package.json` — local launch and targeted test commands.
- `scripts/build-site.mjs` — include editorial security/publication tests.
- `scripts/question-batch.mjs` — retire raw checklist approval, require evidence/current ledger for publishing, resolve directional warning checks.
- `scripts/test-knowledge.mjs` — publication-aware candidate tests and isolated review fixture.
- `scripts/test-kr-101-150.mjs` — distinguish later explicitly published records from unpublished candidates without weakening original-content preservation.
- `QUESTION_PUBLISHING_AUDIT.md` — current implementation and safeguards.
- `BIBLICAL_KNOWLEDGE_ENGINE.md` — current review/export workflow.
- `BIBLICAL_CURRICULUM_AND_DOCTRINE.md` — compatibility boundary and explicit opt-in mapping.
- `content/CURRICULUM_COVERAGE.md` — mapping documentation cross-reference.

No question source, answer, Scripture reference, explanation, runtime gameplay file, save format, deployment setting or production asset was changed. The build regenerated the same service worker bytes. Existing earlier-task files remain in the working tree.
