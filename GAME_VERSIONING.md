# Visible game version

The bottom-screen label and How to Play share `dist/release.js`, generated from `game-release.json`. This feature starts at **1.1**; previous development changes are not retroactively counted.

Run the usual `npm run build` (or `node scripts/build-site.mjs`) after completing an update. A successful build with changed production files advances the update counter once: 1.2, 1.3, … 1.28, … 1.100, 1.101. Rebuilding unchanged game files keeps the same number. Changing only documentation, editorial drafts or tests does not advance the game version. Multiple edits included in one successful build count as one update; separate changed successful builds count separately.

The build excludes generated release metadata and the service worker from its content comparison. It writes the durable release record only after all checks pass. A failed build does not consume a version number. Do not manually edit `dist/release.js` or reset `game-release.json`; retain both with each release so future local and deployment builds retain the same counter. Building an unchanged release on Vercel does not advance it again.

This is a display/release version only. It does not change save-format version 3, package semver, ranks or gameplay. Players cannot increment it by opening or refreshing the game. Offline installations keep the version of their cached game until the existing safe update flow installs a newer shell.
