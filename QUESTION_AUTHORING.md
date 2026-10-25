# Scripture-only question policy

Research documents are private topic discovery aids, never answer authorities. Do not copy private links or document titles into the deployed bundle. Exclude all short stories, Myles Awakens, Becoming Solomon, and either spelling of Yahweh Strickster/Trickster. Enoch, Jubilees, Jasher, and additional Cepher writings are outside the collection.

Use the explicit 80-book allowlist in `dist/question-rules.js`: 39 OT, 27 NT, 14 traditional KJV Apocrypha. Baruch includes the Letter of Jeremiah; Song of the Three Holy Children includes the Prayer of Azariah. Alternate publisher labels must be deliberately normalized to this list, not added as extra books.

## Reusable record

Each question in `dist/questions.js` has a stable `id`, `topic`, standalone `q`, four distinct `options`, zero-based `answer`, explicit `correctAnswer`, short passage-based `explain`, and `scripture` containing `book`, positive `chapter` and `verse`, `translation: KJV`, a brief verbatim evidence `excerpt`, and a public passage `url`. Review metadata records status, review date, explicit-passage basis, rationale, and a content fingerprint.

## Required editorial workflow

1. Identify a topic from eligible research material; discard its interpretations as an answer source.
2. Open the actual KJV passage and surrounding context. Check book, chapter, verse, wording, subject, and scope. Verify any range and all distractors. Do not infer present-day obligations from an ancient command when the question only needs to test what that command says.
3. Write an independently answerable question. Avoid denominational numbering, doctrinal assumptions, popular traditions, and disputed interpretations. Rewrite disputed topics as explicit passage observations. Ensure exactly one option answers the question.
4. Store the exact citation, correct answer, concise explanation, and brief passage evidence. Public links must point to Scripture, never private research.
5. After reading and checking the passage, set review metadata and record `contentFingerprint(question)` as its fixed approval in `approvals`. Any substantive edit invalidates that approval and requires another passage review. Never regenerate approvals automatically in a build or deploy step.
6. Run `node scripts/validate-content.mjs`, check JavaScript syntax, and exercise the quiz before packaging. Validation runs again at module import and is a required packaging command.

Automated checks reject personal-document references, excluded content/books, missing citations, invalid answer mappings, missing review records, and stale approvals. They do not prove verse existence, quotation accuracy, absence of ambiguity, or theological accuracy. Fingerprints track edits; they are not cryptographic proof of review. Reading the cited passage is mandatory before publication.

## V1 audit — 2026-10-24

All 10 prior questions were audited. The Torah-book-order question and document-location questions were replaced with explicit passage trivia about Wisdom of Solomon 1:4, Ecclesiasticus 11:8, and Leviticus 23:6. Sabbath and parental honour questions now test Exodus wording without disputed commandment numbering. Five Proverbs questions were rewritten or retained only as direct passage questions, with private-document framing removed. All explanations were replaced with passage-based explanations, precise citations, evidence excerpts, and public Scripture links.

Passages reviewed independently in the KJV: Exodus 20:10, 20:12; Leviticus 23:6; Wisdom of Solomon 1:4; Ecclesiasticus 11:8; Proverbs 4:23, 3:5, 13:12, 10:8, 24:17. For each, the correct option and explanation directly restate the cited text. The two Apocrypha topics were identified in eligible precept research from the prior inventory. No fictional source was used.


## Arcade bank extension

Every record now also requires `category` and `difficulty` (1 foundation, 2 challenger, 3 context). Both are covered by the approval fingerprint. The bank has 30 reviewed records, 10 per tier; four are Tradition Traps. Range citations use `endVerse` and a matching chapter URL, and are rendered as a full range. Do not frame an absence claim as a claim about the entire Bible when only a specific passage was reviewed. For example, the wise-men count asks specifically about Matthew 2:1–12. Original question topics remain available; approved records are selected through spaced repetition rather than live generation. See ARCADE_UPGRADE.md for the expansion passage audit.


## Biblical Knowledge Engine — current workflow (2026-10-25)

The live bank has 42 preserved reviewed records; 50 new candidates are quarantined outside dist. The current batch, seven-stage metadata, extended fingerprints, independent review checklist and explicit publishing workflow are documented in [BIBLICAL_KNOWLEDGE_ENGINE.md](BIBLICAL_KNOWLEDGE_ENGINE.md). That workflow supersedes the earlier manual-approval instructions for newly imported batches. Existing fixed legacy approvals remain unchanged. Builds never approve content or publish candidates.
