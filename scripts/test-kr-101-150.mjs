import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {selectQuestions} from '../dist/engine.js';
import {publicationBatch,reviewBatch} from './question-batch.mjs';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {adaptEditorial,pendingExcerpt} from './import-kr-101-150.mjs';

const read=async name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const source=await read('content/sources/kr-101-150.md'),batch=JSON.parse(await read('content/candidates/kr-101-150.json'));
const audit=JSON.parse(await read('content/kr-101-150-validation.json')),template=JSON.parse(await read('content/kr-101-150-review-template.json'));
const revisions=JSON.parse(await read('content/kr-101-150-choice-revisions.json')),expected=adaptEditorial(source);
assert.deepEqual(revisions.changes.map(r=>r.id).sort(),['kr-105','kr-109','kr-115','kr-130','kr-133','kr-136','kr-141']);
let revisedChoices=0;
for(const revision of revisions.changes){
 const q=expected.find(q=>q.id===revision.id);assert.equal(revision.choices.length,3);
 for(const edit of revision.choices){const index='ABCD'.indexOf(edit.letter);assert.ok(index>=0);assert.notEqual(index,q.answer,'Correct choices must remain verbatim');assert.equal(q.options[index],edit.before);q.options[index]=edit.after;revisedChoices++;}
}
assert.equal(revisedChoices,21);assert.equal(batch.length,50);assert.deepEqual(batch,expected,'Only the 21 documented incorrect choices may differ from the original import');
assert.deepEqual(batch.map(q=>q.editorial.sourceId),Array.from({length:50},(_,i)=>`KR-${101+i}`));
assert.deepEqual(batch.map(q=>q.id),Array.from({length:50},(_,i)=>`kr-${101+i}`));
assert.equal(new Set(batch.map(q=>q.editorial.sourceId)).size,50);
for(const q of batch){
 const start=source.indexOf(`### ${q.editorial.sourceId} | Difficulty `),end=source.indexOf('\n### ',start+1),block=source.slice(start,end<0?undefined:end);
 assert.ok(block.includes(`**Question:** ${q.q}`),'Verbatim question retained');
 assert.ok(block.includes(`**Explanation:** ${q.explain}`),'Verbatim explanation retained');
 assert.ok(block.includes(`**Scripture:** ${q.editorial.sourceScripture}`),'All original reference text retained');
 const references=[q.scripture,...q.supportingScriptures].map(c=>`${c.book} ${c.chapter}:${c.verse}${c.endVerse!==undefined?'-'+c.endVerse:''}`);
 assert.deepEqual(references,q.editorial.sourceScripture.replace(/\bPsalm /g,'Psalms ').replaceAll('–','-').split(/;\s*/),'Every primary/supporting citation and range endpoint retained');
 assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
 for(const [i,option] of q.options.entries()){
  const edit=revisions.changes.find(r=>r.id===q.id)?.choices.find(c=>c.letter==='ABCD'[i]);
  assert.ok(block.includes(`${'ABCD'[i]}. ${edit?edit.before:option}`),'Original choice retained or explicitly documented');
 }
 assert.ok(block.includes(`**Correct: ${'ABCD'[q.answer]}**`));assert.equal(q.correctAnswer,q.options[q.answer]);
 assert.ok(block.includes(`| Difficulty ${q.editorial.sourceDifficulty}`));assert.equal(q.knowledge.complexity,q.editorial.sourceDifficulty);
 assert.equal(q.review.status,'candidate');assert.equal(q.editorial.evidenceStatus,'pending');assert.equal(q.editorial.manualReviewRequired,true);
 assert.ok(!q.review.contentFingerprint&&!q.review.reviewedBy&&!q.review.reviewedOn,'No false approval evidence');
 for(const c of [q.scripture,...q.supportingScriptures])assert.equal(c.excerpt,pendingExcerpt,'Do not invent verified quotations');
 const e=template[q.id];assert.ok(editorialChecks.every(k=>e.checks[k]===false));assert.equal(e.reviewedBy,'');assert.equal(e.optionRationales.filter(Boolean).length,0);
}
validateQuestions(batch,{allowCandidates:true});assert.throws(()=>validateQuestions(batch),/review/i);
assert.throws(()=>publicationBatch(questions,batch),/review/i);assert.throws(()=>reviewBatch(batch,template),/incomplete/i);
const earlier=[];for(const file of await readdir(new URL('../content/candidates/',import.meta.url)))if(file.endsWith('.json')&&file!=='kr-101-150.json')earlier.push(...JSON.parse(await read(`content/candidates/${file}`)));
const all=[...questions,...earlier,...batch],unpublished=batch.filter(q=>!questions.some(live=>live.id===q.id)),otherDrafts=earlier.filter(q=>!questions.some(live=>live.id===q.id));
assert.equal(new Set([...questions,...otherDrafts,...unpublished].map(q=>q.id)).size,questions.length+otherDrafts.length+unpublished.length);
const quality=unpublished.length?qualityReport(unpublished,[...questions,...otherDrafts]):{errors:[],warnings:[],publicationReady:false};assert.deepEqual(quality.errors,[]);assert.equal(quality.publicationReady,false);if(!publishedQuestions.length)assert.deepEqual(quality.warnings,audit.warnings);
for(const level of [1,75,150,225,300,375,450,525,10000]){
 const selected=selectQuestions(all,{level,history:{}});assert.equal(selected.length,10);assert.ok(selected.every(e=>questions.some(q=>q.id===e.id)),'Neither candidate batch enters gameplay');
}
assert.equal(questions.length,audit.liveCount+publishedQuestions.length);assert.equal(JSON.parse(await read('content/candidates/initial-50.json')).length,audit.previousCandidates,'Original earlier batch stays intact; later batches are checked as additional peers');
const runtimeFixes=JSON.parse(await read('content/launch/runtime-fixes.json')).fixes;
assert.deepEqual(runtimeFixes.map(f=>f.file).sort(),['dist/answer-reveal.js','dist/app.js','dist/armor.css','dist/armor.js','dist/combat.js','dist/engine.js','dist/mascot.js','dist/storage.js','dist/style.css','dist/sw.js']);
for(const fix of runtimeFixes){assert.equal(fix.before,audit.preservedFiles[fix.file]);assert.ok(fix.reason.trim());}
for(const [file,hash] of Object.entries(audit.preservedFiles)){if(publishedQuestions.length&&['dist/published-questions.js','dist/sw.js'].includes(file))continue;const documentedFix=runtimeFixes.find(f=>f.file===file);assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),documentedFix?.after||hash,`${file} must match its historical snapshot or explicit launch-fix snapshot`)}
const sourceHash=createHash('sha256').update(source).digest('hex');assert.equal(sourceHash,audit.sourceSha256);assert.ok(batch.every(q=>q.editorial.sourceSha256===sourceHash));
assert.ok(!String(await read('dist/sw.js')).includes('kr-101-150'),'Candidates are outside offline gameplay assets');
console.log(`PASS KR-101–150: exactly 50; only 21 documented distractor edits; correct choices/questions/references/explanations/difficulty protected; zero schema errors; ${quality.warnings.length} unresolved warnings; unchecked review; publication rejection; draft exclusion through level 10000; ${Object.keys(audit.preservedFiles).length} prior file snapshots enforced with explicit citation/Armory/mastery revisions.`);
