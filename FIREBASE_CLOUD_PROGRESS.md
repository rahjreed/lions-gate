# Optional accounts, cloud progress and Global Hall of Masters

Prepared locally for **Kingdom Race The Lion's Gate**, Firebase project `r2g2-kingdom-race`. No Firebase resources, production records, rules, Vercel deployments or DNS were changed. No commit or push was made.

## Existing architecture and integration

The application is authored directly in `dist/`; Vercel runs `node scripts/build-site.mjs`. Root npm dependencies remain empty. The pinned official modular Firebase JavaScript SDK **13.2.0** is imported from Google's CDN only after choosing Account / Cloud Save, opening the Global Hall, or restoring an explicitly opted-in Auth session. The static build does not fetch the SDK. The existing service worker caches the new local modules and excludes third-party requests; an unavailable CDN cannot prevent guest play.

The existing `dist/storage.js` save, `lions-gate-arcade-v3`, remains authoritative on the device. `persist()` still saves locally first, then notifies the optional sync controller. No engine, approved question, combat, armor, progression, artwork, name-entry, collection or study-path logic was edited. New cloud controls are added to the title menu and the existing Hall's online section. Existing local Hall rows, filters and ordering remain unchanged.

## Player flow

1. Play as Guest normally, or open **ACCOUNT / CLOUD SAVE** on the title screen or Hall of Masters.
2. On first use, **SIGN IN WITH GOOGLE** loads the SDK. Press it again when ready to open the Google popup directly from a user gesture (important on mobile). Subsequent uses can open immediately. A cancelled/blocked popup leaves guest progress intact. No Facebook provider is enabled; the provider-specific code is isolated for future extension.
3. Google UID is the account identifier. The game does not use Google display names or email addresses in saves or public records. Arcade names remain the existing independently chosen names.
4. First guest association requires **UPLOAD LOCAL PROGRESS** and confirmation. Differing saves show both summaries, cloud revision and server time. Choose **KEEP LOCAL / UPLOAD** or **USE CLOUD / RESTORE**, then confirm. There is no implicit timestamp winner.
5. Only an identical comparison or a confirmed upload/restore enables automatic sync in that session. A fresh session compares again. Different accounts never inherit a previous UID's sync authorization.
6. Sign Out retains the local save and returns to guest play. It does not remove an opted-in public leaderboard entry; uncheck the listing option before signing out to remove it.

## Save safety and conflict policy

- Full version-3 profiles are serialized, preserving the current run, question queue/history, lives, souls/score, armor, ranks, degrees, retries, achievements, settings, collection, study path and all arcade identities' medal state. Loading uses existing validation/migration, with additional cloud schema/run/medal rejection. Missing legacy collection/path metadata still means KJV80 / Complete.
- Firestore transactions compare the inspected revision before each write. Rules also require revision increments. Another device's successful write causes a conflict rather than an automatic overwrite. Server `updatedAt` is informational; device clocks do not choose the winner.
- Choosing a save selects that run and category current streaks. Earned permanent medals from **both** validated saves are retained, historical best category counts use the maximum, and accepted-answer receipt high-water marks are retained. Streak counters are never added together; Master proofs are not fabricated. Different arcade names retain separate medal identities within the UID's profile.
- Before explicit replacement/association, both snapshots are saved under `lions-gate-cloud-backups-v1` on this origin, with UID, timestamp and revision. Backups are not automatically pruned. Full storage or a failed backup blocks the replacement. Browser clearing still removes local data. A future backup-management UI is not included; backups are JSON retrievable from that localStorage key by developer support.
- Restore rechecks the selected remote revision and rejects it if either cloud or local progress changed during the request. Closing a modal and continuing play cannot silently replace the newer running game.
- Autosaves use a 30-second throttle, with no realtime listeners, and stop on conflict/network/permission errors. Reopen Account and select **COMPARE / RECONNECT**. Failed cloud writes never erase local progress. There is no promise of an unload-time save: leaving immediately may leave up to the latest throttle interval only on this device; manually upload before switching devices.
- No persistent Firestore offline-write queue is enabled: transactions need connectivity and cannot later replay an old cached write over a newer save. Local guest storage and PWA remain the offline mechanism.
- Saves over **700,000 UTF-8 bytes** are refused before upload, below Firestore's document limit. Very long histories/medal receipts can eventually need a future chunked-save migration; the local profile remains intact.
- Existing localStorage multi-tab behavior remains last-writer-wins **locally**; use one active game tab per browser. Firestore transactions protect competing cloud revisions, not localStorage itself.

