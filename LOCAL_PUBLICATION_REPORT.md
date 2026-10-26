# Lion's Gate — authorized local publication

October 26, 2026. The owner explicitly authorized recording the 68 prepared AI-assisted review decisions and publishing those exact additions locally. Commit, push and deployment were explicitly excluded.

## Result and preserved evidence

- **110 unique live questions = 42 original + 68 additions.**
- The publisher ran successfully through `stage-launch.mjs --authorize-publication` followed by `question-batch.mjs publish content/launch/reviewed-candidates.json`.
- `content/editorial/decisions.json` contains exactly 68 source-bound decisions and 68 staging events. The decisions preserve the original Codex AI-assisted attribution, October 25 review timestamp, checks, rationales and source digests; staging events separately record execution time. These are not owner/personal Scripture reviews or independent human verification.
- Published records exactly equal the prepared exports, including approval receipts, Scripture excerpts, references and review metadata. The original 42 records and all 150 candidate records remain unchanged.
- The original launch manifest, source audit, Scripture evidence, reviewed export and change log remain unchanged by publication. The manifest intentionally retains the pre-publication live-bank digest, rather than silently redefining its approval scope.
- **82 candidates remain unpublished: 32 held + 50 deferred Torah drafts.** The 68 original source copies remain on disk with candidate status; publication authority comes from the live module and ledger, not relabeling or deleting source files.
- The existing publisher created a backup of the previous empty additions module under `content/reviewed/`. The PWA cache revision was rebuilt for the expanded static bank. Save version, existing queues and game rules are unchanged.

## Verification

- Pre-publication `test-launch.mjs` passed before the real ledger write.
- `test-local-publication.mjs`: exact 68 export/receipt/ledger match; preserved source/evidence hashes; unchanged original 42; all 82 excluded IDs absent; duplicate publication rejected; old-bank saves valid; all 110 records selected across 1,000 levels; regular/Gatekeeper progression through Level 5; Level 700 defeat/retry valid.
- `test-torah-everyday-life.mjs`: all 50 remain drafts with intact evidence and no conflicts; peer checks now recognize published working copies rather than counting duplicate sources as new questions. Only the exact authorized additions module and generated cache supersede their pre-publication snapshots; other original file hashes remain enforced.
- `test-kr-101-150.mjs`: original question/choice/explanation/reference/difficulty integrity and publication exclusions passed. Its 15 current warnings concern the remaining unpublished KR subset; they are not silently approved.
- `test-curriculum-coverage.mjs`: refreshed inventory passed; 110 live, 82 unpublished, 68 retained source copies; no chapter is thereby certified complete.
- `test-campaign-boundaries.mjs`: 450/451 and 699/700/701 progression, saved checkpoints, belt permanence and retries passed without implementing Kingdom entry.
- Full `build-site.mjs`: all 18 configured production test/validation scripts passed, 100 production files and 90 local references checked; offline revision `55edbeaafe4d4b3b2dea`.
- Actual loopback production browser: a newly published John 13:14 question rendered, accepted the correct answer, awarded 100 points, showed the Scripture/explanation modal at 390×844, continued to the next question and paused correctly. This verifies local files, not a deployed update.

## Issues and limits

The first regression build exposed a fixed numeric recent-history cutoff in `test-storage.mjs` that assumed 42 questions. The test now computes the same 20-answer recency rule from the current history; no selector/gameplay code changed. The full build passed after this test correction.

The expanded live bank still covers only complexity 1–3. It improves variety but does not complete the advanced campaign; six higher-complexity Torah items remain drafts. Follow `ADVANCED_QUESTION_COVERAGE_PLAN.md` for that work.

The browser emitted asynchronous message-channel errors also observed in prior browser audits; they did not interrupt this playthrough, and their origin remains unisolated. Physical-device/PWA installation and audio output were not newly tested in this publication task. No newly confirmed gameplay blocker was found.

The pre-publication `stage-launch.mjs`/`test-launch.mjs` must not be rerun as if the bank were still 42 questions: their old-live digest guard correctly rejects the already-published state. Use the post-publication verifier above. Any future additions require a fresh separately authorized package.

No files were committed, pushed or deployed. The public website has not been updated by this local publication.
