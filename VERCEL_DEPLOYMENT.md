# Deploy the existing static game to Vercel

## Why the reported build failed

The repository root for this game contains `dist/index.html`, the game modules,
and checked-in pixel artwork. It is a static browser application, not a Vite
application. Before this fix it had no package manifest, dependency lockfile,
Vite configuration, or Vercel configuration. A deployment attempting `vite build`
there has no Vite executable to run. Adding Vite is unnecessary and would also
require changing the game's entry/output layout.

The separate outer local `lions-gate` directory contains an older React/Vite
starter. Do not deploy that starter or copy its configuration into this game.
The Git remote for this inner repository is
`https://github.com/rahjreed/lions-gate.git`; its own repository root is the root
to use on GitHub/Vercel, regardless of its nested location on this computer.

The failed deployment's full logs and actual dashboard overrides could not be
read in this session: the connected Vercel tools returned unavailable and no
Vercel CLI/project link was installed. The reported error proves that `vite
build` was invoked without a Vite executable; which dashboard override selected
that command remains unverified.

## Committed configuration

`vercel.json` selects the **Other** framework (`framework: null`), skips dependency
installation (`installCommand: ""`), runs `node scripts/build-site.mjs`, and serves
only `dist`. These per-deployment values override the corresponding project build
settings. Root Directory must still point to the correct repository root.

`package.json` supplies an optional `npm run build` command and declares Node
24.x. There are no runtime or development npm dependencies. The version-3
`package-lock.json` records that empty dependency graph. There is no `.npmrc`
override and no install step that could omit a needed build tool. Python/Pillow
are used only to author checked-in sprites and are not required on Vercel.

Run from this inner repository:

```sh
node scripts/build-site.mjs
# Equivalent on a standard Node/npm installation:
npm run build
```

The production build checks HTML/CSS/module references, all generated rank and
journey asset URLs, JavaScript syntax, and the seven game test suites. It validates
the ready-to-serve `dist` directory in place, without deleting or regenerating it.

## Exact settings for the EXISTING Vercel project

After pushing the fix, open **Settings → Build and Deployment**:

| Setting | Required value |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | Repository root: leave empty / `.`; not `dist`, and not the local `sites/lions-gate-sword-sharpener` path |
| Build Command | `node scripts/build-site.mjs` |
| Output Directory | `dist` |
| Install Command | Override enabled with an **empty** value (skip installation) |
| Node.js Version | **24.x** |

Check **Settings → Git** shows the existing `rahjreed/lions-gate` connection and
the intended production branch (`main` in this local checkout). Do not create
another Vercel project or repository. The file-based build settings above should
apply automatically when the new commit is deployed; clearing a stale dashboard
`vite build` override also keeps the UI consistent.

Push the verified local commit from this inner repository (`git push origin main`).
Use the resulting Git deployment, or deploy the latest commit in the existing
project. Redeploying the old failed commit will not include this fix. If manually
redeploying the new commit, turn **Use existing Build Cache** off for that retry.
The log should show the static production build and its seven PASS results,
followed by Vercel serving `dist`. If the log still invokes Vite, verify the
deployment's commit and Root Directory before changing dependencies.

## Preservation and limitations

This fix changes deployment tooling only. All files under `dist`, including
Judah's action sheets, journeys, Scripture questions, scoring, and storage code,
are untouched. Saves remain browser-local and tied to the website origin; a
different Vercel domain does not share local storage with the Sites domain.

Local validation does not establish that a remote deployment succeeded. A new
Vercel deployment must still reach Ready after the commit is pushed.

Official references: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build),
[vercel.json overrides](https://vercel.com/docs/project-configuration/vercel-json),
[supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
