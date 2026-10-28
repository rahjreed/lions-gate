import {expectedCourseRevision} from './course-revision.mjs';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {questions} from '../dist/questions.js';
import {publishedQuestions} from '../dist/published-questions.js';
import {validateQuestions} from '../dist/question-rules.js';
import {selectQuestions} from '../dist/engine.js';
import {qualityReport} from './question-quality.mjs';
import {publicationBatch} from './question-batch.mjs';
import {mappedDifficulty,mappingVersion} from './difficulty-map.mjs';
const root=new URL('../',import.meta.url),read=async p=>readFile(new URL(p,root),'utf8'),sha=v=>createHash('sha256').update(v).digest('hex');
const file='torah-everyday-life-50.json',batch=JSON.parse(await read('content/candidates/'+file)),audit=JSON.parse(await read('content/torah-everyday-life-50-validation.json'));
const peers=[...questions];for(const f of (await readdir(new URL('../content/candidates/',import.meta.url))).filter(f=>f.endsWith('.json')&&f!==file))for(const q of JSON.parse(await read('content/candidates/'+f)))if(!peers.some(p=>p.id===q.id))peers.push(q);
assert.equal(batch.length,50);assert.equal(audit.records.length,50);assert.deepEqual(audit.unresolvedPassages,[]);
assert.deepEqual(Object.values(audit.categoryCounts),[10,8,8,8,8,8]);
assert.deepEqual(audit.difficultyCounts,{'2':10,'3':16,'4':3,'5':15,'6':2,'7':3,'8':1});
assert.equal(validateQuestions([...peers,...batch],{allowCandidates:true}),true);
const report=qualityReport(batch,peers);assert.deepEqual(report,audit.quality);assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.equal(report.publicationReady,false);
assert.throws(()=>publicationBatch(questions,batch),/review/i,'A source-check artifact cannot grant publication approval');
for(const q of batch){
 assert.match(q.id,/^torah-[a-z]+(?:-[a-z]+)*$/,'IDs describe concepts, not sequence numbers');
 assert.deepEqual(q.review,{status:'candidate'});assert.ok(!publishedQuestions.some(p=>p.id===q.id));
 assert.equal(q.knowledge.learningObjective,q.editorial.learningObjective);assert.ok(q.editorial.learningObjective.trim());
 const mapped=mappedDifficulty(q.editorial.curriculumDifficulty);assert.equal(q.difficulty,mapped.difficulty);assert.equal(q.knowledge.complexity,mapped.complexity);assert.equal(q.knowledge.difficultyMapping,mappingVersion);
 const proof=audit.records.find(p=>p.id===q.id);assert.equal(proof.candidateDigest,sha(JSON.stringify(q)));assert.match(proof.checkedBy,/AI-assisted/);assert.match(proof.checkedBy,/not human approval/);
 assert.equal(proof.optionRationales.length,4);assert.ok(proof.optionRationales.every(r=>typeof r==='string'&&r.trim().length>20));
 const citations=[q.scripture,...q.supportingScriptures];assert.equal(proof.passages.length,citations.length);
 for(const [i,s] of citations.entries()){
  const p=proof.passages[i];assert.equal(p.book,s.book);assert.equal(p.chapter,s.chapter);assert.equal(p.verse,s.verse);assert.equal(p.endVerse,s.endVerse);
  assert.equal(p.verses.length,(s.endVerse||s.verse)-s.verse+1);assert.deepEqual(p.verses.map(v=>v.verse),Array.from({length:p.verses.length},(_,n)=>s.verse+n));
  assert.ok(p.verses.every(v=>v.text.trim()));assert.equal(s.excerpt,p.verses.map(v=>v.text).join(' '));assert.ok(typeof p.before==='string'||p.verse===1);assert.ok(p.after===null||typeof p.after==='string');
 }
}
assert.deepEqual([0,1,2,3].map(n=>batch.filter(q=>q.answer===n).length),[13,13,12,12]);
for(const level of [1,75,300,450,700,10000]){const selected=selectQuestions([...questions,...batch],{level,history:{}});assert.equal(selected.length,10);assert.ok(selected.every(q=>questions.some(live=>live.id===q.id)),'Drafts must not enter gameplay at any stage');}
// Publication deliberately changes the additions module and its generated cache.
// Permit only the exact authorized 68-record and course-50 exports.
if(publishedQuestions.length)assert.deepEqual(publishedQuestions,[...JSON.parse(await read('content/launch/reviewed-candidates.json')),...JSON.parse(await read('content/reviewed/course-50-approved.json'))],'Only the two exact owner-authorized exports may supersede the pre-publication snapshots');
const runtimeRevisions=JSON.parse(await read('content/launch/runtime-fixes.json')).fixes;
for(const [path,hash] of Object.entries(audit.preservedFiles)){if(publishedQuestions.length&&['dist/published-questions.js','dist/sw.js'].includes(path))continue;assert.equal(sha(await readFile(new URL(path,root))),expectedCourseRevision(path,runtimeRevisions.find(f=>f.file===path)?.after||hash),'Existing content/runtime changed outside its documented revision: '+path);}
console.log(`PASS Torah everyday life: 50 candidates; exact 10/8/8/8/8/8 categories; editorial 2–8 mapping; all passage/evidence records intact; 0 schema/quality/duplicate/disclosure warnings against ${peers.length} existing records; no draft publication; ${Object.keys(audit.preservedFiles).length} source snapshots enforced with explicit authorized runtime revisions. Source accuracy remains an editorial finding, not a consequence of this test.`);
