# Voluntary R2G2 support

The reusable `dist/support.js` modal links to `https://cash.app/$rahjreed` and `https://cash.app/refer/BZFNTVD`. Both links use a new tab and `rel="noopener noreferrer"`. There are no payment APIs, tracking, databases, backend services or rewards. The referral wording is conditional and includes the requested eligibility/referral-reward disclosure. URLs are owner-supplied; recipient ownership and a particular visitor's bonus eligibility are not independently certified by the game.

Entry points: the title's secondary menu, existing pause menu, and a compact Game Over invitation. Ordinary level clears and questions contain no support prompts. Opening a native modal over Pause never calls Resume or restarts any timer/animation. Its capturing keyboard handler isolates P, answer shortcuts and the pause focus trap; native Tab/Shift+Tab works within the modal, and Escape closes only support. Closing restores focus to the opener. Clipboard failures expose the handle for manual copying.

There is **no final Kingdom victory screen** in the existing runtime. `GAME_PROGRESSION.md` explicitly defers Kingdom entry/post-entry behavior; the game continues beyond Level 700. `kingdomSupportThanks()` supplies a reusable thank-you/support invitation for the eventual finale, but is not mounted anywhere yet. No new ending, milestone trigger, save flag or ordinary-level prompt was invented.

Run `node scripts/test-support.mjs` for focused checks and `node scripts/build-site.mjs` for the full production validation. Historical audit hashes remain intact: the exact optional UI additions are reversed by `scripts/support-ui-revision.mjs` before checking pre-existing snapshots. The title's original artwork/start flow is checked after removing only those exact additions.

No changes to RahjReed.com, payment accounts, Vercel, DNS or deployments are part of this feature. Cash App handles its own sign-in, qualification and payment confirmation; the game never initiates a transfer.
