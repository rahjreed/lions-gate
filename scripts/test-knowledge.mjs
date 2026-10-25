import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {questions} from '../dist/questions.js';
import {knowledgeStage,knowledgeFor,knowledgeCategories,legacyKnowledge,answerConflict} from '../dist/knowledge.js';
import {selectQuestions,createRun,submit,advance,retryLevel,validRun,levelConfig} from '../dist/engine.js';
import {contentFingerprint,validateQuestions,chapterLimits} from '../dist/question-rules.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {reviewBatch,publicationBatch} from './question-batch.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';

assert.equal(Object.keys(legacyKnowledge).length,42);assert.equal(knowledgeCategories.length,7);assert.equal(Object.keys(chapterLimits).length,80);
let previous=0;
for(let level=1;level<=10000;level++){const k=knowledgeStage(level);assert.ok(k.target>=previous&&k.target<=7);previous=k.target;assert.ok(k.bossTarget>=k.target);assert.ok(k.position>=1&&k.position<=75)}
for(const [level,stage,position] of [[1,1,1],[75,1,75],[76,2,1],[150,2,75],[151,3,1],[225,3,75],[226,4,1],[300,4,75],[301,5,1],[375,5,75],[376,6,1],[450,6,75],[451,7,1],[525,7,75],[526,7,75]])assert.deepEqual([knowledgeStage(level).stage,knowledgeStage(level).position],[stage,position]);
assert.equal(knowledgeStage(Number.MAX_SAFE_INTEGER).target,7);
// Synthetic records exercise capacity and scheduling; they are never published.
const checks=Object.fromEntries(editorialChecks.map(k=>[k,true]));
const fixture=(i,tier=1)=>{
 const q=structuredClone(questions[i%questions.length]);q.id=`fixture-${i}`;q.q=`Fixture item ${i}: choose the response for this test?`;q.trapType=null;q.trap=null;
 q.knowledge={category:knowledgeCategories[i%7].id,complexity:tier,concept:`test-concept-${i%100}`,mode:'explicit'};
 q.review={status:'verified',basis:'explicit-passage',reviewedBy:'Synthetic test fixture only',reviewedOn:'2026-10-25',rationale:'Test fixture, not approved educational content.',checks,optionRationales:['Fixture A','Fixture B','Fixture C','Fixture D']};q.review.contentFingerprint=contentFingerprint(q);return q;
};
const large=Array.from({length:1000},(_,i)=>fixture(i,1+Math.floor(i/7)%7));
const mean=queue=>queue.reduce((sum,e)=>sum+knowledgeFor(large.find(q=>q.id===e.id)).complexity,0)/queue.length;
const levels=[1,38,76,151,226,301,376,451,525,10001],means=levels.map(level=>mean(selectQuestions(large,{level,history:{}},()=>.42)));
for(let i=1;i<means.length;i++)assert.ok(means[i]>=means[i-1],`Difficulty regression: ${means}`);
assert.ok(means.at(-1)>=6&&means[0]===1);
const started=performance.now();const queue=selectQuestions(large,{level:451,history:{}});const elapsed=performance.now()-started;
assert.equal(queue.length,10);assert.equal(new Set(queue.map(q=>q.id)).size,10);assert.ok(new Set(queue.map(e=>knowledgeFor(large.find(q=>q.id===e.id)).category)).size>=4);
assert.ok(elapsed<3000,`1000-record selection took ${elapsed}ms`);
const at=101,history=Object.fromEntries(large.map(q=>[q.id,{count:1,last:0,lastCorrect:true,misses:0}]));
const old=queue.map(e=>e.id);old.forEach((id,i)=>history[id]={count:1,last:at-i,lastCorrect:false,misses:1});
const fresh=selectQuestions(large,{level:451,asked:at,history},()=>.42,old);assert.ok(fresh.every(e=>!old.includes(e.id)),'Avoid a retry queue when alternatives exist');
const uniform=Array.from({length:100},(_,i)=>fixture(i,2)),h=Object.fromEntries(uniform.map(q=>[q.id,{count:1,last:0,lastCorrect:true,misses:0}]));
h[uniform[0].id].lastCorrect=false;h[uniform[0].id].misses=1;
assert.ok(selectQuestions(uniform,{level:151,asked:100,history:h},()=>.42).some(q=>q.id===uniform[0].id),'A missed item can return after a delay');
h[uniform[0].id].last=100;assert.ok(selectQuestions(uniform,{level:151,asked:100,history:h},()=>.42).every(q=>q.id!==uniform[0].id),'No immediate reinforcement when alternatives exist');
const run=createRun(questions);submit(run,questions,-1);assert.equal(run.history[run.queue[0].id].lastCorrect,false);advance(run,questions);
const profile=emptyProfile();captureProgress(profile,run);const storage={getItem(){return this.data},setItem(k,v){this.data=v}};saveProfile(storage,profile);assert.deepEqual(loadProfile(storage,questions).run,run);
const legacy=structuredClone(run);Object.values(legacy.history).forEach(h=>{delete h.misses;delete h.lastCorrect});assert.ok(validRun(legacy,questions));
const savedQueue=structuredClone(run.queue);saveProfile(storage,profile);assert.deepEqual(loadProfile(storage,questions).run.queue,savedQueue,'Restoring never reselects saved questions');
for(const level of [5,75,150,450,10000]){const selected=selectQuestions(questions,{level,history:{}}).map(e=>questions.find(q=>q.id===e.id));assert.equal(selected.length,10);assert.ok(selected.some(q=>q.trapType==='context'));assert.ok(selected.some(q=>q.trapType==='misquote'))}
const candidates=JSON.parse(await readFile(new URL('../content/candidates/initial-50.json',import.meta.url),'utf8'));
assert.equal(candidates.length,50);assert.ok(candidates.every(q=>q.review.status==='candidate'));assert.equal(new Set(candidates.map(q=>q.knowledge.category)).size,7);assert.ok(candidates.some(q=>q.scripture.book==='Ecclesiasticus'));
const report=qualityReport(candidates,questions);assert.deepEqual(report.errors,[]);assert.equal(report.publicationReady,false);
assert.equal(validateQuestions(candidates,{allowCandidates:true}),true);assert.throws(()=>validateQuestions(candidates),/review/i);
assert.ok(selectQuestions([...questions,...candidates],{level:525,history:{}}).every(e=>!e.id.startsWith('bke-')));
assert.throws(()=>publicationBatch(questions,candidates),/review/i);assert.throws(()=>reviewBatch(candidates,{[candidates[0].id]:{reviewedBy:'Someone'}}),/incomplete/);
const one=candidates[0],evidence={[one.id]:{reviewedBy:'TEST ONLY',reviewedOn:'2026-10-25',rationale:'Fixture review.',checks,optionRationales:['Test A','Test B','Test C','Test D'],resolvedWarnings:[]}};
const reviewed=reviewBatch([one],evidence);assert.equal(publicationBatch(questions,reviewed).length,1);
const changed=structuredClone(reviewed);changed[0].knowledge.complexity++;assert.throws(()=>publicationBatch(questions,changed),/Content changed/);
const malformed=structuredClone(one);malformed.scripture.chapter=999;assert.throws(()=>validateQuestions([malformed],{allowCandidates:true}),/bounds/);
const wrongBook=structuredClone(one);wrongBook.scripture.book='Jubilees';assert.throws(()=>validateQuestions([wrongBook],{allowCandidates:true}),/Excluded|citation/);
const duplicate=structuredClone(one);duplicate.id+='-copy';assert.ok(qualityReport([one,duplicate],questions).errors.some(e=>/Duplicate|duplicate/.test(e)));
const leaked={...one,id:'leak',q:`Which statement concerns ${candidates[2].correctAnswer}?`};assert.ok(answerConflict(leaked,candidates[2]));assert.ok(qualityReport([leaked,candidates[2]],[]).warnings.some(w=>/disclosure/.test(w)));
const framework=structuredClone(candidates.find(q=>q.supportingScriptures.length));framework.knowledge.mode='framework';assert.throws(()=>validateQuestions([framework],{allowCandidates:true}),/framework/);
const notes=structuredClone(one);notes.q='According to your notes, what was recorded?';assert.throws(()=>validateQuestions([notes],{allowCandidates:true}),/Personal/);
console.log(`PASS knowledge: 7 world boundaries, monotonic difficulty through 10000/endless, target means ${means.map(n=>n.toFixed(1))}, 1000 questions selected in ${elapsed.toFixed(0)}ms, variety, cooldown, retry freshness, delayed reinforcement, legacy saves, frozen queues, Gatekeepers, 50 quarantined candidates, stale review/canon/duplicate/leak/framework checks and publish gating.`);

