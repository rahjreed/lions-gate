// Read-only content/publication preflight. Never records approvals or publishes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {answerConflict} from '../dist/knowledge.js';
import {selectQuestions} from '../dist/engine.js';
import {answerRevealMarkup} from '../dist/answer-reveal.js';
import {mappedDifficulty} from './difficulty-map.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {loadCandidates,loadLedger} from './editorial-store.mjs';
import {assertEvidence,digest,assertCurrentApprovals} from './editorial-core.mjs';
import {publicationBatch} from './question-batch.mjs';
const root=new URL('../',import.meta.url),bytes=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await bytes(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const batch=await json('content/candidates/deep-torah-50.json'),audit=await json('content/deep-torah-50-validation.json'),proof=await json('content/deep-torah-50-evidence.json'),template=await json('content/deep-torah-50-review-template.json'),release=await json('content/deep-torah-publication/manifest.json');
const candidates=await loadCandidates(root),ledger=await loadLedger(root),peers=new Map(questions.map(q=>[q.id,q]));for(const {q}of candidates)if(!batch.some(b=>b.id===q.id)&&!peers.has(q.id))peers.set(q.id,q);
assert.equal(batch.length,50);assert.equal(questions.length,160);assert.equal(ledger.events.length,118);assert.equal(Object.keys(ledger.decisions).length,118);
assert.equal(sha(await bytes('content/candidates/deep-torah-50.json')),audit.candidateSha256);assert.equal(sha(await bytes('content/deep-torah-50-evidence.json')),audit.evidenceSha256);
assert.equal(release.phase,'prepared-only-awaiting-owner-authorization');assert.equal(release.preparedCount,50);assert.equal(release.approvedCount,0);assert.equal(release.publishedCount,0);
assert.equal(release.candidateSha256,audit.candidateSha256);assert.equal(release.evidenceSha256,audit.evidenceSha256);
assert.deepEqual(qualityReport(batch,[...peers.values()]),audit.quality);assert.deepEqual(audit.quality.errors,[]);assert.deepEqual(audit.quality.warnings,[]);assert.equal(audit.quality.publicationReady,false);
assert.equal(validateQuestions([...peers.values(),...batch],{allowCandidates:true}),true);
assert.throws(()=>publicationBatch(questions,batch),/review/i);assert.throws(()=>assertCurrentApprovals(batch,candidates,ledger,questions),/approval/i);
assert.equal(release.candidateInventoryCount,candidates.length);assert.equal(release.liveDigest,digest(questions));assert.equal(release.ledgerSha256,sha(await bytes('content/editorial/decisions.json')));
for(const {q}of candidates)assert.equal(release.candidateSources[q.id],digest(q),'Candidate inventory guard: '+q.id);
for(const [p,hash]of Object.entries(audit.preservedFiles))assert.equal(sha(await bytes(p)),hash,'Protected existing file: '+p);
const count=fn=>Object.fromEntries([...new Set(batch.map(fn))].sort().map(k=>[k,batch.filter(q=>fn(q)===k).length]));
assert.deepEqual(count(q=>q.knowledge.complexity),{'3':5,'4':14,'5':13,'6':11,'7':7});assert.deepEqual(count(q=>q.editorial.section),audit.sectionCounts);assert.deepEqual(Object.values(audit.sectionCounts).sort((a,b)=>a-b),[7,8,8,8,8,11]);
assert.deepEqual([0,1,2,3].map(i=>batch.filter(q=>q.answer===i).length),[13,13,12,12]);
assert.equal(Object.keys(proof.questions).length,50);assert.equal(Object.keys(proof.passages).length,119);assert.match(proof.status,/NOT independent human verification; NOT approval/);
const source=await bytes('.verification/launch/kjv-vpl/eng-kjv_vpl.txt').catch(e=>{if(e.code==='ENOENT')return null;throw e});
if(source)assert.equal(sha(source),proof.source.sha256);const lines=source?new Set(String(source).split(/\r?\n/)):null;
for(const q of batch){
 assert.match(q.id,/^deep-torah-[a-z]+(?:-[a-z]+)*$/);assert.deepEqual(q.review,{status:'candidate'});assert.ok(!questions.some(p=>p.id===q.id));assert.ok(!ledger.decisions[q.id]);assertEvidence(q);
 assert.equal(q.editorial.courseUnitId,'06');assert.equal(q.editorial.learningObjective,q.knowledge.learningObjective);assert.ok(q.explain.length<650,'Keep the normal reveal compact');
 const mapped=mappedDifficulty(q.knowledge.editorialDifficulty);assert.equal(mapped.complexity,q.knowledge.complexity);assert.equal(mapped.difficulty,q.difficulty);
 const e=proof.questions[q.id];assert.equal(e.questionSha256,sha(JSON.stringify(q)));assert.equal(e.independentHumanReview,'pending');assert.equal(e.approval,'not recorded');assert.equal(e.optionRationales.length,4);assert.ok(e.optionRationales.every(r=>r.length>20));assert.ok(e.difficultyRationale.length>40);
 const citations=[q.scripture,...q.supportingScriptures];assert.equal(citations.length,e.references.length);if(q.knowledge.complexity>=6)assert.ok(citations.length>=3);if(q.knowledge.complexity===7)assert.ok(citations.length>=4);
 for(const [i,s]of citations.entries()){
  const p=proof.passages[e.references[i]];assert.equal(s.book,p.book);assert.equal(s.chapter,p.chapter);assert.equal(s.verse,p.verse);assert.equal(s.endVerse,p.endVerse);assert.equal(s.excerpt,p.verses.map(v=>v.text).join(' '));
  assert.deepEqual(p.verses.map(v=>v.verse),Array.from({length:(s.endVerse??s.verse)-s.verse+1},(_,n)=>s.verse+n));assert.ok(p.context.length>=p.verses.length);assert.equal(p.context[0].verse,1);
  for(const v of p.verses)assert.deepEqual(v,p.context.find(c=>c.verse===v.verse));if(lines)for(const v of p.context)assert.ok(lines.has(`${p.sourceCode} ${p.chapter}:${v.verse} ${v.text}`));
 }
 assert.equal(template[q.id].reviewedBy,'');assert.ok(editorialChecks.every(k=>template[q.id].checks[k]===false));
 for(const correct of [true,false]){const html=answerRevealMarkup({q,last:{correct,earned:correct?100:0,choice:(q.answer+1)%4},streak:0});assert.ok(html.includes(q.scripture.url));assert.match(html,/data-action="next"/);assert.doesNotMatch(html,/SCRIPTURE LESSON|RELATED STUDY|LESSON OBJECTIVE/);}
}
// A soft thematic overlap is not a literal disclosure; report both honestly.
assert.ok(release.intentionalSemanticOverlaps.length>=6);for(const row of release.intentionalSemanticOverlaps){assert.ok(batch.some(q=>q.id===row.id));assert.ok(row.reason.length>40);assert.ok(row.related.every(id=>peers.has(id)||batch.some(q=>q.id===id)));}
for(let i=0;i<batch.length;i++)for(const p of [...peers.values(),...batch.slice(i+1)])assert.equal(answerConflict(batch[i],p),false);
for(const level of [1,5,75,150,300,450,700,10000]){const queue=selectQuestions([...questions,...batch],{level,history:{}},()=>.42);assert.equal(queue.length,10);assert.ok(queue.every(e=>questions.some(q=>q.id===e.id)),'No draft can fill an advanced-stage gap');}
console.log('PASS deep Torah: 50 unapproved drafts; 8/8/8/7/8/11 sections; complexity 5/14/13/11/7; 119 exact source ranges and full chapter context; 0 schema/duplicate/disclosure/quality warnings; source and ledger guards; compact reveal links; drafts blocked at all stages. AI findings are not independent human verification or difficulty calibration.');
