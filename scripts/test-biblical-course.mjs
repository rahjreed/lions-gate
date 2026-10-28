import {expectedCourseRevision} from './course-revision.mjs';
// Draft-content verification. Does not approve, export, publish or change saves.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {validateQuestions,canon} from '../dist/question-rules.js';
import {selectQuestions} from '../dist/engine.js';
import {answerConflict} from '../dist/knowledge.js';
import {loadCandidates,loadLedger} from './editorial-store.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {mappedDifficulty,mappingVersion} from './difficulty-map.mjs';
import {publicationBatch} from './question-batch.mjs';
const root=new URL('../',import.meta.url),bytes=p=>readFile(new URL(p,root)),read=async p=>JSON.parse(await bytes(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const batch=await read('content/candidates/biblical-course-50.json'),audit=await read('content/biblical-course-50-validation.json'),evidence=await read('content/biblical-course-50-evidence.json'),template=await read('content/biblical-course-50-review-template.json');
const candidates=await loadCandidates(root),ledger=await loadLedger(root),peers=new Map(questions.filter(q=>!batch.some(b=>b.id===q.id)).map(q=>[q.id,q]));
for(const {q} of candidates)if(!batch.some(b=>b.id===q.id)&&!peers.has(q.id))peers.set(q.id,q);
assert.equal(batch.length,50);assert.equal(peers.size,192);assert.equal(candidates.length,200);assert.equal(new Set([...peers.keys(),...batch.map(q=>q.id)]).size,242);
assert.equal(questions.length,160);assert.equal(Object.keys(ledger.decisions).length,118);assert.equal(ledger.events.length,118);
assert.equal(sha(await bytes('content/candidates/biblical-course-50.json')),audit.candidateSha256);
assert.equal(sha(await bytes('content/biblical-course-50-evidence.json')),audit.evidenceSha256);
assert.equal(validateQuestions([...peers.values(),...batch],{allowCandidates:true}),true);
assert.deepEqual(qualityReport(batch,[...peers.values()]),audit.quality);assert.deepEqual(audit.quality.errors,[]);assert.equal(audit.quality.warnings.length,2);assert.equal(audit.quality.publicationReady,false);
assert.deepEqual(audit.unresolvedSourceRanges,[]);assert.equal(Object.keys(evidence.questions).length,50);assert.equal(Object.keys(evidence.passages).length,90);
assert.match(evidence.status,/NOT independent human verification/);assert.match(evidence.status,/NOT approval/);
assert.throws(()=>publicationBatch(questions,batch),/review/i);
for(let unit=1;unit<=10;unit++)assert.equal(batch.filter(q=>q.editorial.courseUnitId===String(unit).padStart(2,'0')).length,5);
const counts=fn=>Object.fromEntries([...new Set(batch.map(fn))].map(k=>[k,batch.filter(q=>fn(q)===k).length]));
assert.deepEqual(counts(q=>q.knowledge.complexity),{'1':3,'2':9,'3':13,'4':10,'5':8,'6':5,'7':2});
assert.deepEqual(counts(q=>q.knowledge.editorialDifficulty),audit.editorialDifficultyCounts);
for(const q of batch){
 assert.match(q.id,/^course-[a-z]+(?:-[a-z]+)*$/);assert.deepEqual(q.review,{status:'candidate'});assert.ok(ledger.decisions[q.id]);assert.ok(questions.some(p=>p.id===q.id));
 assert.ok(['general',...Array.from({length:18},(_,i)=>String(i+1).padStart(2,'0'))].includes(q.editorial.curriculumTopicId));
 assert.equal(q.knowledge.learningObjective,q.editorial.learningObjective);assert.ok(q.editorial.courseUnitTitle&&q.editorial.manualReviewRequired);assert.equal(q.knowledge.difficultyMapping,mappingVersion);
 const mapped=mappedDifficulty(q.knowledge.editorialDifficulty);assert.equal(q.difficulty,mapped.difficulty);assert.equal(q.knowledge.complexity,mapped.complexity);
 const proof=evidence.questions[q.id];assert.equal(sha(JSON.stringify(q)),proof.questionSha256);assert.equal(proof.independentHumanReview,'pending');assert.equal(proof.approval,'not recorded');
 assert.equal(proof.optionRationales.length,4);assert.ok(proof.optionRationales.every(r=>r.trim().length>20));assert.ok(proof.difficultyRationale.trim().length>20);
 const citations=[q.scripture,...q.supportingScriptures];assert.equal(citations.length,proof.references.length);
 if(q.knowledge.complexity>=6)assert.ok(citations.length>=3,'High ratings require the recorded cross-context reasoning, not relabeled recall');
 if(q.knowledge.complexity===7)assert.equal(citations.length,4);
 for(const [i,s]of citations.entries()){
  const p=evidence.passages[proof.references[i]];assert.ok(canon.includes(p.book));assert.equal(s.book,p.book);assert.equal(s.chapter,p.chapter);
  assert.deepEqual(p.verses.map(v=>v.verse),Array.from({length:(s.endVerse??s.verse)-s.verse+1},(_,n)=>s.verse+n));assert.equal(s.excerpt,p.verses.map(v=>v.text).join(' '));assert.ok(p.context.length>=p.verses.length);
 }
 const unchecked=template[q.id];assert.equal(unchecked.reviewedBy,'');assert.ok(editorialChecks.every(k=>unchecked.checks[k]===false));assert.deepEqual(unchecked.optionRationales,['','','','']);
}
for(const row of audit.intentionalSemanticOverlaps){assert.ok(batch.some(q=>q.id===row.id));assert.ok(row.related.every(id=>[...peers.keys(),...batch.map(q=>q.id)].includes(id)));}
// When the previously downloaded source is present, check the evidence against
// its independently pinned full-text hash as well as the candidate excerpts.
const source=await bytes('.verification/launch/kjv-vpl/eng-kjv_vpl.txt').catch(e=>{if(e.code==='ENOENT')return null;throw e});
if(source){
 assert.equal(sha(source),evidence.source.sha256);assert.equal(evidence.source.sha256,'fb7b8c10feb607c22b3461e837bfd267c09814f39ce23756a1928f7739a52b3c');
 const lines=new Set(String(source).split(/\r?\n/));
 for(const [ref,p]of Object.entries(evidence.passages)){
  const code=ref.match(/^([1-4]?[A-Z]+)/)[1];
  for(const v of p.context)assert.ok(lines.has(`${code} ${p.chapter}:${v.verse} ${v.text}`),'Source text mismatch: '+ref);
 }
}
const rest=batch.find(q=>q.id==='course-creation-sanctified-rest-reason');for(const id of ['sabbath-day','creation-rest'])assert.equal(answerConflict(rest,questions.find(q=>q.id===id)),true,'Existing runtime disclosure safeguard recognizes the two flagged pairs');
for(const level of [1,75,150,300,450,700,10000])assert.ok(selectQuestions([...questions,...batch],{level,history:{}},()=>.42).every(item=>questions.some(live=>live.id===item.id)),'Drafts cannot fill an advanced-stage shortage');
for(const [path,hash]of Object.entries(audit.preservedFiles)){if(path==='content/editorial/decisions.json')continue;assert.equal(sha(await bytes(path)),expectedCourseRevision(path,hash),'Preserve source or exact authorized revision: '+path);}
const syllabus=String(await bytes('BIBLICAL_COURSE_SYLLABUS.md'));assert.equal((syllabus.match(/^## Unit \d\d /gm)||[]).length,10);assert.match(syllabus,/not implemented/);
console.log('PASS Biblical course: 10 units × 5 drafts; 192 prior unique IDs preserved; 90 exact evidence ranges; 25 complexity 4–7 drafts; 2 disclosed reinforcement warnings; raw draft publication rejected; historical sources protected with exact authorized revisions. These checks do not confer Scripture approval or prove difficulty calibration.');
