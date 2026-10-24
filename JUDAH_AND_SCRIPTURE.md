# Judah and Scripture update

Judah is an original, code-drawn pixel-art Black man with brown skin and shoulder-length dreadlocks. He appears on the title stage, the gameplay transition scene with restrained correct/miss reactions, level results and promotions, and the Armory progression area. His clothing follows the existing earned-rank thresholds: simple Novice tunic, Student sash, Scholar robe/book, Scribe long robe, Master ivory clothing and purple/gold mantle. Master degrees appear in captions and add up to eight embroidered marks. Locked Armory outfits are clearly previews. He never supplies answers or represents a biblical character.

The bank contains 42 fixed passage-reviewed records, 14 per difficulty. Existing IDs and version-3 saves remain compatible. Each record includes a prompt, four distinct options, correct index and matching answer, exact KJV citation, public passage link, short evidence excerpt, explanation, category/topic, difficulty, tags, nullable trapType, contextual correction, and a dated review with a fixed content fingerprint.

Selection targets seven focus and three general questions per level. Focus tags cover commandments, Torah, Sabbath, feasts, clean/unclean, obedience, Yeshua in context, Paul in context, and Scripture/tradition. Two focus slots seek traps normally; Gatekeeper rounds seek all three types. Insufficient eligible types use available approved questions, never invent questions. Spaced repetition operates within these buckets. The finite pool repeats and difficulty plateaus at tier three.

Tradition Traps distinguish familiar assumptions from explicit wording. Context Traps retain the stated controversy and surrounding argument. Misquote Traps test the actual wording and reject reversals or detached quotations. Matthew 15 questions identify handwashing, the heart, and the honour-parents example; they do not claim to settle every interpretation of dietary law. Romans 3 and 6 questions test Paul's explicit answers rather than infer an entire doctrinal system.

New passage checks: Exodus 20:9–10; Leviticus 11:3–9; Deuteronomy 6:4–9; Matthew 15:1–20; John 14:12–18; Romans 3:28–31 and 6:12–16; 1 Corinthians 7:17–20; James 1:19–25. Individual records link directly to the relevant KJV passage. Prior 30 questions retain their reviewed answers and references.

## Editorial admission workflow

1. Draft outside the published bank with `review.status: 'draft'`. Use the record fields above. Research may suggest a topic but is never the answer authority.
2. Open the actual cited passage and its surrounding argument in the traditional 80-book KJV scope. Check the answer, all distractors, excerpt, explanation, tags, and trap correction. Rewrite disputed conclusions into explicit-text questions. Independently review additions before publishing; citations alone do not prove accuracy.
3. Record reviewer rationale and date, set status to verified, and deliberately renew that record's fixed fingerprint only after review. Fingerprints detect accidental edits; they are not a security signature or proof of theology.
4. Run content validation and the engine/focus tests. Unverified or changed records are rejected from publication and excluded from selection. Never add approval generation to a build or let AI append directly to the bank.

No live AI generation or document fetching runs in gameplay. The canon allowlist excludes additional Cepher writings; personal references and excluded fictional works are rejected, including in trap corrections and tags. Manual editorial expansion is still needed for breadth across all 80 books, more feast-day questions, balanced topic coverage within the focus pool, and more varied traps. The engine weights the focus group as a whole, not each individual topic equally.
