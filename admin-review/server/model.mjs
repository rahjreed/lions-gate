import {digest,approvalFor,assertEvidence,reviewProjection} from '../generated/scripts/editorial-core.mjs';
import {qualityReport,editorialChecks} from '../generated/scripts/question-quality.mjs';
import {mappedDifficulty} from '../generated/scripts/difficulty-map.mjs';
export function unpack(snapshot){
 if(snapshot?.schemaVersion!==1||!Array.isArray(snapshot.sources)||!Array.isArray(snapshot.decisions)||!Array.isArray(snapshot.events))throw Error('Invalid hosted snapshot.');
 const sources=snapshot.sources.map(row=>{const q=JSON.parse(row.payload);if(q.id!==row.question_id||digest(q)!==row.source_hash)throw Error('Candidate integrity mismatch.');return {...row,q}});
 if(new Set(sources.map(s=>s.question_id)).size!==sources.length)throw Error('Duplicate active source.');
 const decisions=Object.fromEntries(snapshot.decisions.map(r=>{const d=JSON.parse(r.payload);if(r.question_id!==d.id||r.revision!==d.revision)throw Error('Decision integrity mismatch.');return [r.question_id,d]}));
 return {sources,decisions,events:snapshot.events,coverage:snapshot.coverage?JSON.parse(snapshot.coverage):null};
}
export function viewState(snapshot){
 const {sources,decisions,events,coverage}=unpack(snapshot),live=sources.filter(s=>s.is_live),candidates=sources.filter(s=>!s.is_live);
 const records=candidates.map(s=>{const q=s.q,d=decisions[q.id],report=qualityReport([q],sources.filter(p=>p.question_id!==q.id).map(p=>p.q));let evidenceError='';try{assertEvidence(reviewProjection(q,d??{}))}catch(e){evidenceError=e.message}
  return {q,batch:s.batch,sourceDigest:s.source_hash,revision:d?.revision??0,decision:d,status:d&&d.sourceDigest!==s.source_hash?'stale':d?.action??'unreviewed',warnings:report.warnings,errors:report.errors,evidenceError};
 });
 return {records,liveCount:live.length,checks:editorialChecks,difficultyMapping:Array.from({length:10},(_,i)=>({rating:i+1,...mappedDifficulty(i+1)})),history:events.map(e=>({id:e.question_id,event:e.event_key,origin:e.origin,decision:JSON.parse(e.payload)})),coverage:coverage?{summary:coverage.summary,topics:coverage.categories.map(c=>({id:c.id,name:c.name,live:coverage.questionInventory.filter(q=>q.publicationState==='live-reviewed'&&q.curriculumCategories.includes(c.id)).length,candidates:coverage.questionInventory.filter(q=>q.publicationState==='candidate-not-live'&&q.curriculumCategories.includes(c.id)).length}))}:null};
}
export function makeDecision(snapshot,input,user,projectUrl,now=new Date().toISOString()){
 const {sources,decisions}=unpack(snapshot),source=sources.find(s=>s.question_id===input.id&&!s.is_live);if(!source)throw Error('Unknown unpublished candidate.');
 if(!['approve','revise','reject'].includes(input.action)||typeof input.notes!=='string'||!input.notes.trim()||input.notes.length>20000)throw Error('Valid decision and rationale required.');
 if(input.sourceDigest!==source.source_hash||input.expectedRevision!==(decisions[input.id]?.revision??0))throw Object.assign(Error('Stale review: reload before saving.'),{status:409});
 const d={id:input.id,action:input.action,reviewer:user.email,notes:input.notes.trim(),sourceDigest:source.source_hash,revision:input.expectedRevision+1,savedAt:now,checks:input.checks??{},optionRationales:input.optionRationales??[],resolvedWarnings:input.resolvedWarnings??[],...(input.citations!==undefined?{citations:input.citations}:{}),curriculumDifficulty:input.curriculumDifficulty??null,hosted:{projectUrl,actorId:user.id}};
 // Validate sidecar shape even for unfinished decisions, so malformed drafts cannot break browsing.
 reviewProjection(source.q,d);
 if(d.action==='approve')approvalFor(source.q,d,sources.filter(s=>s.question_id!==input.id).map(s=>s.q));
 return d;
}
