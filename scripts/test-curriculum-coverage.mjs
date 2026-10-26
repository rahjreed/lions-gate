import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {canon,chapterLimits} from '../dist/question-rules.js';
const root=new URL('../',import.meta.url),read=async path=>readFile(new URL(path,root),'utf8');
const tracker=JSON.parse(await read('content/curriculum-coverage.json')),catalog=JSON.parse(await read('content/curriculum-catalog.json'));
assert.equal(tracker.summary.liveReviewed,questions.length);assert.equal(tracker.summary.publishedAdditions,publishedQuestions.length);
const batches=[];for(const file of (await readdir(new URL('content/candidates/',root))).filter(f=>f.endsWith('.json')))batches.push(...JSON.parse(await read('content/candidates/'+file)));
assert.equal(tracker.summary.inventoryRecords,questions.length+batches.length);
assert.equal(tracker.summary.candidates,batches.filter(q=>['draft','candidate'].includes(q.review.status)&&!questions.some(live=>live.id===q.id)).length);
assert.equal(tracker.questionInventory.length,tracker.summary.inventoryRecords);
assert.equal(new Set(tracker.questionInventory.map(r=>r.recordKey)).size,tracker.questionInventory.length);
for(const [path,hash] of Object.entries(tracker.sourceHashes))assert.equal(createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'),hash,`${path} changed or inventory is stale`);
assert.equal(tracker.torahChapters.length,187);
for(const [book,count] of [['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34]])assert.deepEqual(tracker.torahChapters.filter(r=>r.book===book).map(r=>r.chapter),Array.from({length:count},(_,i)=>i+1));
assert.equal(tracker.categories.filter(c=>c.id!=='general').length,18);
assert.equal(tracker.appointedTimes.length,10);assert.ok(tracker.appointedTimes.every(t=>t.learningObjectives.length===6&&t.learningObjectives.every(o=>o.status==='planned-not-certified')));
const categoryIds=new Set(tracker.categories.map(c=>c.id)),questionIds=new Set([...questions,...batches].map(q=>q.id));
for(const row of tracker.questionInventory){
 assert.ok(questionIds.has(row.id));assert.ok(row.references.length>0);assert.ok(row.learningObjective&&row.commandmentOrTeaching);
 assert.ok(row.curriculumCategories.every(id=>categoryIds.has(id)));assert.ok(row.relatedQuestionIds.every(id=>questionIds.has(id)));
 const d=row.difficultyProgression;assert.ok(d.editorialRating1to10===null||Number.isInteger(d.editorialRating1to10)&&d.editorialRating1to10>=1&&d.editorialRating1to10<=10);
 assert.ok([1,2,3].includes(d.runtimeDisplay));assert.ok(d.runtimeComplexity>=1&&d.runtimeComplexity<=7);
 for(const r of row.references){assert.ok(canon.includes(r.book));assert.ok(r.chapter>=1&&r.chapter<=chapterLimits[r.book]);assert.ok(r.verse>0);if(r.endVerse)assert.ok(r.endVerse>=r.verse)}
}
assert.equal(tracker.summary.manualCatalogEntries,catalog.entries.length);assert.deepEqual(tracker.manualCatalog,catalog);
for(const e of catalog.entries){
 assert.ok(e.id&&canon.includes(e.book)&&e.chapter>=1&&e.chapter<=chapterLimits[e.book]&&e.verse>=1);
 assert.ok(e.teaching&&e.learningObjective&&e.curriculumCategories.every(id=>categoryIds.has(id)));
 assert.ok(e.difficultyProgression.every(n=>Number.isInteger(n)&&n>=1&&n<=10));assert.ok(e.relatedQuestionIds.every(id=>questionIds.has(id)));
 assert.ok(Array.isArray(e.uncoveredLearningObjectives)&&['planned','in-review','reviewed'].includes(e.reviewStatus));
 if(e.reviewStatus==='reviewed')assert.ok(e.reviewedBy&&/^\d{4}-\d{2}-\d{2}$/.test(e.reviewedOn));
}
if(!catalog.entries.length)assert.ok(tracker.torahChapters.every(c=>c.reviewStatus==='chapter-not-catalogued'));
assert.equal(tracker.summary.chapterReviews,catalog.chapterReviews.length);
const withQuestions=tracker.torahChapters.filter(c=>c.existingRelatedQuestions.length).length;
console.log(`PASS curriculum: ${tracker.summary.inventoryRecords} existing records; ${tracker.summary.liveReviewed} live, ${tracker.summary.candidates} unpublished candidates; 18 topics + foundations; 187 Torah chapters (${withQuestions} with question references, none thereby certified); 10 appointed-time plans; exact citations, source hashes, null unknown ratings and persistent manual catalog.`);
