# Firebase security verification — 2026-11-06

Scope: local-only security verification for Kingdom Race The Lion's Gate. Project fixed to **demo-kingdom-race**. No production Firebase client was initialized, no Google accounts were used, and no rules/indexes/data were published. No commits, pushes or deployments.

## Environment

- Node **24.22.1**.
- Portable Eclipse Temurin Java **21.0.13+9**, downloaded from the official Adoptium release, verified against SHA-256 `2332c0b4cff6bed722da3567c91d5e47568bcba863fa4945d0a8d6fc76158628` before extraction.
- Java is inside ignored `.verification/firebase-runtime`; no system install or persistent PATH/JAVA_HOME change.
- Firestore emulator **1.22.0** (Standard edition), Firebase CLI **15.35.0**, modular Firebase SDK **13.2.0**, rules-unit-testing **6.0.0**.
- Project-local npm dependencies and lockfile in `tools/firebase-tests`. Production root dependencies remain empty.
- `run-emulators.mjs` checks loopback host/port, fixes the demo project, isolates the CLI configuration and emulator cache, removes inherited Firebase-token/ADC environment variables, and configures Java only for the child process. It has no production/project/deploy option. The source adapter's Firebase configuration/imports are replaced only in the test harness with demo-bound SDK contexts; no production configuration is imported during these tests.

## Reproduced defects and fixes

1. **Payload size mismatch:** original rules accepted `漢` repeated 233,334 times: 233,334 characters but **700,002 UTF-8 bytes**. The browser's 700,000-byte cap and the rule did not agree. The rule now uses `payload.toUtf8().size() <= 700000`; the non-empty check remains. No limit was raised.
2. **One-way pairing:** original rules allowed directly setting private `leaderboardEnabled` to false while leaving a public record visible. The browser correctly deleted it atomically, but the rules did not require that operation. Private saves now require either a matching post-commit public revision/timestamp when enabled or no public document when disabled. Public deletion requires a disabled post-commit private save. Existing public write UID/schema/revision/timestamp/visibility checks remain.

`probes.mjs` was run against the original rules and printed:

```json
{"oversizedBytesAccepted":true,"unpairedOptOutAccepted":true,"publicRecordStillExists":true}
```

After the fixes, the same probes report both unauthorized operations rejected. The old public record remains in the probe only because the invalid standalone opt-out is rejected and the account remains enabled. The proper atomic opt-out test verifies that the public record is actually removed.

## Passed tests

The original suite passes, followed by **70 explicit allow/deny checks** plus additional client/size/pagination assertions:

| Area | Verified result |
| --- | --- |
| Private ownership | Guest and foreign UID reads/writes/deletes denied; owner get/create/update allowed |
| Private query/path scope | No private collection listing or alternate save paths |
| Revisions | Create starts at 1; exact increments only; stale, skipped, negative, fractional, string and null revisions denied |
| Private schema | Missing/extra fields, wrong schema/types, empty/array payload and fabricated old timestamp denied |
| Public create/update | Matching atomic private/public changes pass; reused revision or mismatched timestamp fails |
| `getAfter()` pairing | Enforced in both directions; cannot leave a stale public snapshot when saving an enabled account, or leave a public row after opt-out |
| Public deletion | Other UIDs denied; enabled account cannot delete only its public row; atomic opt-out/delete passes |
| Public schema | Email/extra fields, invalid names, negative or noninteger numbers, invalid medal IDs, duplicate medals and more than 3 medals denied |
| Stale opt-out | Raw stale writes and the actual client's stale transaction fail after opt-out; a subsequent ordinary save stays private; deliberate re-opt-in with current revision passes |
| Actual client operations | Executed the unchanged production `firebaseAdapter()` read/write/page bodies with real modular Firestore functions bound to authenticated emulator contexts; create, update, listing, unlisting, re-opt-in, UID guard and foreign private read tested |
| UTF-8 boundaries | Exactly 700,000 bytes accepted for ASCII, accented characters, CJK mixture and emoji; just-over-boundary values denied; client TextEncoder cap checked |
| Pagination | Actual production query returned 43 distinct records as **20 / 20 / 3**, including equal-score ties, with no duplicates; unbounded and 21-row queries denied |

