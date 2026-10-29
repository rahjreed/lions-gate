// Read-only regression of this exact owner-authorized local release.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {answerRevealMarkup} from '../dist/answer-reveal.js';
import {createRun,selectQuestions,beginLevel,submit,advance,retryLevel,validRun} from '../dist/engine.js';
import {answerConflict,knowledgeFor} from '../dist/knowledge.js';
import {emptyProfile,saveProfile,loadProfile,captureProgress} from '../dist/storage.js';
import {loadCandidates,loadLedger} from './editorial-store.mjs';
import {assertCurrentApprovals,digest} from './editorial-core.mjs';
import {publicationBatch} from './question-batch.mjs';
import {bankedQuestions,bankedBaseline,authorizedPublished} from './banked-release-state.mjs';
const root=new URL('../',import.meta.url),bytes=p=>readFile(new URL(p,root)),sha=x=>createHash('sha256').update(x).digest('hex'),candidates=await loadCandidates(root),ledger=await loadLedger(root);
assert.equal(questions.length,260);assert.equal(new Set(questions.map(q=>q.id)).size,260);assert.equal(publishedQuestions.length,218);assert.deepEqual(publishedQuestions,authorizedPublished);validateQuestions(questions);
assert.equal(bankedQuestions.length,100);assert.deepEqual(bankedQuestions.map(q=>q.id),bankedBaseline.selectedIds);assert.equal(candidates.length,250);
for(const q of bankedBaseline.originalLive)assert.deepEqual(questions.find(p=>p.id===q.id),q,'Original live record unchanged: '+q.id);
for(const [id,d]of Object.entries(bankedBaseline.originalLedger.decisions))assert.deepEqual(ledger.decisions[id],d,'Prior attribution and decision unchanged: '+id);
assert.deepEqual(ledger.events.slice(0,118),bankedBaseline.originalLedger.events);assert.equal(ledger.events.length,218);assert.equal(Object.keys(ledger.decisions).length,218);
for(const{q}of candidates)assert.equal(digest(q),bankedBaseline.candidateSources[q.id]);
for(const[p,hash]of Object.entries(bankedBaseline.protectedHashes))assert.equal(sha(await bytes(p)),hash,'Unrelated runtime/source file unchanged: '+p);
assert.equal(bankedBaseline.held.length,32);assert.equal(candidates.filter(c=>!questions.some(q=>q.id===c.q.id)).length,32);
for(const h of bankedBaseline.held){assert.ok(h.reason&&h.authorizationDoesNotResolveConcern);assert.ok(!ledger.decisions[h.id]);assert.ok(!questions.some(q=>q.id===h.id));assert.equal(digest(candidates.find(c=>c.q.id===h.id).q),h.sourceDigest);}
assertCurrentApprovals(bankedQuestions,candidates,ledger,bankedBaseline.originalLive);assert.equal(publicationBatch(bankedBaseline.originalLive,bankedQuestions).length,100);
assert.throws(()=>publicationBatch(questions,bankedQuestions),/duplicate/,'Duplicate publication rejected');
for(const q of bankedQuestions){
 const d=ledger.decisions[q.id];assert.equal(d.action,'approve');assert.equal(d.revision,1);assert.equal(q.review.approvalReceipt,digest(d));assert.equal(q.review.sourceDigest,d.sourceDigest);assert.match(q.review.reviewedBy,/AI-assisted/);assert.match(q.review.rationale,/NOT independent human Scripture certification/);assert.match(q.review.rationale, /i authorize all banked questions/);assert.equal(q.review.checks.passages,true);assert.equal(q.review.optionRationales.length,4);
 const original=candidates.find(c=>c.q.id===q.id).q;assert.deepEqual(q.options,original.options);assert.equal(q.explain,original.explain);assert.equal(q.answer,original.answer);assert.deepEqual(q.scripture,original.scripture);assert.deepEqual(q.supportingScriptures,original.supportingScriptures);assert.deepEqual(q.knowledge,original.knowledge);
 for(const correct of [true,false]){const html=answerRevealMarkup({q,last:{correct,earned:correct?100:0,choice:(q.answer+1)%4},streak:0});assert.ok(html.includes(q.scripture.url));assert.match(html,/data-action="next"/);assert.doesNotMatch(html,/SCRIPTURE LESSON|LESSON OBJECTIVE|RELATED STUDY/);}
}
// A serialized in-progress queue from the 160-question game must survive intact.
const legacy=createRun(bankedBaseline.originalLive,'OLD SAVE',()=>.42),profile=emptyProfile(),storage={value:null,getItem(){return this.value},setItem(_,v){this.value=v}};captureProgress(profile,legacy);saveProfile(storage,profile);assert.deepEqual(loadProfile(storage,questions).run,legacy);assert.ok(validRun(legacy,questions));
for(const level of [1,5,75,300,450,700,10000]){
 const r=createRun(questions,'RELEASE',()=>.42);r.level=level;r.completed=level-1;beginLevel(r,questions,()=>.42);
 for(let i=0;i<10;i++){const q=questions.find(q=>q.id===r.queue[r.index].id);submit(r,questions,q.answer);advance(r,questions,()=>.42);}assert.equal(r.status,'levelup');assert.equal(r.completed,level);assert.ok(validRun(r,questions));
 const loss=createRun(questions,'RETRY',()=>.42);loss.level=level;loss.completed=level-1;beginLevel(loss,questions,()=>.42);for(let i=0;i<5;i++){submit(loss,questions,-1);advance(loss,questions,()=>.42);}assert.equal(loss.status,'gameover');assert.equal(retryLevel(loss,questions,()=>.42),true);assert.equal(loss.level,level);assert.equal(loss.lives,5);assert.ok(validRun(loss,questions));
 const queue=selectQuestions(questions,{level,history:{}},()=>.42).map(e=>questions.find(q=>q.id===e.id));for(let i=0;i<queue.length;i++)for(const p of queue.slice(i+1))assert.equal(answerConflict(queue[i],p),false);
}
const complexity={};for(const q of questions){const k=knowledgeFor(q).complexity;complexity[k]=(complexity[k]||0)+1;}
console.log('PASS banked release: exact authorized 100; 260 unique live; old 160 and 118 decisions preserved; 218 current receipts/events; 32 unchanged held; 250 source hashes, evidence, options and attribution protected; duplicate release rejected; compact reveals, old-save restore, Gatekeepers/Level 700/high-level victory and five-life retry valid. Complexity '+JSON.stringify(complexity));
