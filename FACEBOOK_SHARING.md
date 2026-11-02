# Facebook sharing

This deployment is static (`vercel.json` → `dist/`); no server-rendered score routes or public score storage exist. SHARE ON FACEBOOK opens Facebook's web sharer with only the canonical public game URL. The game requires no Facebook login or SDK; Facebook may require sign-in on its own site to finish posting. No automatic posting occurs.

Copy Challenge includes the arcade nickname, the record/run's highest level reached, existing score labelled “Souls earned (score)”, challenge phrase and game URL. There is no separate souls balance in the game; sharing does not calculate or change rewards. Clipboard denial exposes a selectable read-only message for manual copying. Hall sharing is available for real local records, never fictional demo records.

Facebook will preview the public game's page, not a player-specific achievement. No personalized card was created: client-side metadata or query parameters cannot reliably provide crawler-readable personalized previews. No names or scores are sent by the Facebook link.

A future personalized card needs separately authorized backend work: a public achievement URL returning server-rendered Open Graph title/description/image metadata, an absolute HTTPS image URL returning a correctly sized card using approved Akobi artwork, and input/privacy/integrity controls. Public score storage, Firebase, authentication, dynamic image generation and deployment changes are outside this implementation. Approval would still only open Facebook's sharing UI, never post automatically. Validate a future deployed URL with Facebook's Sharing Debugger; crawler access and Facebook caching cannot be verified against localhost.

Run `node scripts/test-share-score.mjs` or the full production-equivalent `node scripts/build-site.mjs`. Historical publication snapshots remain intact: an exact reversible sharing-UI revision is checked before the existing collection/name audit chain. No gameplay changes are normalized away.