## Index exemption

`firestore.indexes.json` is unchanged and exactly validated:

```json
{
 "indexes": [],
 "fieldOverrides": [
  {"collectionGroup":"saves","fieldPath":"payload","indexes":[]}
 ]
}
```

The Firebase config references that exact file. The payload is never queried; the leaderboard query orders `souls` descending and uses document-snapshot cursors, covered by default single-field indexing. The emulator does **not** fully enforce production index requirements or prove that a production exemption has been applied. File/schema and query compatibility were verified locally; production index state was not accessed or changed.

## Dependency review

Initial `npm audit` reported 19 affected test dependency entries, including 5 high-severity entries stemming from an old Node gRPC package. A test-only `@grpc/grpc-js: 1.13.6` override addresses the high-severity chain without downgrading Firebase or changing the browser SDK. Remaining **14 moderate** audit entries are in the isolated CLI/test dependency tree (OpenTelemetry, glob/minimatch and uuid chains); npm proposes breaking top-level downgrades, which were not applied. These packages are not installed by or shipped in the static production build. This is not a claim that the entire test-tool dependency tree has a clean audit. Review upstream updates before using these tools for unrelated network services.

## Run again

From the inner game repository:

```powershell
npm ci --prefix tools/firebase-tests
npm test --prefix tools/firebase-tests
```

The portable runtime is ignored and available on this machine. Other machines need Java 21+ on PATH/JAVA_HOME or an equivalent portable runtime extracted under `.verification/firebase-runtime`. No Firebase login is needed. The production build remains `node scripts/build-site.mjs`; emulator tests are deliberately separate from Vercel's zero-dependency build.

## Readiness and limits

The tightened rules are ready for **manual publication review**, based on the emulator checks. The actual client writes are compatible; no runtime/gameplay changes were needed in this security task. The production-equivalent build and all **40** game regression suites also passed. The local game remains version **1.23**; its source/offline revision is unchanged by these rules-only fixes.

Rules protect document ownership, types, size, visibility and revision consistency. They **do not** prove scores/medals were earned honestly: the save is client-reported JSON and public numeric values cannot be independently derived from it in rules. A malicious owner can forge their own score or deliberately re-opt-in using a current revision. Trusted competition still needs authoritative server-side run/answer/score verification. Stale accidental writes are rejected; deliberate authenticated changes are not equivalent to stale writes.

Google OAuth and physical-device/PWA behavior, production rules/index activation and real cross-device networking remain separate integration checks. Nothing was published by this verification.

## Verified file hashes (SHA-256, current working-tree bytes)

- `firestore.rules`: `a7eb8ffa1202b7504f8c558b8cb64c67014f7f0094f81465a7015b2b50b314ca`
- `firestore.indexes.json`: `ab63ad5909072f627d82fa9823c7df56f42ee520c1e0e29613c060d0f0465ddb`
- unchanged runtime `dist/firebase-sdk.js`: `d03578b96ba307e5e02db3067ba118d3a17e9058eee97ef388f0795b7c59be4f`

## Files changed for this security task

`firestore.rules`; `.gitignore` (local test runtime/cache exclusions); `tools/firebase-tests/package.json`, `package-lock.json`, `rules.mjs`, `probes.mjs`, `verification.mjs`, `run-emulators.mjs`, `test-all.mjs`; this report and `FIREBASE_CLOUD_PROGRESS.md`. `firestore.indexes.json` was verified and kept unchanged. The previous Firebase integration remains uncommitted; its runtime files were not altered by this verification.

References: [Rules String size/toUtf8](https://firebase.google.com/docs/reference/rules/rules.String), [Firestore storage size](https://firebase.google.com/docs/firestore/storage-size), [emulator limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore), [rules emulator testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).
