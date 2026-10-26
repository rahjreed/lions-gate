# Targeted candidate choice revisions

21 incorrect choices changed across seven records. All 50 remain candidates, not approved or published. Every correct answer, question stem, citation, explanation, difficulty, concept and other field is unchanged. The original editorial source and unchecked review template are preserved.

## KR-105

Correct C remains: **He came not to destroy but to fulfill.**

| Choice | Before | After |
| --- | --- | --- |
| A | He came to destroy the Law. | He came to interpret the Law, but not to fulfill the Prophets. |
| B | He came to replace the Prophets with new traditions. | He came to fulfill the Prophets, but to set aside the Law. |
| D | The Law had never been authoritative. | He came to preserve the Law, but to set aside the Prophets. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Matthew-Chapter-5/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-109

Correct B remains: **Faith establishes the law.**

| Choice | Before | After |
| --- | --- | --- |
| A | Faith makes the law unnecessary. | Faith makes the law void. |
| C | Faith replaces every commandment with tradition. | Faith establishes the works of the law as the basis of justification. |
| D | The law was never given by God. | Faith establishes separate ways of justification for Jews and Gentiles. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Romans-Chapter-3/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-115

Correct A remains: **Acts of mercy and doing good are consistent with the Sabbath.**

| Choice | Before | After |
| --- | --- | --- |
| B | Human suffering must always be ignored on the Sabbath. | Merciful acts should be postponed until the Sabbath has ended. |
| C | The Sabbath was originally established for wrongdoing. | Helping an animal in distress is lawful, but healing a person must wait. |
| D | Doing good is forbidden unless performed by a priest. | Healing on the Sabbath requires prior permission from the synagogue rulers. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Matthew-Chapter-12/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-130

Correct B remains: **He will bring them to His holy mountain and make them joyful in His house of prayer.**

| Choice | Before | After |
| --- | --- | --- |
| A | Their worship must always be rejected because of their ancestry. | He will give them a separate house of prayer apart from the worship of Israel. |
| C | They must establish separate gods in their own lands. | He will receive their service but require their offerings to remain outside His altar. |
| D | They may never participate in worship. | He will bring them to His mountain after they have first joined Levi's priestly family. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Isaiah-Chapter-56/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-133

Correct C remains: **Such marriages could turn Israel's children away from following Yah to serve other gods.**

| Choice | Before | After |
| --- | --- | --- |
| A | Those nations spoke different languages. | Such marriages could weaken Israel's ability to defend the land against surrounding nations. |
| B | Their clothing was different. | Such marriages could transfer Israel's tribal inheritances into the possession of other nations. |
| D | Their lands were too far from Jerusalem. | Such marriages could place Israel under the tribute obligations imposed by neighboring kings. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Deuteronomy-Chapter-7/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-136

Correct C remains: **Her first husband may not take her again as his wife.**

| Choice | Before | After |
| --- | --- | --- |
| A | She may never own land. | She may not marry outside her father's tribe after the second marriage ends. |
| B | She may never return to her relatives. | She may not enter a third marriage after receiving a second bill of divorcement. |
| D | She must leave the land of Israel permanently. | She may not marry outside the second husband's family if he has died. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Deuteronomy-Chapter-24/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

## KR-141

Correct B remains: **The life of the flesh is in the blood, which Yah designated for atonement upon the altar.**

| Choice | Before | After |
| --- | --- | --- |
| A | Blood was reserved exclusively for military leaders. | Blood is reserved as food for the priests who minister at the altar on Israel's behalf. |
| C | Blood was never used in any sacrificial practice. | Blood becomes permitted food once the animal's prescribed offering has been presented. |
| D | Blood was considered valuable only because of its color. | Blood is withheld from the stranger but permitted as food to those born within Israel. |

