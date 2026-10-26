# Lion's Gate Question Review Portal

Prepared locally for **Supabase `lions-gate-admin`**, **Vercel `lions-gate-questions`**, and **questions.lionsgate.callistadigital.com**. None of those projects/domains was created, changed or deployed. Do not use Close & Relax. The game's name remains **Lion's Gate**.

## Architecture and current verification limits

The existing repository is a dependency-free static game, not a React/Vite application. Its actual Git root is `sites/lions-gate-sword-sharpener`. The hosted editor is a separate Node 24 Vercel application in `admin-review/`, with no dependencies. The public game, its Vercel configuration, assets, questions, saves and PWA are untouched. The original local review command still works.

The browser receives only the login/review UI. Password sign-in goes through the same-origin API to Supabase Auth; access and refresh tokens are HttpOnly, Secure, host-only, SameSite=Strict cookies. Tokens are never stored in browser JS storage. Each request calls Auth `/user` and checks a database administrator allowlist, not user-editable metadata. The private server secret is used only after authorization, except for the separately invoked local import tool.

All six editorial tables have RLS. An administrator's ordinary JWT permits SELECT only and only while enabled. Ordinary accounts cannot read editorial data. Neither ordinary nor admin JWTs have direct INSERT/UPDATE/DELETE or write-RPC privileges. Service-only, SECURITY INVOKER RPCs perform transactional saves/snapshots/imports; saves check enabled membership, current source hash, revision, all seven approval confirmations and passage evidence again. The API additionally uses the existing question schema, warning checks and full approval validator. Audit events are append-only through the application; no user-facing delete/history-rewrite endpoint exists. The database owner/service key remains privileged by design.

**Verified locally:** production UI build, mocked Supabase Auth/admin/revision/evidence/save/revocation flows, unchanged candidate data, private/public separation, existing local workflow, and responsive browser UI. **Not yet verified:** execution of the install SQL, real RLS behavior, actual Auth cookies/refresh against Supabase, provider bundling/runtime, custom-domain TLS or remote persistence. No dedicated projects/credentials or PostgreSQL/CLI are available here; connector account tools were unavailable. SQL assertions are static checks, not a substitute for the staging gate below. Do not treat this as a deployed or fully cloud-verified service.

## 1. Create the dedicated Supabase project and administrator

These are future operator steps, not actions performed during implementation.

1. In Supabase Dashboard, create a **new project** named `lions-gate-admin` in your intended organization. Choose a region near the intended Vercel region, a strong database password and your desired plan. Store credentials in your password manager. Do not select or modify Close & Relax.
2. Inspect the new project's tables/settings. Review `sql/setup.sql`, then run it once in the dedicated project's SQL Editor as project owner. It intentionally fails if already installed rather than silently replacing schema. It creates no users, approvals or published questions. This is an unapplied installation script, not a CLI-generated migration. Once CLI access exists, record the reviewed installation using that project's normal migration process.
3. In Authentication settings, enable Email/Password, disable public sign-up and anonymous sign-in, require confirmed email, and set the Site URL to `https://questions.lionsgate.callistadigital.com`. Do not add public-game origins. The implemented flow uses passwords, not OAuth/recovery redirects. No self-sign-up or admin-grant endpoint exists.
4. Under Authentication → Users → Add user → Create user, create your own editor account with a strong unique password and confirmed email. Copy its **user UUID**. A confirmed account alone has no editorial access.
5. Explicitly grant that UUID from SQL Editor:

   ```sql
   insert into public.lg_review_admins(user_id,enabled)
   values ('YOUR-AUTH-USER-UUID',true);
   ```

   To revoke access: `update public.lg_review_admins set enabled=false where user_id='UUID';`. This is checked on every data request, including refresh. Do not authorize from `user_metadata` or email-domain matching.
6. Obtain the project URL, publishable key and **server secret** from this new project's API settings. Ensure the Data API exposes `public`; the script explicitly grants SELECT to authenticated users and EXECUTE only to service_role for RPCs. Check Supabase database/security advisors and resolve findings before release. New-project Data API defaults changed in 2026; do not assume table creation alone grants access.
7. Keep Supabase Auth rate limits enabled. Configure Vercel Firewall rate limiting for `/api/login` and `/api/refresh` before production exposure, suited to your plan (for example, a conservative per-IP sign-in limit). Do not log request bodies, passwords, cookies, tokens or secret keys. MFA enrollment/challenge, self-service password recovery, SSO and session-management UI are not implemented; if MFA is made mandatory, add/test that flow before enabling the requirement.

## 2. Environment variables

Set these only in the **new admin Vercel project**, as server environment variables. No `VITE_`, `NEXT_PUBLIC_` or frontend config is used.

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | Actual `https://<project-ref>.supabase.co` URL for lions-gate-admin. |
| `SUPABASE_PUBLISHABLE_KEY` | Its publishable key (legacy anon supported if needed). |
| `SUPABASE_SECRET_KEY` | Its private server secret; legacy service-role JWT supported. Never in public files/client code. |
| `REVIEW_ORIGIN` | Exact HTTPS origin, no trailing slash: `https://questions.lionsgate.callistadigital.com`. |

