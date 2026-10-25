import {validateQuestions} from '../dist/question-rules.js';
import {normalizedText,answerConflict} from '../dist/knowledge.js';

export function qualityReport(batch,live=[]){
 const errors=[],warnings=[];
 try{validateQuestions(batch,{allowCandidates:true})}catch(error){errors.push(error.message)}
 for(const q of batch)try{validateQuestions([q],{allowCandidates:true})}catch(error){errors.push(error.message)}
 const all=[...live,...batch],ids=new Set(),stems=new Set();
 for(const q of all){
  if(ids.has(q.id))errors.push(`${q.id}: duplicate id across batches`);ids.add(q.id);
  const stem=normalizedText(q.q);if(stems.has(stem))errors.push(`${q.id}: duplicate wording across batches`);stems.add(stem);
 }
 for(const q of batch){
  if(!q.knowledge)errors.push(`${q.id}: new questions require knowledge metadata`);
  const lengths=q.options?.map(o=>o.length)||[];
  if(Math.max(...lengths)>Math.max(25,Math.min(...lengths)*3))warnings.push(`${q.id}: check answer-length clues`);
  if(q.options?.some(o=>/all of the above|none of the above|obviously|always|never/i.test(o)))warnings.push(`${q.id}: check absolute or shortcut distractors`);
  const tokens=new Set(normalizedText(q.q).split(' '));
  for(const p of all){if(p===q)continue;
   const other=new Set(normalizedText(p.q).split(' ')),intersection=[...tokens].filter(t=>other.has(t)).length;
   if(intersection/(tokens.size+other.size-intersection)>.72)warnings.push(`${q.id} / ${p.id}: possible near duplicate`);
   if(answerConflict(q,p))warnings.push(`${q.id} / ${p.id}: possible answer disclosure; do not co-select`);
   if(q.knowledge?.concept===p.knowledge?.concept)warnings.push(`${q.id} / ${p.id}: shared concept; check repetition`);
  }
 }
 return {count:batch.length,errors:[...new Set(errors)],warnings:[...new Set(warnings)],publicationReady:errors.length===0&&batch.every(q=>q.review?.status==='verified')};
}
export const editorialChecks=['passages','references','quotations','singleAnswer','distractors','context','crossQuestion'];
