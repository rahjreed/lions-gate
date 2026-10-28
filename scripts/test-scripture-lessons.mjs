import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {lessonFor} from '../dist/lessons.js';
import {courseLessons} from '../dist/course-lessons.js';
import {answerRevealMarkup} from '../dist/answer-reveal.js';
import {contentFingerprint,validateQuestions,prohibitedPersonalReferences} from '../dist/question-rules.js';
import {answerConflict,knowledgeFor,knowledgeStage} from '../dist/knowledge.js';
import {createRun,beginLevel,submit,advance,selectQuestions,validRun} from '../dist/engine.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {loadCandidates,loadLedger} from './editorial-store.mjs';
import {digest,assertCurrentApprovals} from './editorial-core.mjs';
import {publicationBatch} from './question-batch.mjs';
import {qualityReport} from './question-quality.mjs';
const read=async p=>readFile(new URL('../'+p,import.meta.url)),json=async p=>JSON.parse(await read(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const baseline=await json('content/course-publication/baseline.json'),batch=await json('content/reviewed/course-50-approved.json'),source=await json('content/candidates/biblical-course-50.json'),proof=await json('content/biblical-course-50-evidence.json'),review=await json('content/course-publication/lesson-review.json'),candidates=await loadCandidates(new URL('../',import.meta.url)),ledger=await loadLedger(new URL('../',import.meta.url));
assert.equal(questions.length,160);assert.equal(publishedQuestions.length,118);assert.equal(batch.length,50);validateQuestions(questions);
const original=baseline.originalLive.map(r=>{const q=questions.find(q=>q.id===r.id);assert.equal(digest(q),r.digest,'Original live record changed: '+r.id);return q});
assert.equal(original.length,110);assert.deepEqual(publishedQuestions.slice(-50),batch);assert.equal(new Set(questions.map(q=>q.id)).size,160);
assert.equal(ledger.events.length,118);assert.deepEqual(ledger.events.slice(0,68),baseline.originalLedger.events);
for(const [id,d]of Object.entries(baseline.originalLedger.decisions))assert.deepEqual(ledger.decisions[id],d);
for(const {q}of candidates)assert.equal(digest(q),baseline.candidateHashes[q.id],'Candidate source unchanged: '+q.id);
assert.equal(sha(await read('content/biblical-course-50-evidence.json')),baseline.sourceEvidenceHash);
assertCurrentApprovals(batch,candidates,ledger,original);assert.equal(publicationBatch(original,batch).length,50);assert.throws(()=>publicationBatch(questions,batch),/duplicate/i);assert.throws(()=>publicationBatch(original,source),/review/i);
for(const q of batch){assert.match(q.review.reviewedBy,/AI-assisted/);assert.match(q.review.rationale,/NOT independent human/);assert.equal(q.knowledge.complexity,source.find(s=>s.id===q.id).knowledge.complexity);assert.deepEqual(q.scripture,source.find(s=>s.id===q.id).scripture);assert.deepEqual(q.options,source.find(s=>s.id===q.id).options);}
const quality=qualityReport(batch,original);assert.deepEqual(quality.errors,[]);assert.equal(quality.warnings.length,2);for(const warning of quality.warnings)assert.ok(batch.find(q=>warning.startsWith(q.id)).review.resolvedWarnings.includes(warning));
const oldRun=createRun(original,'UNCHANGED SAVE',()=>.42),savedQueue=structuredClone(oldRun.queue),profile=emptyProfile(),storage={getItem(){return this.value},setItem(key,v){this.value=v}};
captureProgress(profile,oldRun);saveProfile(storage,profile);const restored=loadProfile(storage,questions).run;assert.deepEqual(restored.queue,savedQueue);assert.deepEqual(restored,oldRun);assert.ok(validRun(restored,questions));
assert.equal(Object.keys(courseLessons).length,160);assert.equal(sha(await read('dist/course-lessons.js')),review.moduleSha256);assert.equal(sha(await read('content/course-publication/lesson-drafts.json')),review.sourceSha256);assert.equal(sha(await read('content/course-publication/legacy-lesson-drafts.json')),review.legacySourceSha256);assert.equal(sha(await read('content/course-publication/legacy-lesson-evidence.json')),review.legacyEvidenceSha256);
let complete=0,fallback=0,withRelated=0;
for(const q of questions){
 const before=digest(q),lesson=lessonFor(q);assert.ok(lesson.title&&lesson.objective&&lesson.explanation);assert.equal(lesson.explanation,q.explain);assert.deepEqual(lesson.primary,q.scripture);assert.deepEqual(lesson.related,q.supportingScriptures||[]);assert.ok(!prohibitedPersonalReferences.test(JSON.stringify([lesson.title,lesson.context,lesson.objective])));
 if(lesson.fallback)fallback++;else{complete++;assert.equal(courseLessons[q.id].questionFingerprint,contentFingerprint(q));assert.ok(lesson.context);if(q.id.startsWith('course-'))assert.ok(lesson.courseUnitId&&lesson.courseUnitTitle);const words=(lesson.explanation+' '+lesson.context).split(/\s+/).length;assert.ok(words>=40,'Lesson needs meaningful explanation: '+q.id);if((q.knowledge?.complexity||q.difficulty)<=3)assert.ok(words<=110,'Keep foundation lessons concise: '+q.id);}
 if(lesson.related.length)withRelated++;
 const correct=answerRevealMarkup({q,last:{correct:true,earned:100},streak:1}),wrong=answerRevealMarkup({q,last:{correct:false,choice:(q.answer+1)%4},streak:0});
 const section=html=>html.match(/<div class="reveal-copy"[\s\S]*?<\/div>/)[0];assert.equal(section(correct),section(wrong));
 for(const html of [correct,wrong]){
  assert.doesNotMatch(html,/SCRIPTURE LESSON|LESSON OBJECTIVE|RELATED STUDY|IN CONTEXT|lesson-title|lesson-unit|lesson-passages|<details|<summary/);
  assert.match(html,/data-action="next"/);assert.ok(html.includes(q.scripture.url));assert.ok(html.includes(q.explain.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))));
 }
 assert.equal(digest(q),before);
}
assert.equal(complete,160);assert.equal(fallback,0);
const minimal={...structuredClone(questions[0]),id:'minimal-optional-profile'};delete minimal.knowledge;delete minimal.editorial;delete minimal.supportingScriptures;assert.equal(lessonFor(minimal).fallback,true);assert.ok(answerRevealMarkup({q:minimal,last:{correct:true,earned:0},streak:0}).includes(minimal.explain));
const changed=structuredClone(batch[0]);changed.explain='A changed explanation must not reuse stale expanded context.';assert.equal(lessonFor(changed).fallback,true);
const hostile={...minimal,topic:'<img src=x onerror=alert(1)>',explain:'<script>unsafe()</script>'};const safe=answerRevealMarkup({q:hostile,last:{correct:true,earned:0},streak:0});assert.ok(!safe.includes('<script>')&&!safe.includes('<img'));
// Exercise both directions of each warning with strong selection preference.
const rest='course-creation-sanctified-rest-reason',partners=['sabbath-day','creation-rest'];
for(const prefer of [rest,...partners])for(const level of [1,5,76,150,450,700]){
 const stage=knowledgeStage(level);if(knowledgeFor(questions.find(q=>q.id===prefer)).complexity>Math.ceil(level%5===0?stage.bossTarget:stage.target))continue;
 const history=Object.fromEntries(questions.map(q=>[q.id,{count:q.id===prefer?0:100,last:0,lastCorrect:true}]));
 const queue=selectQuestions(questions,{level,history,asked:1000},()=>0).map(e=>e.id);if(level===76)assert.ok(queue.includes(prefer),'Preferred real question is exercised: '+prefer);if(queue.includes(rest))assert.ok(partners.every(id=>!queue.includes(id)));
 const extension=selectQuestions(questions,{level,history,asked:1000},()=>.42,queue,queue).map(e=>questions.find(q=>q.id===e.id));
 for(const q of extension)for(const id of queue)if(id!==q.id)assert.equal(answerConflict(q,questions.find(q=>q.id===id)),false);
}
// Full extended regular/Gatekeeper battles retain a non-conflicting encounter.
for(const level of [1,5,700]){
 const r=createRun(questions,'LESSON BATTLE',()=>.42);r.level=level;r.completed=level-1;beginLevel(r,questions,()=>.42);
 for(let i=0;i<14&&r.status==='playing';i++){const q=questions.find(q=>q.id===r.queue[r.index].id);submit(r,questions,i<4?-1:q.answer);const snapshot=structuredClone(r);answerRevealMarkup({q,last:r.answers.at(-1),streak:r.streak});assert.deepEqual(r,snapshot,'Lesson rendering does not advance or mutate combat');advance(r,questions,()=>.42);assert.ok(validRun(r,questions));}
 assert.equal(r.status,'levelup');assert.equal(r.answers.length,14);for(const a of r.queue)for(const b of r.queue)if(a.id!==b.id)assert.equal(answerConflict(questions.find(q=>q.id===a.id),questions.find(q=>q.id===b.id)),false);
}
const seen=new Set(),history={};let asked=0;for(let level=1;level<=1000;level++)for(const item of selectQuestions(questions,{level,history,asked},()=>.42)){seen.add(item.id);history[item.id]={count:(history[item.id]?.count||0)+1,last:++asked,lastCorrect:true}}
assert.ok(batch.every(q=>seen.has(q.id)),'All 50 published additions are available to runtime progression');
console.log(`PASS preserved lesson data / compact reveals: 160 live; unchanged original 110; 50 current AI-attributed approvals; 160 retained expanded lessons / 0 live fallbacks; ${withRelated} with evidenced related passages; identical short correct/wrong explanations without lesson panels or extra clicks; source-bound context, stale fallback, escaping, immutable legacy saves, initial/extended disclosure guards, 14-answer battles and all 50 additions selected through Level 1000.`);
