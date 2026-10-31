# Protected-source hash portability

The production failure at `d19a196` was a checkout-format mismatch, not an engine
change. `dist/engine.js` was unchanged since `9b1ea9d` and unchanged by `d19a196`.
The banked-publication snapshot captured Windows mixed line endings. Git stores
LF text; Vercel checked that LF text against the Windows byte hash.

Engine historical hash: `903edbf74638a79213b6af9138cbb31860f39d064177512c794514cba344826e`.
Engine Git/LF hash: `5de2f3da581541fd0bda0a4214ee321cb18a7e5f31b806b771f8f5a9e76d375a`.
After CRLF-to-LF conversion, the working source and Git blob are identical.
Storage, combat, the initial candidate source batch, and the curriculum inventory's
live question module had the same historical line-ending issue.

`scripts/protected-text.mjs` converts CRLF to LF for comparison. For the five
historical Windows snapshots, the fixture records the exact old newline pattern
and LF digest. The helper checks the LF digest, reconstructs the historical
newline pattern, then verifies the **original** audit hash. Other text snapshots
continue to check their recorded LF hash. No original audit, question, evidence,
approval receipt, source hash or runtime file was rewritten. No trimming, JSON
reserialization, BOM stripping, or content-edit fallback is permitted.

The new regression test covers LF, CRLF and mixed checkouts and proves that code
edits, whitespace edits, extra newlines, BOMs, invalid UTF-8 and changed expected
hashes fail. It is included in the existing production build. Publication,
deep-Torah preservation, and curriculum source-inventory tests share the helper.
Semantic question digests and Scripture evidence verification remain unchanged.

A clean Git export with `git -c core.autocrlf=false archive` reproduced the exact
Vercel engine assertion before the fix. The same clean export plus the tooling
fix is used for the full production build. This tests Git/LF source on local
Node 24; it is not a claim that a remote Linux Vercel deployment was performed.