For preview verification, use that preview's exact HTTPS origin as `REVIEW_ORIGIN`, and a staging project/key set if desired; no wildcards. The production origin intentionally rejects API access on other hostnames. Protect previews with Vercel Deployment Protection when available. Never expose production secrets to untrusted PR builds. `.env.example` contains placeholders only; `.env*` actual files are ignored.

## 3. Import candidates/evidence/decisions safely

Run from the game's Git root, with Node 24. Set the dedicated project's URL/keys in your local environment securely. The initial snapshot contains **142 sources: 42 live reference records + 100 candidates**, plus the coverage inventory and any existing local decision history (currently zero decisions).

```powershell
node scripts/hosted-review.mjs prepare content/hosted-import.json
node scripts/hosted-review.mjs import content/hosted-import.json
# The preceding command is a dry run. Later, only with explicit import authorization:
node scripts/hosted-review.mjs import content/hosted-import.json --apply
```

The importer compares the bundle to current repository/ledger data before any network write. Import is a single transaction. Exact repeats are idempotent; changed existing decisions/events cause an error and rollback, never overwrite. Original JSON is stored as text with SHA-256 so JSONB key reordering cannot invalidate source/decision fingerprints. Every source version remains immutable and imports record audit events. Existing live questions are read-only reference data, not candidates. No import marks anything approved.

If a later **authorized repository correction** changes source content, prepare a fresh bundle and inspect its diff. Import with `--apply --allow-new-versions` only after explicit authorization; it adds immutable versions and advances active pointers, leaving old decisions/history intact. Old approvals become stale through source hashes. It does not rewrite questions from browser input. Conflicting local/hosted decisions require explicit editorial reconciliation; the tool intentionally refuses to choose a winner.

## 4. Separate Vercel project settings

Create a new project named **`lions-gate-questions`**, linked to the **existing game's repository**, not the old outer Vite repository. In a repository whose root is the verified game Git root, select:

| Setting | Required value |
| --- | --- |
| Root Directory | `admin-review` |
| Include source files outside Root Directory in Build Step | Enabled; the build reads the existing shared validator/UI sources one directory up. |
| Framework preset | Other |
| Node.js version | 24.x |
| Install Command | Empty override (no dependencies). |
| Build Command | `node build.mjs` |
| Output Directory | `public` |

If the Git provider actually exposes the outer monorepo instead, use `sites/lions-gate-sword-sharpener/admin-review` as the root and confirm the included game source is the intended repository. Do not change settings on the existing public game. The admin directory's own `vercel.json` defines the private Node API and security headers. Its build copies five shared validator modules into an ignored private function bundle and emits just four public UI files. No candidate JSON, ledger, SQL or secrets are in public output. There are no automatic import, approval, publication or Git workflows.

Only after authorization: create/configure the new project, apply the reviewed database setup/import, build a protected staging deployment, verify the staging gate, then deploy the intended production origin. Do not run a deploy command merely to inspect settings. The project does not yet exist in a verified connected account.

## 5. DNS — exact target must come from the new project

A read-only DNS query found no CNAME answer at the target hostname and returned the `callistadigital.com` authority SOA (`ns1.vercel-dns.com`). This does not prove account ownership, domain attachment or that another record type is absent. No DNS records were changed.

After creating the new admin project **with explicit authorization**, attach **only** `questions.lionsgate.callistadigital.com` in its Settings → Domains. Vercel will show the actual project-specific CNAME destination and any ownership-verification TXT challenge. Those values cannot be determined truthfully before account/project inspection. Do not use an invented destination or a generic example from documentation.

| Record | Host/name | Destination |
| --- | --- | --- |
| CNAME | `questions.lionsgate` within the `callistadigital.com` zone; `questions` if a separate `lionsgate.callistadigital.com` zone is delegated; full hostname if required by provider | **Copy the exact destination shown for the new project's domain. Currently unavailable.** |
| TXT, only if challenged | Exact name supplied by Vercel | Exact verification value supplied by Vercel. Currently unavailable. |

If Vercel manages the authoritative zone and offers automatic record creation on domain attachment, that is still a DNS change requiring authorization. Do not move nameservers, modify `lionsgate.callistadigital.com`, or change any public-game record. Verify HTTPS/TLS and the configured origin after propagation.

## 6. Publication stays local and explicit

The hosted application has **no publish/import/export-to-game endpoint**, filesystem writes or terminal execution. Approval only records a decision. To obtain a reviewed snapshot, use an authenticated administrator's short-lived access token in the local `REVIEW_ACCESS_TOKEN` environment variable, plus `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`. No server secret is needed for pull/adopt/publication checks.

One way to obtain a short-lived token locally (never paste credentials or output into chat):