## Firestore schema

| Path | Fields | Access |
| --- | --- | --- |
| `players/{uid}/saves/current` | `schema: 1`, integer `revision`, JSON-string `payload`, boolean `leaderboardEnabled`, server timestamp `updatedAt` | Only this authenticated UID can get/create/update; no client delete/list |
| `leaderboard/{uid}` | `name`, integer `level`, integer `souls`, up to 3 `category:tier` medal IDs, `revision`, server `updatedAt` | Public get and bounded list; only owning UID writes/deletes |

Published questions remain in the repository. They are not uploaded to Firestore. There is no client-accessible editor, admin credential or service-role key.

Public leaderboard opt-in is separate from private sync. Save private progress first, then check the option to publish that saved snapshot. Visibility is stored in the account envelope, not a device preference. Toggling it atomically updates the revision and public row without replacing the private run. A stale second device cannot re-list someone after opting out: its revision check will fail. Subsequent saves and their optional public summaries are written atomically. The highest earned/current local souls and level are used, with the current arcade name and its top medals. One public row per UID; Google profile data, run details and Scripture preferences are absent. Paging requests 20 records ordered by souls descending and the implicit document-ID tie break, using `startAfter`; no count query or realtime listener. The existing single-field descending index covers this ordering. `firestore.indexes.json` exempts private payloads from indexing.

`firestore.rules` defaults to deny, checks UID ownership, exact allowed field sets/types/bounds, server timestamps, revision increments, approved medal IDs, no duplicate public medal IDs, list limits and an atomic matching save revision for public writes. It does **not** parse/verify the JSON game's answers or make scores tamper-proof. A determined player can forge their own local progress/public score. A future trusted leaderboard needs server-owned run IDs, canonical question/answer validation, replay/idempotency checks, authoritative score/medal calculation, rate limiting and optionally App Check. None of those server services is introduced or claimed here.

## Manual Firebase Console setup (not performed)

1. Open project **r2g2-kingdom-race** and verify that its registered web app matches the provided `appId` in `dist/firebase-config.js`.
2. Authentication → Get started if needed → Sign-in method → **Google** → Enable. Select a project support email and save. Leave Facebook disabled.
3. Authentication → Settings → Authorized domains: add **lionsgate.callistadigital.com**. For local testing add **localhost** and **127.0.0.1** as needed. Authorize only exact preview hosts you intend to use; do not assume all Vercel preview domains are covered. The configured Auth domain remains `r2g2-kingdom-race.firebaseapp.com`; no DNS changes are needed.
4. Firestore Database: if no `(default)` database exists, create a **Standard edition** database in production/locked mode. `us-central1` is a reasonable US regional choice; keep an existing database's location. Confirm location before creation, since it is a long-term infrastructure choice. Do not enable open test-mode rules.
5. **Before permitting public use**, run the emulator tests below, review `firestore.rules`, and then explicitly authorize publishing those rules to this project. Console → Firestore → Rules can apply the exact file. Also apply the `saves.payload` index exemption from `firestore.indexes.json`. These changes are deliberately not applied by the game build or this task.
6. Confirm Google popup sign-in from the local authorized origin, explicit guest migration, a second browser/device restore, concurrent-device conflicts, opt-in listing and listing removal. Use disposable QA accounts; this task did not create Auth users or write production records.
7. No Vercel environment variables are required for this browser web configuration. Firebase web API keys identify the project; authorization comes from Auth and Security Rules. Do not add administrator/service-account credentials to `dist/`. Review Firebase API-key restrictions in the Console without disabling required Auth/Firestore APIs.

