// Explicit local AI-assisted review, authorized by the owner. No build invokes
// this script. Default execution only checks the prepared source evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {questions} from '../dist/questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {mappedDifficulty} from './difficulty-map.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {createStore,loadCandidates,loadLedger} from './editorial-store.mjs';
import {digest,referenceKey,assertEvidence} from './editorial-core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),bytes=p=>readFile(new URL('../'+p,import.meta.url)),json=async p=>JSON.parse(await bytes(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const candidates=await loadCandidates(root),ledger=await loadLedger(root),selected=candidates.filter(c=>['deep-torah-50.json','torah-everyday-life-50.json'].includes(c.batch)).map(c=>c.q);
const deep=await json('content/deep-torah-50-evidence.json'),everyday=await json('content/torah-everyday-life-50-validation.json'),deepAudit=await json('content/deep-torah-50-validation.json'),manifest=await json('content/deep-torah-publication/manifest.json'),launch=await json('content/launch/release-plan.json');
assert.equal(selected.length,100);assert.equal(candidates.length,250);
assert.equal(sha(await bytes('content/candidates/deep-torah-50.json')),manifest.candidateSha256);assert.equal(sha(await bytes('content/deep-torah-50-evidence.json')),manifest.evidenceSha256);
const raw=await bytes('.verification/launch/kjv-vpl/eng-kjv_vpl.txt');assert.equal(sha(raw),deep.source.sha256);assert.equal(sha(raw),everyday.source.textSha256);assert.equal(sha(raw),'fb7b8c10feb607c22b3461e837bfd267c09814f39ce23756a1928f7739a52b3c');
const codes={Exodus:'EXO',Leviticus:'LEV',Numbers:'NUM',Deuteronomy:'DEU',John:'JOH','1 Corinthians':'1CO',James:'JAM',Hebrews:'HEB',Matthew:'MAT','2 Kings':'2KI','2 Chronicles':'2CH'},source=new Map();
for(const line of String(raw).split(/\r?\n/)){const m=line.match(/^(\w+) (\d+):(\d+) (.*)$/);if(m)source.set(`${m[1]} ${m[2]}:${m[3]}`,m[4]);}
const peers=new Map(questions.filter(q=>!selected.some(s=>s.id===q.id)).map(q=>[q.id,q]));for(const{q}of candidates)if(!selected.some(s=>s.id===q.id)&&!peers.has(q.id))peers.set(q.id,q);
validateQuestions([...peers.values(),...selected],{allowCandidates:true});const quality=qualityReport(selected,[...peers.values()]);assert.deepEqual(quality.errors,[]);assert.deepEqual(quality.warnings,[]);
const evidenceFor=q=>deep.questions[q.id]??everyday.records.find(r=>r.id===q.id);
let rangeCount=0;
for(const q of selected){
 const e=evidenceFor(q);assert.equal(e.questionSha256??e.candidateDigest,digest(q));assertEvidence(q);assert.equal(e.optionRationales.length,4);assert.ok(e.optionRationales.every(r=>r.trim().length>20));
 const mapped=mappedDifficulty(q.knowledge.editorialDifficulty??q.editorial.curriculumDifficulty);assert.equal(q.difficulty,mapped.difficulty);assert.equal(q.knowledge.complexity,mapped.complexity);
 for(const [i,s]of [q.scripture,...q.supportingScriptures||[]].entries()){
  const p=e.references?deep.passages[e.references[i]]:e.passages[i];assert.equal(p.book,s.book);assert.equal(p.chapter,s.chapter);assert.equal(p.verse,s.verse);assert.equal(p.endVerse,s.endVerse);
  assert.equal(s.excerpt,p.verses.map(v=>v.text).join(' '));
  for(const v of p.verses)assert.equal(v.text,source.get(`${codes[s.book]} ${s.chapter}:${v.verse}`));
  if(p.before!=null)assert.equal(p.before,source.get(`${codes[s.book]} ${s.chapter}:${s.verse-1}`));
  if(p.after!=null)assert.equal(p.after,source.get(`${codes[s.book]} ${s.chapter}:${(s.endVerse??s.verse)+1}`));
  for(const v of p.context||[])assert.equal(v.text,source.get(`${codes[s.book]} ${s.chapter}:${v.verse}`));
  rangeCount++;
 }
}
const held=launch.quarantine.map(r=>{const c=candidates.find(c=>c.q.id===r.id);assert.ok(c);assert.ok(!selected.some(q=>q.id===r.id));assert.ok(!questions.some(q=>q.id===r.id));assert.ok(!ledger.decisions[r.id]);return{...r,sourceDigest:digest(c.q),status:'held-not-approved',authorizationDoesNotResolveConcern:true};});assert.equal(held.length,32);
console.log(`PASS banked preflight: 100 candidates, ${rangeCount} citation occurrences, exact pinned KJV/adjacent context, source hashes, mapping, four-choice rationales, 0 schema/quality warnings; 32 unchanged held records.`);
if(!process.argv.includes('--record-authorized-ai-review')){console.log('Read-only: no decisions recorded.');process.exit(0)}
const folder=new URL('../content/banked-publication/',import.meta.url);await mkdir(folder,{recursive:true});
let baseline=await json('content/banked-publication/baseline.json').catch(e=>{if(e.code==='ENOENT')return null;throw e});
const authorization='Owner message: "i authorize all banked questions". This authorizes local AI-assisted review/publication of eligible banked records; unresolved records remain held. No commit, push or deployment. NOT independent human Scripture certification; NOT owner-performed passage verification.';
if(!baseline){
 assert.equal(questions.length,160);assert.equal(ledger.events.length,118);assert.equal(Object.keys(ledger.decisions).length,118);
 assert.equal(digest(questions),manifest.liveDigest);assert.equal(sha(await bytes('content/editorial/decisions.json')),manifest.ledgerSha256);
 for(const {q}of candidates)assert.equal(manifest.candidateSources[q.id],digest(q));
 const protectedPaths=['dist/app.js','dist/engine.js','dist/storage.js','dist/combat.js','dist/answer-reveal.js','dist/answer-reveal.css','dist/course-lessons.js','dist/lessons.js','content/deep-torah-50-evidence.json','content/torah-everyday-life-50-validation.json','content/deep-torah-publication/manifest.json',...candidates.map(c=>'content/candidates/'+c.batch)];
 baseline={schemaVersion:1,authorization,originalLive:questions,originalLedger:ledger,candidateSources:Object.fromEntries(candidates.map(c=>[c.q.id,digest(c.q)])),selectedIds:selected.map(q=>q.id),held,evidenceCitationOccurrences:rangeCount,quality,sourceSha256:sha(raw),protectedHashes:Object.fromEntries(await Promise.all([...new Set(protectedPaths)].map(async p=>[p,sha(await bytes(p))])))};
 await writeFile(new URL('baseline.json',folder),JSON.stringify(baseline,null,2)+'\n',{flag:'wx'});
}
assert.deepEqual(baseline.selectedIds,selected.map(q=>q.id));for(const {q}of candidates)assert.equal(baseline.candidateSources[q.id],digest(q));for(const[id,d]of Object.entries(baseline.originalLedger.decisions))assert.deepEqual(ledger.decisions[id],d);
const store=createStore(root,questions);let recorded=0;
for(const q of selected){
 if(questions.some(p=>p.id===q.id))continue;
 const existing=(await loadLedger(root)).decisions[q.id];
 if(existing){assert.equal(existing.sourceDigest,digest(q));assert.equal(existing.action,'approve');assert.equal(existing.reviewer,'Codex — AI-assisted Scripture review; not independent human certification');assert.ok(existing.notes.includes(authorization));continue;}
 const e=evidenceFor(q),auditDate=q.id.startsWith('deep-torah-')?deep.checkedOn:e.checkedOn,auditBy=q.id.startsWith('deep-torah-')?deep.checkedBy:e.checkedBy;
 await store.save({id:q.id,action:'approve',reviewer:'Codex — AI-assisted Scripture review; not independent human certification',notes:[authorization,`Retained source audit: ${auditBy}; ${auditDate}. Existing evidence and source hashes unchanged.`,e.difficultyRationale??e.scope,'AI review checked cited wording/context, answer uniqueness, explanations and all four choices. Existing source ratings remain provisional.','No automated warnings; intentional distinct-objective reinforcement remains subject to the existing rotation/disclosure safeguards.'].join('\n'),sourceDigest:digest(q),expectedRevision:0,checks:Object.fromEntries(editorialChecks.map(k=>[k,true])),optionRationales:e.optionRationales,resolvedWarnings:[],citations:[q.scripture,...q.supportingScriptures||[]].map(s=>({key:referenceKey(s),excerpt:s.excerpt})),curriculumDifficulty:null});recorded++;
}
console.log(`Recorded ${recorded} source-bound AI-attributed reviews through the existing store. Export/publication remain separate commands. Original 118 decisions and all 32 holds preserved.`);