// Exercise the authoring CLI without publishing anything or leaving import files.
const {mkdtemp,writeFile,rm}=await import('node:fs/promises');
const {tmpdir}=await import('node:os');const {join,resolve,dirname,basename}=await import('node:path');const {spawnSync}=await import('node:child_process');const {fileURLToPath}=await import('node:url');
const root=fileURLToPath(new URL('../',import.meta.url)),temporary=await mkdtemp(join(tmpdir(),'lions-gate-knowledge-')),name=`qa-${process.pid}-${Date.now()}`,imported=join(root,'content/candidates',name+'.json');
const cli=(...args)=>spawnSync(process.execPath,[join(root,'scripts/question-batch.mjs'),...args],{cwd:root,encoding:'utf8'});
const liveBefore=await readFile(join(root,'dist/published-questions.js'),'utf8');
try{
 const incoming=join(temporary,'incoming.json'),template=join(temporary,'evidence.json'),output=join(temporary,'reviewed.json');
 await writeFile(incoming,JSON.stringify([one]));assert.equal(cli('import',incoming,name).status,0);assert.equal(JSON.parse(await readFile(imported,'utf8'))[0].review.status,'candidate');
 assert.equal(cli('validate',imported).status,0);assert.equal(cli('template',imported,template).status,0);const unchecked=JSON.parse(await readFile(template,'utf8'));assert.ok(editorialChecks.every(k=>unchecked[one.id].checks[k]===false));
 assert.equal(cli('review',imported,template,output).status,1,'Blank checklists cannot approve content');
 assert.equal(cli('publish',imported).status,1,'Unreviewed CLI publication must fail');assert.equal(await readFile(join(root,'dist/published-questions.js'),'utf8'),liveBefore);
}finally{await rm(imported,{force:true});assert.equal(dirname(resolve(temporary)),resolve(tmpdir()));assert.ok(basename(temporary).startsWith('lions-gate-knowledge-'));await rm(temporary,{recursive:true,force:true})}
console.log('PASS batch CLI: candidate-only import, validation, unchecked template, incomplete-review rejection, draft-publication rejection and unchanged live bank.');

const worker=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');assert.ok(!worker.includes('content/candidates')&&!worker.includes('bke-'),'Candidate content is not in the offline publication shell');

for(const id of ['constructor','__proto__','Bad ID']){const q=structuredClone(one);q.id=id;assert.throws(()=>validateQuestions([q],{allowCandidates:true}),/safe stable id/)}
const injected=structuredClone(one);injected.scripture.url+='?x=\"onclick';assert.throws(()=>validateQuestions([injected],{allowCandidates:true}),/match/i);
