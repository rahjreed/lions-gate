// Explicit, owner-authorized AI-assisted review only. Never called by a build.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {questions} from '../dist/questions.js';
import {validateQuestions,contentFingerprint} from '../dist/question-rules.js';
import {answerConflict} from '../dist/knowledge.js';
import {selectQuestions} from '../dist/engine.js';
import {mappedDifficulty} from './difficulty-map.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {createStore,loadCandidates,loadLedger} from './editorial-store.mjs';
import {digest,referenceKey} from './editorial-core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),read=async p=>readFile(new URL('../'+p,import.meta.url)),json=async p=>JSON.parse(await read(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const batch=await json('content/candidates/biblical-course-50.json'),audit=await json('content/biblical-course-50-validation.json'),proof=await json('content/biblical-course-50-evidence.json');
assert.equal(batch.length,50);assert.equal(sha(await read('content/candidates/biblical-course-50.json')),audit.candidateSha256);assert.equal(sha(await read('content/biblical-course-50-evidence.json')),audit.evidenceSha256);
const source=await read('.verification/launch/kjv-vpl/eng-kjv_vpl.txt');assert.equal(sha(source),proof.source.sha256);assert.equal(proof.source.sha256,'fb7b8c10feb607c22b3461e837bfd267c09814f39ce23756a1928f7739a52b3c');
const lines=new Set(String(source).split(/\r?\n/));
const candidates=await loadCandidates(root),ledger=await loadLedger(root),peers=new Map(questions.filter(q=>!batch.some(b=>b.id===q.id)).map(q=>[q.id,q]));
for(const {q} of candidates)if(!batch.some(b=>b.id===q.id)&&!peers.has(q.id))peers.set(q.id,q);
validateQuestions([...peers.values(),...batch],{allowCandidates:true});
const report=qualityReport(batch,[...peers.values()]);assert.deepEqual(report,audit.quality);
for(const q of batch){
 const e=proof.questions[q.id];assert.equal(sha(JSON.stringify(q)),e.questionSha256);assert.equal(e.optionRationales.length,4);assert.ok(e.optionRationales.every(v=>v.trim().length>20));
 assert.equal(q.correctAnswer,q.options[q.answer]);const mapped=mappedDifficulty(q.knowledge.editorialDifficulty);assert.equal(q.knowledge.complexity,mapped.complexity);assert.equal(q.difficulty,mapped.difficulty);
 for(const [i,s]of [q.scripture,...q.supportingScriptures].entries()){
  const ref=e.references[i],p=proof.passages[ref],code=ref.match(/^([1-4]?[A-Z]+)/)[1];assert.equal(s.book,p.book);assert.equal(s.chapter,p.chapter);assert.equal(s.excerpt,p.verses.map(v=>v.text).join(' '));
  for(const v of p.context)assert.ok(lines.has(`${code} ${p.chapter}:${v.verse} ${v.text}`));
 }
}
// Existing hard disclosure guard, exercised before accepting the two warnings.
const reviewedFixture=batch.map(q=>({...structuredClone(q),review:{...questions[0].review,status:'verified',basis:q.knowledge.mode==='multi-passage'?'passage-comparison':'explicit-passage',reviewedBy:'AI-assisted preflight fixture, not a published review',checks:Object.fromEntries(editorialChecks.map(k=>[k,true])),optionRationales:proof.questions[q.id].optionRationales,contentFingerprint:contentFingerprint(q)}}));
const combined=[...questions.filter(q=>!batch.some(b=>b.id===q.id)),...reviewedFixture];
for(const level of [1,5,75,150,300,450,700,10000])for(let seed=0;seed<12;seed++){
 let n=seed+1;const random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
 const selected=selectQuestions(combined,{level,history:{}},random).map(e=>combined.find(q=>q.id===e.id));
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++)assert.equal(answerConflict(selected[i],selected[j]),false);
}
console.log('Preflight PASS: 50 source-bound candidates, 90 exact source ranges, choices/mapping intact; existing selection guards exclude disclosure conflicts.');
if(!process.argv.includes('--record-authorized-ai-review')){console.log('Read-only check. Recording requires the explicit --record-authorized-ai-review flag.');process.exit(0)}
const authorization='Owner explicitly authorized AI-assisted editorial review and local publication of the 50 course questions in the October 28, 2026 task. This is NOT independent human Scripture certification and NOT owner-performed passage verification.';
await mkdir(new URL('../content/course-publication/',import.meta.url),{recursive:true});
const baselinePath='content/course-publication/baseline.json';let baseline=await json(baselinePath).catch(e=>{if(e.code==='ENOENT')return null;throw e});
if(!baseline){
 assert.equal(questions.length,110);assert.equal(Object.keys(ledger.decisions).length,68);assert.equal(ledger.events.length,68);
 const protectedPaths=Object.keys(audit.preservedFiles),protectedHashes=Object.fromEntries(await Promise.all(protectedPaths.map(async p=>[p,sha(await read(p))])));
 baseline={schemaVersion:1,authorization,originalLive:questions.map(q=>({id:q.id,digest:digest(q)})),originalLedger:ledger,candidateHashes:Object.fromEntries(candidates.map(c=>[c.q.id,digest(c.q)])),protectedHashes,sourceEvidenceHash:audit.evidenceSha256,candidateFileHash:audit.candidateSha256};
 await writeFile(new URL('../'+baselinePath,import.meta.url),JSON.stringify(baseline,null,2)+'\n',{flag:'wx'});
}
const store=createStore(root,questions),recorded=[];
for(const q of batch){
 if(questions.some(p=>p.id===q.id))continue;
 const previous=(await loadLedger(root)).decisions[q.id];
 if(previous){assert.equal(previous.reviewer,'Codex — AI-assisted Scripture review; not independent human certification');assert.equal(previous.sourceDigest,digest(q));assert.equal(previous.action,'approve');continue;}
 const warnings=qualityReport([q],[...peers.values(),...batch.filter(p=>p.id!==q.id)]).warnings;
 const notes=[authorization,'Reviewed the source passages, adjacent context, answer uniqueness, all alternatives, explanations and scope; retained the existing provisional difficulty mapping.',proof.questions[q.id].difficultyRationale,...warnings.map(w=>'Warning accepted as intentional reinforcement, not dismissed: '+w+'. Existing hard literal-disclosure exclusions prevent co-selection; direct selection regression coverage is retained.')].join('\n');
 recorded.push(await store.save({id:q.id,action:'approve',reviewer:'Codex — AI-assisted Scripture review; not independent human certification',notes,sourceDigest:digest(q),expectedRevision:0,checks:Object.fromEntries(editorialChecks.map(k=>[k,true])),optionRationales:proof.questions[q.id].optionRationales,resolvedWarnings:warnings,citations:[q.scripture,...q.supportingScriptures].map(s=>({key:referenceKey(s),excerpt:s.excerpt})),curriculumDifficulty:null}));
}
console.log(`Recorded ${recorded.length} AI-attributed decisions through createStore.save. Export and publication remain separate CLI operations.`);
