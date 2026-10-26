// Recompile recorded editorial decisions; this script does not perform or invent source review.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {questions} from '../dist/questions.js';
import {loadCandidates} from './editorial-store.mjs';
import {digest,approvalFor,referenceKey} from './editorial-core.mjs';
import {editorialChecks,qualityReport} from './question-quality.mjs';
import {publicationBatch} from './question-batch.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async name=>JSON.parse(await readFile(new URL('../content/launch/'+name,import.meta.url),'utf8'));
const audit=await read('editorial-audit.json'),evidence=await read('scripture-evidence.json'),candidates=await loadCandidates(root),all=[...questions,...candidates.map(c=>c.q)];
// The original review remains a 142-record audit. Inventory additions are not
// retroactively approved or attributed to that review.
const deferredAudit=JSON.parse(await readFile(new URL('../content/torah-everyday-life-50-validation.json',import.meta.url),'utf8'));
const auditedIds=new Set(audit.records.map(r=>r.id)),deferred=candidates.filter(c=>!auditedIds.has(c.q.id));
if(auditedIds.size!==audit.records.length||audit.records.some(r=>digest(all.find(q=>q.id===r.id))!==r.sourceDigest)||questions.some(q=>!auditedIds.has(q.id)))throw Error('Source changed since launch audit; review again.');
if(deferred.length!==deferredAudit.records.length||deferred.some(c=>deferredAudit.records.find(r=>r.id===c.q.id)?.candidateDigest!==digest(c.q)))throw Error('Unaccounted or changed deferred candidate inventory; reconcile before release.');
const decisions={},reviewed=[];
const preparedAt=audit.completedAt;
if(typeof preparedAt!=='string'||preparedAt.slice(0,10)!==audit.reviewedOn||!Number.isFinite(Date.parse(preparedAt)))throw Error('Recorded audit completion timestamp required. Recompilation is not a new Scripture review.');
const warningReasons={
 'bke-neighbor-love / kr-146: possible answer disclosure; do not co-select':'KR-146 is quarantined and absent from the launch bank.',
 'bke-mercy-hosea / kr-147: shared concept; check repetition':'KR-147 is quarantined; its short-answer disclosure of Hosea is also recorded in the audit.',
 'kr-103 / kr-126: shared concept; check repetition':'KR-126 is quarantined; keep the explicit purpose question KR-103.',
 'kr-119 / kr-120: shared concept; check repetition':'Intentional reinforcement of two different details: blue cord versus four corners. Neither stem gives the other complete answer.',
 'kr-120 / kr-119: shared concept; check repetition':'Intentional reinforcement of four corners versus blue cord; both retained at introductory difficulty.'
};
for(const r of audit.records.filter(r=>r.disposition==='ready-for-release')){
 const q=all.find(q=>q.id===r.id),record=evidence.records.find(e=>e.id===q.id),refs=[q.scripture,...q.supportingScriptures||[]];
 const citations=refs.map((s,i)=>{const p=record.passages[i];if(p.reference!==referenceKey(s)||p.verses.some(v=>!v.text)||p.verses.length!==(s.endVerse??s.verse)-s.verse+1)throw Error('Missing/mismatched actual Scripture evidence: '+q.id);return {key:referenceKey(s),excerpt:p.verses.map(v=>v.text).join(' ')}});
 const peers=all.filter(p=>p.id!==q.id),report=qualityReport([q],peers);if(report.errors.length||report.warnings.some(w=>!warningReasons[w]))throw Error('Unresolved quality issue: '+q.id);
 const decision={action:'approve',reviewer:audit.reviewedBy,notes:`AI-assisted source audit; NOT owner/personal approval. ${r.rationale} ${report.warnings.map(w=>warningReasons[w]).join(' ')}`,sourceDigest:r.sourceDigest,revision:1,savedAt:preparedAt,checks:Object.fromEntries(editorialChecks.map(k=>[k,true])),optionRationales:q.options.map((o,i)=>i===q.answer?`The cited text supports this answer: ${r.rationale}`:`For this exact question, “${o}” is not the cited passage's stated answer; the text supports “${q.correctAnswer}”. See the retained complete verses and context.`),resolvedWarnings:report.warnings,citations,curriculumDifficulty:r.editorialDifficulty};
 decisions[q.id]=decision;reviewed.push(approvalFor(q,decision,peers));
}
publicationBatch(questions,reviewed);
const plan={schemaVersion:1,phase:'prepared-only-awaiting-owner-release',reviewer:audit.reviewedBy,source:evidence.source,existingLiveCount:questions.length,preparedCount:reviewed.length,proposedTotal:questions.length+reviewed.length,quarantine:audit.records.filter(r=>r.disposition==='quarantine').map(r=>({id:r.id,reason:r.rationale})),decisions,reviewedDigest:digest(reviewed),candidateSources:Object.fromEntries(candidates.map(c=>[c.q.id,digest(c.q)])),liveDigest:digest(questions),candidateCount:candidates.length,deferredCandidates:deferred.map(c=>({id:c.q.id,sourceDigest:digest(c.q),reason:'Source-checked draft; not approved or included in this first publication.'})),evidenceSources:{'content/launch/editorial-audit.json':digest(audit),'content/launch/scripture-evidence.json':digest(evidence),'content/torah-everyday-life-50-validation.json':digest(deferredAudit)}};
await mkdir(new URL('../content/launch/',import.meta.url),{recursive:true});
await writeFile(new URL('../content/launch/reviewed-candidates.json',import.meta.url),JSON.stringify(reviewed,null,2)+'\n');
await writeFile(new URL('../content/launch/release-plan.json',import.meta.url),JSON.stringify(plan,null,2)+'\n');
const changes=reviewed.map(q=>{const before=all.find(p=>p.id===q.id);return {id:q.id,scope:'Prepared copy only; original candidate and live bank unchanged',evidenceChanges:[before.scripture,...before.supportingScriptures||[]].map((s,i)=>({reference:referenceKey(s),before:s.excerpt,after:decisions[q.id].citations[i].excerpt})),difficulty:{before:{display:before.difficulty,complexity:before.knowledge.complexity},editorial:decisions[q.id].curriculumDifficulty,prepared:{display:q.difficulty,complexity:q.knowledge.complexity}},questionChoicesAnswerExplanationChanged:false}});
await writeFile(new URL('../content/launch/change-log.json',import.meta.url),JSON.stringify(changes,null,2)+'\n');
console.log(`Prepared only: ${candidates.length} inventory records = ${reviewed.length} prepared + ${plan.quarantine.length} held + ${deferred.length} deferred drafts; ${plan.proposedTotal} proposed live total. Original review timestamps retained; live module and decision ledger untouched.`);
