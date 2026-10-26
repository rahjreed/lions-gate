import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {selectQuestions,createRun,submit,advance,nextLevel,validRun,retryLevel} from '../dist/engine.js';
import {checkLaunch,stageLaunch} from './stage-launch.mjs';
import {loadCandidates,loadLedger} from './editorial-store.mjs';
import {digest} from './editorial-core.mjs';
const root=new URL('../',import.meta.url),read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const {plan,batch}=await checkLaunch(),bank=[...questions,...batch],audit=await read('content/launch/editorial-audit.json'),evidence=await read('content/launch/scripture-evidence.json');
assert.equal(questions.length,42);assert.equal(publishedQuestions.length,0);assert.equal(batch.length,68);assert.equal(plan.quarantine.length,32);assert.equal(bank.length,110);assert.equal(audit.records.length,142);assert.equal(validateQuestions(bank),true);
const candidates=await loadCandidates(new URL('../',import.meta.url));assert.equal(candidates.length,150);assert.equal(plan.candidateCount,150);assert.equal(plan.deferredCandidates.length,50);
assert.equal(new Set([...batch,...plan.quarantine,...plan.deferredCandidates].map(q=>q.id)).size,150);
assert.ok(plan.deferredCandidates.every(c=>!Object.hasOwn(plan.decisions,c.id)),'New source-checked drafts have no prepared approval decision');
assert.ok(batch.every(q=>/Codex.*AI-assisted/.test(q.review.reviewedBy)&&/NOT owner/.test(q.review.rationale)));assert.ok(batch.every(q=>!plan.quarantine.some(r=>r.id===q.id)));
for(const row of audit.records){const original=[...questions,...candidates.map(c=>c.q)].find(q=>q.id===row.id);assert.equal(digest(original),row.sourceDigest);const proof=evidence.records.find(e=>e.id===row.id);assert.equal(proof.passages.length,1+(original.supportingScriptures||[]).length);assert.ok(proof.passages.every(p=>p.verses.length>0&&p.verses.every(v=>typeof v.text==='string'&&v.text.trim())));}
const ids=new Set(bank.map(q=>q.id)),seen=new Set(),history={};let asked=0;for(let level=1;level<=1000;level++){const chosen=selectQuestions(bank,{level,history,asked});assert.equal(chosen.length,10);assert.equal(new Set(chosen.map(e=>e.id)).size,10);for(const e of chosen){assert.ok(ids.has(e.id));seen.add(e.id);history[e.id]={count:(history[e.id]?.count||0)+1,last:++asked,lastCorrect:true};}}assert.equal(seen.size,bank.length);
const run=createRun(bank,'LAUNCH TEST');for(let level=1;level<=5;level++){for(let n=0;n<10;n++){const q=bank.find(q=>q.id===run.queue[run.index].id);submit(run,bank,q.answer);advance(run,bank);}assert.equal(run.status,'levelup');assert.ok(validRun(JSON.parse(JSON.stringify(run)),bank));if(level<5)nextLevel(run,bank);}assert.equal(run.completed,5);
// A genuinely isolated staging ledger exercises the final authorization command without publishing.
const temp=await mkdtemp(join(tmpdir(),'lions-gate-launch-fixture-'));
try{
 await mkdir(join(temp,'content/launch'),{recursive:true});await mkdir(join(temp,'content/candidates'),{recursive:true});
 await writeFile(join(temp,'content/launch/release-plan.json'),JSON.stringify(plan));await writeFile(join(temp,'content/launch/reviewed-candidates.json'),JSON.stringify(batch));await writeFile(join(temp,'content/candidates/all.json'),JSON.stringify(candidates.map(c=>c.q)));
 for(const file of Object.keys(plan.evidenceSources))await writeFile(join(temp,file),await readFile(new URL(file,root)));
 await stageLaunch(temp,questions);const ledger=await loadLedger(temp);assert.equal(Object.keys(ledger.decisions).length,68);assert.equal(ledger.events.length,68);await stageLaunch(temp,questions);assert.equal((await loadLedger(temp)).events.length,68);
 const changedSources=candidates.map(c=>structuredClone(c.q)),deferred=changedSources.find(q=>plan.deferredCandidates.some(d=>d.id===q.id));deferred.explain+=' changed';
 await writeFile(join(temp,'content/candidates/all.json'),JSON.stringify(changedSources));await assert.rejects(checkLaunch(temp,questions),/Stale/,'Changes to unselected drafts still invalidate the inventory');
 await writeFile(join(temp,'content/candidates/all.json'),JSON.stringify(candidates.slice(1).map(c=>c.q)));await assert.rejects(checkLaunch(temp,questions),/Stale/,'Removing a candidate must invalidate the inventory');
 await writeFile(join(temp,'content/candidates/all.json'),JSON.stringify(candidates.map(c=>c.q)));
 const invalidDecision=structuredClone(plan);invalidDecision.decisions[batch[0].id].checks.passages=false;
 await writeFile(join(temp,'content/launch/release-plan.json'),JSON.stringify(invalidDecision));await assert.rejects(checkLaunch(temp,questions),/review|evidence|approval/i,'Incomplete Scripture checks block approval staging');
 await writeFile(join(temp,'content/launch/release-plan.json'),JSON.stringify(plan));
 await writeFile(join(temp,'content/launch/scripture-evidence.json'),JSON.stringify({...evidence,source:{...evidence.source,title:'altered'}}));await assert.rejects(checkLaunch(temp,questions),/Stale launch evidence/,'Evidence artifact changes block staging');
 await writeFile(join(temp,'content/launch/scripture-evidence.json'),JSON.stringify(evidence));
 const changed=structuredClone(batch);changed[0].scripture.excerpt='';await writeFile(join(temp,'content/launch/reviewed-candidates.json'),JSON.stringify(changed));await assert.rejects(checkLaunch(temp,questions),/Stale/);
}finally{const actual=await realpath(temp);assert.equal(dirname(actual),await realpath(tmpdir()));assert.ok(basename(actual).startsWith('lions-gate-launch-fixture-'));await rm(actual,{recursive:true,force:true});}
console.log(`PASS launch: 150 candidates = 68 prepared + 32 held + 50 deferred drafts; original 142-record audit and 42 live unchanged; 110-question proposed bank, ${seen.size} seen across 1000 levels, regular/Gatekeeper progression through level 5, save roundtrips, changed/deleted drafts, missing checks, modified evidence, tampered exports rejected; idempotent fixture-only staging. No real approvals/publication.`);