Authentication and Firestore quotas/billing should be reviewed in the Console before launch. This client does not require Cloud Functions or Firebase Storage. Usage beyond plan limits and a future trusted server leaderboard may require billing; no billing settings were changed.

## Local verification and emulator workflow

Ordinary production-equivalent build and all runtime suites:

```powershell
node scripts/build-site.mjs
```

Focused controller tests (no Firebase connectivity):

```powershell
node scripts/test-cloud-progress.mjs
```

Security-rule tests are isolated from the zero-dependency production build in `tools/firebase-tests`. Node 24 and either Java 21+ on PATH/JAVA_HOME or the repository-local portable Java runtime are required:

```powershell
npm ci --prefix tools/firebase-tests
npm test --prefix tools/firebase-tests
```

The test command uses **demo-kingdom-race**, loopback-only Firestore on port 8080 and fake rule-testing UIDs. The runner discovers portable Java under `.verification/firebase-runtime`, isolates CLI configuration/cache, strips Firebase token/ADC credential environment variables, and never accepts a project/deployment argument. All three test scripts refuse a non-local emulator host. They test private guest/foreign access, revision checks, UTF-8 bounds, atomic public creation/updates/deletion, opt-out/stale writes, malformed records, actual browser adapter transactions and cursor pagination. No Firebase login or real project is required. Downloading the CLI/emulator needs network connectivity; don't run `firebase deploy` to run tests.

### Verification limits

The dependency-injected runtime tests exercise guest isolation, optional authentication state changes/sign-out, all six collection/path save roundtrips, legacy migrations, lives/settings, local association, conflicts, stale restores, backup/quota/offline failures, throttling and permanent-medal retention. Existing regression suites verify unchanged gameplay, published bank, saves, PWA and artwork.

**Security verification completed locally:** Java 21.0.13, Firestore emulator 1.22.0 and the original plus expanded suites. Confirmed gaps in the character-based payload cap and one-way leaderboard pairing were fixed with UTF-8 byte checks and bidirectional post-commit invariants. See `FIREBASE_SECURITY_VERIFICATION.md` for evidence, test-tool dependencies and exact limitations.

**Not yet verified:** actual Google OAuth, physical-device/PWA popup behavior, real cross-device synchronization, deployed Firestore permissions and browser/mobile visual inspection. Browser inspection was blocked by the Windows tool's current-URL policy check. These remain pre-release integration checks, not claims that live Firebase is configured. The emulator does not fully enforce production indexes; index configuration is statically verified and the exact query is tested locally.

References: [official modular CDN setup](https://firebase.google.com/docs/web/alt-setup), [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors), [rules tests](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

## Files changed

- Runtime additions: `dist/firebase-config.js`, `dist/firebase-sdk.js`, `dist/cloud-progress.js`, `dist/cloud-ui.js`, `dist/cloud.css`.
- Existing integration: `dist/app.js` (three exact integration edits), `dist/index.html` (stylesheet only).
- Firebase preparation only: `firebase.json`, `firestore.rules`, `firestore.indexes.json`. No `.firebaserc` or deployment automation.
- Verification: `scripts/test-cloud-progress.mjs`, `scripts/firebase-revision.mjs`, `scripts/fixtures/firebase-revision.json`, `scripts/mastery-medals-revision.mjs`, `scripts/build-site.mjs`, `tools/firebase-tests/package.json`, `tools/firebase-tests/rules.mjs`. The exact reversible adapter preserves historical hash checks rather than disabling them.
- Documentation: this file. Generated by a successful production build: `dist/release.js`, `dist/sw.js`, `game-release.json`.
