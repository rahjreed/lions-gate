# Facebook sharing and the R2G2 arcade

## Implemented locally

- Facebook links share https://lionsgate.callistadigital.com/challenge.html, never a direct gameplay launch and never a URL containing player data.
- This static HTML returns server-readable Open Graph metadata with an absolute HTTPS PNG URL and 1200×630 dimensions. Its primary action is PLAY AT RAHJREED.COM → https://rahjreed.com; gameplay is a secondary choice with no automatic redirect.
- The public cover card uses the supplied official artwork, preserved byte-for-byte as assets/share/kingdom-race-cover.png (SHA-256 6fa49b2d5d803d02e46d723128f4ac045beddb3b3cd2c103b6c9aafe882ed556). The original composition is fitted intact, with a gold frame and the exact two promotional messages. Akobi is not regenerated or altered.
- PREVIEW CARD composes a local 1200×630 PNG from the actual run/Hall record. It displays that record's arcade name, level and existing score as souls earned; there is no separate souls balance or reward conversion. Invalid/missing score or level data is rejected. DOWNLOAD CARD permits manual attachment; previewing/downloading never uploads or changes the record.
- Copy Challenge includes the actual arcade name, level, existing score, promotional lines, RahjReed.com first and the achievement landing page second. Clipboard denial retains manual copying.
- Real Hall records only; no sharing fictional demo results. The game adds no Facebook login, SDK, credentials or automatic posting. Facebook may require sign-in to finish posting on its own site.

## Remaining dependency: personalized Facebook previews

The current Vercel configuration serves static dist/ files and has no approved dynamic backend. Facebook therefore sees the shared promotional cover, NOT the local personalized canvas. Client-side metadata changes, fragments or score query parameters are not a solution.

Personalized previews require separately approved infrastructure: a public achievement URL returning server-rendered Open Graph metadata, a public absolute HTTPS image response containing the corresponding actual result, validation/escaping and consent/privacy rules, and a decision about signed payloads versus stored records. A claimed local score must not become a trusted leaderboard score. No server, database, Firebase resource, public score storage or cloud setting was added.

## Verification and release

Run node scripts/test-share-score.mjs and node scripts/test-achievement-card.mjs, or node scripts/build-site.mjs for the complete production validation. Local fixtures in tests are explicitly synthetic; public cover art contains no invented name or score.

After an authorized deployment, confirm the achievement URL and PNG return publicly without authentication, and inspect Facebook's actual preview using its Sharing Debugger. Neither this new route nor its metadata is live until deployment. Facebook crawler caching and physical Android/iOS sharing remain deployment/device checks.
