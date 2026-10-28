# Judah dialogue expansion — local review

Game release **1.2**, 2026-10-27. No commit, push, deployment, voice acting or question publication was performed.

## Delivered

All 55 supplied exchanges are live, with their exact wording, stable IDs and paired replies: 30 regular introductions, seven enemy-10%-health exchanges, seven last-life exchanges, six knockout exchanges and five serious Gatekeeper exchanges. The three original P01–P03 lines are unchanged. The approved collection replaces the earlier dialogue pools so Roman delivery and Judah's voice follow the supplied batch. No extra live lines were invented to pad the exchanges.

The existing two-speaker panel retains tap/click progression, Skip, keyboard controls, pause/resume and the shared disable preference. Sequential encounter rotation visits each introduction/Gatekeeper pair before repeating; battle categories rotate deterministically. Saved speaker steps now include stable exchange IDs. Old checkpoints without IDs still load. Deterministic selection may repeat on retries or when trigger encounters are widely separated; it does not promise a dialogue never repeats.

Enemy-low dialogue triggers once on the ninth correct hit, including beyond question ten. Last-life dialogue triggers once on crossing to one life. L02's exact four-blow boast is eligible only after four actual life-losing hits in the current encounter; shield blocks and carried-over lives do not satisfy that condition.

Knockout dialogue is occasional: Levels 1, 4, 7, 10 and onward, rotating through K01–K06. It runs after the final answer is accepted but before the finishing animation. Health, score and Gatekeeper-seal presentation hold their pre-impact values until combat contact. Skipping or disabling goes directly into the existing finisher. A terminal exchange supersedes stale lower-priority ones; the soldier never speaks after falling. The answer is not resubmitted, so dialogue cannot duplicate points, damage, power use or level completion. No timers run while dialogue is showing.

Short portrait phones temporarily hide the redundant score/rank rows during dialogue, allowing the owner's longer originals to remain legible with 44px controls. Those HUDs remain unchanged during questions. Existing reduced-motion entrance suppression is preserved.

## Community proposals

`content/dialogue/submissions.example.json` is a **pending** formatting example, outside the game. Real names and proposals belong in Git-ignored `content/dialogue/private/`, not the public build or normal commits. The runtime projection also removes contributor and reviewer identities.

`node scripts/validate-dialogue.mjs [proposal-file]` is read-only; it cannot approve, import or publish. Only explicitly approved live-bank records can enter rotation. Referenced/quoted proposals need actual accuracy/context review, source evidence and a current content fingerprint; a schema check alone is not Scripture verification. No new Scripture references were asserted for the owner's fictional banter. See `DIALOGUE_CONTRIBUTIONS.md` for copy/paste format, review instructions and a future explicit approval request example.

## Changed files

| Area | Files |
| --- | --- |
| Approved data and selection | New `dist/dialogue-bank.js`, `dist/dialogue-catalog.js`; updated `dist/encounter-dialogue.js`, `dist/battle-dialogue.js` |
| Existing presentation/integration | `dist/app.js`, `dist/encounter-dialogue.css`; `dist/engine.js` clears completed dialogue checkpoints without changing combat rules |
| Proposals/privacy/docs | `.gitignore`; new `content/dialogue/approved-55.json`, `content/dialogue/submissions.example.json`, `scripts/validate-dialogue.mjs`, `DIALOGUE_CONTRIBUTIONS.md`, this report |
| Tests | New `scripts/test-dialogue-expansion.mjs`; updated `scripts/test-encounter-dialogue.mjs`, `scripts/test-phase3.mjs`, `scripts/test-combat-feedback.mjs`, `scripts/test-combat-victory-audit.mjs`, `scripts/build-site.mjs` |
| Generated release/integrity | `game-release.json`, `dist/release.js`, `dist/sw.js`, `content/launch/runtime-fixes.json` |

## Verification

- Production build passed all **26 configured validation/test scripts**: 111 production files and 100 resolved local asset/module references. The release counter advanced from 1.1 to 1.2.
- New tests compare every supplied line/pair against the recorded 55-entry owner batch, cover all five categories and rotation cycles, stable IDs, legacy saves, conditional L02 eligibility, extended battles and once-only queuing.
- Actual application-function tests cover choose → knockout dialogue → saved reply → pause/background/resume → skip/finish → existing combat/reveal → successful clear. They include regular and Gatekeeper levels, reduced motion, disabled dialogue and duplicate-input/reward prevention.
- Proposal tests cover pending/rejected exclusion, private-field stripping, missing quotation evidence, stale Scripture review fingerprints and excluded-book rejection. The example validates as one pending entry and zero approvals.
- Existing combat, five-life, shield, retry, score, flawless reward, ranks, armor, question engine and PWA suites passed. Supplementary candidate-snapshot, Torah-source, campaign-boundary, curriculum and local-publication checks passed. All 110 live questions and evidence remain unchanged. The 15 existing KR-101–150 candidate warnings remain unchanged.
- Browser inspection confirmed the original P01/P02 replies fit at **320×568** without scrolling, 390×844 knockout presentation, desktop Gatekeeper dialogue, H01 at 10% health, L02 at one life, knockout reply restoration after reload, transition into a single finishing animation, normal Scripture reveal, and the disabled-dialogue path. No voice assets were added.

## Remaining limits

Physical phone/PWA and operating-system reduced-motion preference testing were not performed. Reduced motion is covered by automated timing/CSS checks. H02 mentions a spear while the reused Roman artwork carries a sword; the approved wording and existing artwork were deliberately retained. Future Scripture-linked community submissions still require real passage/context review and explicit authorization before activation. No public submission site or new backend was created.
