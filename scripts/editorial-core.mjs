import {createHash} from 'node:crypto';
import {contentFingerprint,validateQuestions} from '../dist/question-rules.js';
import {qualityReport,editorialChecks} from './question-quality.mjs';
import {calibrateForExport,mappedDifficulty} from './difficulty-map.mjs';
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const referenceKey=s=>`${s.book} ${s.chapter}:${s.verse}${s.endVerse?'-'+s.endVerse:''}`;
export function assertEvidence(q){
 for(const s of [q.scripture,...(q.supportingScriptures||[])]){
  if(typeof s?.excerpt!=='string'||s.excerpt.trim().length<8||/\b(missing|pending|todo|tbd|placeholder|unverified)\b|not (?:yet )?(?:checked|verified|transcribed|provided)|to be (?:checked|verified|transcribed)|no evidence/i.test(s.excerpt))throw Error(`${q.id}: checked Scripture evidence required for ${s?referenceKey(s):'missing citation'}`);
 }
}
export function assertReviewEvidence(e){
 if(!e||!e.reviewedBy?.trim()||e.reviewedBy.length>200||!/^\d{4}-\d{2}-\d{2}$/.test(e.reviewedOn)||!e.rationale?.trim()||!editorialChecks.every(k=>e.checks?.[k]===true)||!Array.isArray(e.optionRationales)||e.optionRationales.length!==4||e.optionRationales.some(s=>typeof s!=='string'||!s.trim())||!Array.isArray(e.resolvedWarnings))throw Error('Incomplete human review evidence: seven confirmations, rationale and four option rationales required.');
}
export function approvedCopy(q,e){
 assertReviewEvidence(e);assertEvidence(q);
 const result={...structuredClone(q),review:{...e,status:'verified',decision:'approved',basis:q.knowledge?.mode==='framework'?'named-framework':q.knowledge?.mode==='multi-passage'?'passage-comparison':'explicit-passage',contentFingerprint:contentFingerprint(q)}};
 validateQuestions([result]);return result;
}
export function reviewProjection(q,decision){
 let projected=calibrateForExport(q,decision.curriculumDifficulty??null);
 if(decision.citations!==undefined){
  if(!Array.isArray(decision.citations)||decision.citations.length!==1+(q.supportingScriptures||[]).length)throw Error('Evidence must cover every cited passage.');
  const refs=[projected.scripture,...(projected.supportingScriptures||[])];
  for(const [i,s] of refs.entries()){if(decision.citations[i].key!==referenceKey(s))throw Error('Citation identity changed.');s.excerpt=decision.citations[i].excerpt;}
 }
 return projected;
}
export function approvalFor(q,decision,peers=[]){
 if(decision?.action!=='approve'||decision.sourceDigest!==digest(q))throw Error(`${q.id}: no current explicit approval (draft/rejected/revised/stale).`);
 const projection=reviewProjection(q,decision);assertEvidence(projection);
 if(projection.editorial)projection.editorial.evidenceStatus='reviewed-via-local-ledger';
 if(decision.curriculumDifficulty!=null)mappedDifficulty(decision.curriculumDifficulty);
 const checklistOnly=decision.reviewMode==='checklist-only-v1'&&!decision.hosted;
 // These are explicit checklist attestations, not invented biblical explanations.
 // Preserve legacy/hosted evidence exactly; only new local decisions opt in.
 const evidence={reviewedBy:decision.reviewer,reviewedOn:decision.savedAt.slice(0,10),rationale:checklistOnly&&!decision.notes?.trim()?'Local checklist approval; no written rationale supplied.':decision.notes,checks:decision.checks,optionRationales:checklistOnly?projection.options.map((_,i)=>decision.optionRationales?.[i]?.trim()||`Reviewer confirmed choice ${'ABCD'[i]} is ${i===projection.answer?'correct':'incorrect'} through the required passage, answer and distractor checks; no written rationale supplied.`):decision.optionRationales,resolvedWarnings:decision.resolvedWarnings,...(checklistOnly?{reviewMode:'checklist-only-v1'}:{})};
 const result=approvedCopy(projection,evidence),report=qualityReport([result],peers);
 if(report.errors.length)throw Error(report.errors.join('\n'));
 if(report.warnings.some(w=>!decision.resolvedWarnings?.includes(w)))throw Error(checklistOnly?'Each quality warning requires explicit acknowledgment.':'Each quality warning requires explicit acceptance and an explanation in the review rationale.');
 result.review.approvalReceipt=digest(decision);result.review.sourceDigest=decision.sourceDigest;
 return result;
}
export function assertCurrentApprovals(batch,candidates,ledger,live){
 for(const q of batch){
  const source=candidates.find(c=>c.q.id===q.id);if(!source)throw Error(`${q.id}: candidate source missing.`);
  const peers=[...live,...candidates.filter(c=>c.q.id!==q.id&&!live.some(l=>l.id===c.q.id)).map(c=>c.q)];
  const expected=approvalFor(source.q,ledger.decisions[q.id],peers);
  if(digest(expected)!==digest(q))throw Error(`${q.id}: exported approval is stale or has been altered; export again.`);
 }
}
