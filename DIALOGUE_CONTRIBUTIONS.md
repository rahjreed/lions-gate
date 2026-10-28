# Judah's dialogue bank and private proposals

The live bank is `dist/dialogue-bank.js`. Its original 55 entries preserve the supplied P01–P30, H01–H07, L01–L07, K01–K06 and G01–G05 pairs exactly. `content/dialogue/approved-55.json` records that initial owner-approved batch for regression comparison. These are fictional character lines, not Scripture lessons or question records. The serious Gatekeeper responses are the supplied faith-centered wording; no new Scripture citation or verified quotation has been asserted.

## Rotation and timing

- Regular introductions rotate through all 30 P pairs before repeating; Gatekeepers rotate through all five G pairs. Successful level numbers determine rotation, so refreshes/retries retain the same pair.
- H pairs appear once at the ninth successful hit (10% enemy HP), between questions. L pairs appear once on crossing to one remaining life. L02 is eligible only after four life-losing hits in the current encounter, excluding shield blocks; this avoids a false four-hit claim when lives carried over.
- K pairs appear on Levels 1, 4, 7, 10 and so on, rotating through six pairs. They are optional/skippable and share the global disable preference. They appear after accepting the final correct answer but **before** any finishing animation. The health/score display holds its pre-impact snapshot until combat contact. No soldier speaks after his fall. Existing question timers are stopped, not rescaled.
- A final K exchange supersedes stale lower-priority dialogue. Earlier H/L events retain their existing one-life-first queue priority. Stable exchange IDs and the current speaker step are saved. Older checkpoints without IDs remain accepted. Reloading/pausing never resubmits the answer or reapplies damage, score or power consumption.
- Short portrait phones devote the encounter view to health, actors and dialogue, temporarily hiding the redundant score/rank rows. Gameplay HUDs remain unchanged. Reduced motion keeps the existing no-entry-animation behavior.

## Adding a private proposal

Copy `content/dialogue/submissions.example.json` to a separate file outside `dist/`, for example `content/dialogue/private/friends-proposals.json`. Give each entry a unique stable ID and keep `reviewStatus: "pending"`. Categories are `pre-battle`, `enemy-low`, `one-life`, `knockout`, `gatekeeper`.

Each entry supports optional private `contributor`, category, `opponent`, `judah`, optional structured `scripture`, `containsScriptureQuotation`, and `reviewStatus` (`pending`, `approved`, `rejected`). The example is a new pending formatting example, not an addition to the 55 live lines. Keep real submissions and review logs in the Git-ignored `content/dialogue/private/` directory so identities are excluded from ordinary commits as well as the production shell. Share or publish identities only after separate contributor permission. Even the runtime approval projection strips contributor/reviewer identities; this task does not publish any names.

Create the private folder and copy the example before adding real names:

```powershell
New-Item -ItemType Directory -Force content/dialogue/private
Copy-Item content/dialogue/submissions.example.json content/dialogue/private/friends-proposals.json
```

Validate locally:

```powershell
node scripts/validate-dialogue.mjs content/dialogue/private/friends-proposals.json
```

This only reads and validates. There is no submission server, approval endpoint, automatic import or automatic publication. Pending/rejected entries are excluded by the runtime selector even if accidentally supplied to it. A schema pass is not an editorial approval or proof of scriptural accuracy.

## Future review and activation

Example request to Codex: “Review COMM-001 in content/dialogue/private/friends-proposals.json for Judah's voice, its paired setup, mobile length, repetition and biblical scope. Check any Scripture in context. Report recommendations; do not activate it yet.”

After reviewing the report, explicit authorization could be: “I approve COMM-001 as fictional dialogue. Record my decision, add its reviewed public fields to the live dialogue bank, and test it locally. Do not commit, push or deploy.” That future task must record the actual reviewer and decision privately, preserve the exact approved pair, add only the public fields to the live bank, test rotation/layout/saves, and run the build. Setting a proposal's status alone does not import it into the game. Existing question approvals and publication tools are separate and must not be changed.

For Scripture, use `scripture: {"book":"…","chapter":1,"verse":1}` with optional `endVerse`. Approved referenced/quoted lines require `scriptureReview` containing a checked excerpt, HTTPS `sourceUrl`, actual `reviewedBy`, `accuracyChecked: true`, `contextChecked: true`, and `contentFingerprint` from `dialogueFingerprint(entry)`. Changing the wording, category, ID or passage invalidates that fingerprint. Quotations need a passage; do not mark unchecked quotations as ordinary fictional lines. The validator enforces the traditional 80-book scope and basic chapter/range shape. A reviewer must still check the actual verses, quotation accuracy, speaker and context. Never fabricate evidence or review attribution. Enoch, Jubilees, Jasher, other excluded writings and personal-note trivia cannot become authoritative Scripture dialogue or questions.
