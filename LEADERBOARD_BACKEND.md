# Activating the online Hall of Masters

This project has no backend. The online demo is fictional and local records are explicitly device-only. Do not upload browser totals as trusted scores.

## Future service contract

- `POST /runs`: authenticated account, sanitized nickname, server-issued run ID, content-bank version, server seed and authoritative lives/score/level state. Rate-limit creation and bind the run to the account.
- `GET /runs/:id/question`: server selects an eligible verified question, shuffled choices and a signed/opaque question-instance ID. Do not send answer keys, correctness flags, or approval data before submission.
- `POST /runs/:id/answer`: accept only instance ID, chosen option ID and unique submission ID. Verify run ownership, monotonic question sequence, unanswered state, allowed power usage, and server deadline in one database transaction. Calculate correctness, lives, streak, bonus and score exclusively on the server. Reject replay, duplicate or out-of-order submissions. Return the Scripture explanation only after acceptance.
- Pause/resume must have server-issued state and rate-limited deadlines. Never trust elapsed times from a client. Decide a published competition policy for pauses, content lookup, disconnections, and accessibility before launching ranked play.
- `POST /runs/:id/finish`: finalize once and insert a server-derived leaderboard result. Do not accept a client-supplied score or level. Keep an auditable answer-event ledger, versioned rules, and idempotency constraints.
- `GET /leaderboards?window=all|week&cursor=...`: stable ordering by server score descending, completed levels descending, finish timestamp ascending, then run ID. Weekly window starts Monday 00:00 UTC. Add separate highest-level and highest-degree views using the same validated records.

## Storage and security

Tables: users, nickname/moderation state, runs, question_instances, answer_events, leaderboard_results, achievement_awards. Enforce unique answer instance and finish constraints, server-only writes for score fields, per-account run ownership, authentication, request rate limits, input bounds, and appropriate CSRF/session protections. Treat local records only as unverified personal history; do not migrate them into ranked results.

Extract shared rank/scoring rules into a server-safe module, but keep the approved answer bank off the ranked client. Future account achievements should be awarded idempotently by validated server events. A multiplayer match service can later consume the same run/question-instance events rather than trusting client messages.

Provisioning, authentication, secure server storage, score-validation endpoints, and real cross-device competition remain required before the global leaderboard can be called live.