```powershell
$editorCredential = Get-Credential
$editorSession = Invoke-RestMethod -Uri "$env:SUPABASE_URL/auth/v1/token?grant_type=password" -Method Post -ContentType 'application/json' -Headers @{apikey=$env:SUPABASE_PUBLISHABLE_KEY} -Body (@{email=$editorCredential.UserName;password=$editorCredential.GetNetworkCredential().Password}|ConvertTo-Json)
$env:REVIEW_ACCESS_TOKEN = $editorSession.access_token
Remove-Variable editorCredential,editorSession
```

Then, after explicit authorization for each write/publication step:

```powershell
node scripts/hosted-review.mjs pull content/hosted-snapshot.json
# Inspect the new snapshot/diff first. Adoption refuses conflicting local decisions.
node scripts/hosted-review.mjs adopt content/hosted-snapshot.json --apply
node scripts/editorial.mjs export content/reviewed/hosted-approved.json
# Separate explicit publication authorization is still required:
node scripts/question-batch.mjs publish content/reviewed/hosted-approved.json
node scripts/build-site.mjs
Remove-Item Env:REVIEW_ACCESS_TOKEN
```

The existing CLI still requires current local ledger approval and all quality/evidence/schema checks. For hosted decisions, it additionally validates the authenticated administrator and latest remote source/decision immediately before replacing the published module; missing credentials, expired tokens, remote rejection/revision, source changes or unavailable Supabase block publication. This is an online check, not a distributed lock: coordinate editorial changes during final publication. No background job deploys the game. Existing local-only decisions retain their original workflow.

Adoption never silently overwrites existing local decisions. A conflict is a deliberate stop for owner reconciliation. Imported legacy local decisions remain represented in hosted history; restore their original ledger rather than trying to transform them into hosted approvals. Back up both local editorial files and Supabase data. Snapshot files contain private editorial data; keep under `content/`, outside public output, and do not publish them as web assets.

## 7. Tests, preview and release gate

```powershell
cd admin-review
node build.mjs
node test.mjs
node dev.mjs --fixture
```

Fixture preview: http://127.0.0.1:4320/ with `editor@example.test` / `fixture-password`. It binds loopback, uses an in-memory fake Supabase transport and never contacts Supabase. Its HTTP-only cookie exception is explicitly selected by the fixture launcher and cannot be enabled through production environment variables. The real Vercel entry always uses HTTPS Secure cookies. All fixture decisions disappear when the process stops. This is a UI test, not evidence of live database behavior.

From the game root also run `node scripts/build-site.mjs`, `node scripts/test-kr-101-150.mjs`, and `node scripts/test-curriculum-coverage.mjs`.

Before production use, in the dedicated staging project:

1. Run `sql/verify-rls.sql` as owner after import. It uses synthetic users in a rolled-back transaction to check anon denial, ordinary-user denial, admin read access, absence of direct-write/RPC grants and revocation. Inspect results; do not certify RLS from static tests.
2. Test real Auth login/logout/refresh in desktop Safari/Chrome and mobile, expired sessions and disabled admin access. Confirm cookie flags and no token/client-secret exposure.
3. With **synthetic staging questions only**, test seven confirmations, missing primary/supporting evidence, uniquely correct answers, simultaneous edits, stale source changes, persisted decisions after server restart, retained history and idempotent/conflicting imports. Never approve real candidates as a smoke test.
4. Verify Vercel's bundle contains private validators, public assets contain no editorial records/keys, no `/api/publish` or `/api/import` route exists, WAF/Auth limits are configured, TLS/domain/origin match, and old/local publishing remains isolated.
5. Test pull/adopt/export and blocked revoked/stale publication against synthetic fixtures, then obtain explicit owner authorization before any real publication.

Current blockers: dedicated project provisioning/configuration, execution/advisory review of SQL, live staging verification, authorized deployment, and the project-specific DNS value. Existing KR evidence gaps and quality warnings still need human Scripture review; no content was changed or approved.

## File inventory

Created: `admin-review/package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `vercel.json`, `api/[action].js`, `server/{supabase,model,handler}.mjs`, `ui/session.js`, `build.mjs`, `fixtures.mjs`, `dev.mjs`, `test.mjs`, `sql/{setup,verify-rls}.sql`, this README; `scripts/hosted-review.mjs`, `scripts/hosted-review-client.mjs`.

Modified: `scripts/editorial-store.mjs` for online revalidation of hosted approvals, `LOCAL_QUESTION_REVIEW.md` for the hosted companion link. Generated `admin-review/public/` and `generated/` are ignored build artifacts. No game runtime, candidate source, public-game deployment config or existing local review UI was modified.

Official references consulted: [Supabase Auth server verification](https://supabase.com/docs/reference/javascript/auth-getuser), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [2026 changelog](https://supabase.com/changelog), [Vercel Node Functions](https://vercel.com/docs/functions/runtimes/node-js), [monorepos](https://vercel.com/docs/monorepos), [project-specific domain records](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