Draft distractors were compared with the [KJV passage](https://www.kingjamesbibleonline.org/Leviticus-Chapter-17/), using the biblical text rather than the page's commentary. This is a targeted editorial check, not final review approval.

KR-133 choice lengths are now A: 92, B: 96, C: 88, D: 93 characters; correct C is unchanged. The alternatives distinguish the expressly stated worship concern from military, inheritance and tribute concerns. No intended teaching changed.

## Remaining warnings

0 schema/quality errors; 18 current warnings, down from 25: six answer-phrase conflicts, eleven shared-concept entries (including reciprocal entries), and the KR-106 false positive matching `never` inside `whenever`. All seven requested warning removals are due to choice changes; no checker rules or warnings were suppressed. All repeated-concept records remain.

- kr-101 / receive-commandments: possible answer disclosure; do not co-select
- kr-101 / love-commandments: possible answer disclosure; do not co-select
- kr-101 / kr-107: shared concept; check repetition
- kr-101 / kr-110: shared concept; check repetition
- kr-102 / receive-commandments: possible answer disclosure; do not co-select
- kr-103 / kr-126: shared concept; check repetition
- kr-106: check absolute or shortcut distractors
- kr-107 / kr-101: shared concept; check repetition
- kr-107 / kr-110: shared concept; check repetition
- kr-110 / receive-commandments: possible answer disclosure; do not co-select
- kr-110 / kr-101: shared concept; check repetition
- kr-110 / kr-107: shared concept; check repetition
- kr-119 / kr-120: shared concept; check repetition
- kr-120 / kr-119: shared concept; check repetition
- kr-126 / receive-commandments: possible answer disclosure; do not co-select
- kr-126 / kr-103: shared concept; check repetition
- kr-146 / bke-neighbor-love: possible answer disclosure; do not co-select
- kr-147 / bke-mercy-hosea: shared concept; check repetition

## Selection coverage — inspection only

`dist/question-selection.js` filters out unverified or stale-fingerprint records before selection. Its local `conflict` predicate prevents identical normalized stems or a normalized correct answer of at least 12 characters appearing verbatim in another stem. This is a hard exclusion within each ten-question level, not throughout an entire multi-level run. The `cost` calculation adds 5 per already-selected matching concept; that is a soft preference, not a prohibition. Categories, exposure history and recent/retry avoidance are also preferences. No selection code changed.

| Flagged pair (reciprocal entries combined) | Hard exclusion | Shared-concept penalty |
| --- | --- | --- |
| kr-101 / receive-commandments | Yes | No |
| kr-101 / love-commandments | Yes | No |
| kr-101 / kr-107 | No | Yes |
| kr-101 / kr-110 | No | Yes |
| kr-102 / receive-commandments | Yes | No |
| kr-103 / kr-126 | No | Yes |
| kr-107 / kr-110 | No | Yes |
| kr-110 / receive-commandments | Yes | No |
| kr-119 / kr-120 | No | Yes |
| kr-126 / receive-commandments | Yes | No |
| kr-146 / bke-neighbor-love | Yes | No |
| kr-147 / bke-mercy-hosea | No | Yes |

Consequences: the six reported answer-disclosure pairs are hard-blocked, including the five generic-word alerts. All six distinct shared-concept pairs receive the soft penalty only. In particular, `kr-147 / bke-mercy-hosea` is not hard-blocked: the answer `Hosea` is shorter than 12 characters, although the earlier question names him. `kr-103 / kr-126` also remains a possible semantic disclosure because the wording is paraphrased. Both require manual editorial consideration; no automatic guarantee of separation is claimed.

## Verification

- Dedicated batch regression: PASS; only the 21 documented incorrect choices differ from the original import, all protected fields are unchanged, 50 candidates remain, publication/unchecked review is rejected, and all 96 pre-existing production/earlier-candidate files retain their original hashes.
- Quality checker and candidate schema validation: PASS, 0 errors / 18 warnings.
- Knowledge/CLI suite: PASS, including draft exclusion, selection, retry, old saves and publication gating.
- Stock `question-batch.mjs validate` command: PASS, 0 errors / 16 warnings against the live bank only. The comprehensive stored report includes the 50 earlier candidates too, adding the neighbor-love disclosure and mercy/Hosea concept warnings for 18 total.
- Full production build and all 17 configured validation/test scripts: PASS; 95 production files / 90 references checked; offline revision remains `a6bb600f4173e3f5f7e5`.
- No gameplay selection logic, live questions, original source or unchecked review template changed.
- No candidates approved or published. No commit, push or deployment.
