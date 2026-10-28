import {focusTags} from './focus-questions.js';
import {contentFingerprint,validateQuestions} from './question-rules.js';
import {knowledgeFor,knowledgeStage,normalizedText,answerConflict} from './knowledge.js';

export function selectKnowledgeQuestions(bank,run,random=Math.random,avoid=[],encounterIds=[]){
 const stage=knowledgeStage(run.level),boss=run.level%5===0;
 const target=boss?stage.bossTarget:stage.target,ids=new Set(),stems=new Set();
 // Validate publication state even when a caller passes a mixed import batch.
 const approved=bank.filter(q=>{
  if(q.review?.status!=='verified'||q.review.contentFingerprint!==contentFingerprint(q))return false;
  try{
   validateQuestions([q]);const stem=normalizedText(q.q);
   if(ids.has(q.id)||stems.has(stem))return false;
   ids.add(q.id);stems.add(stem);return true;
  }catch{return false}
 });
 // Extensions must respect disclosure conflicts with the whole encounter,
 // not only with the other items in this newly selected batch. Repeating the
 // same item remains a last-resort option for a constrained approved pool.
 const encounter=new Set(encounterIds),prior=approved.filter(q=>encounter.has(q.id));
 const available=prior.length?approved.filter(q=>!prior.some(p=>p.id!==q.id&&answerConflict(p,q))):approved;
 const eligible=available.filter(q=>knowledgeFor(q).complexity<=Math.ceil(target));
 const pool=eligible.length>=10?eligible:available;
 if(pool.length<10)throw Error('At least ten passage-approved questions are required.');
 const used=run.history||{},asked=run.asked??Object.values(used).reduce((max,h)=>Math.max(max,h.last),0),avoided=new Set(avoid);
 const items=pool.map(q=>{
  const h=used[q.id],gap=h?asked-h.last:Infinity;
  return {q,k:knowledgeFor(q),stem:` ${normalizedText(q.q)} `,answer:normalizedText(q.correctAnswer),
   avoided:avoided.has(q.id),recent:gap<20,
   base:(h?.count||0)*2+(gap<20?20-gap:0)-(h?.lastCorrect===false&&gap>=20?3:0)+random()*.2};
 });
 let selectionTarget=target,totalComplexity=0;
 const selected=[],categories=new Map(),concepts=new Map();
 const focus=item=>item.q.tags.some(t=>focusTags.includes(t));
 const conflict=(a,b)=>a.stem===b.stem||a.answer.length>=12&&b.stem.includes(` ${a.answer} `)||b.answer.length>=12&&a.stem.includes(` ${b.answer} `);
 const cost=item=>item.base+Math.abs(item.k.complexity-selectionTarget)*5+
  (categories.get(item.k.category)||0)*2+(concepts.get(item.k.concept)||0)*5-(item.k.category===stage.category?0.6:0);
 const take=(predicate,n)=>{
  while(n-->0){
   let best=null,bestCost=Infinity;
   // Linear minimum selection avoids repeatedly sorting thousands of records.
   for(const item of items){
    if(selected.includes(item)||!predicate(item)||selected.some(p=>conflict(p,item)))continue;
    const score=cost(item);
    const priority=best?Number(item.avoided)-Number(best.avoided)||Number(item.recent)-Number(best.recent):-1;
    if(priority<0||priority===0&&score<bestCost){best=item;bestCost=score}
   }
   if(!best)break;
   selected.push(best);const k=best.k;
   categories.set(k.category,(categories.get(k.category)||0)+1);concepts.set(k.concept,(concepts.get(k.concept)||0)+1);
   totalComplexity+=k.complexity;
   selectionTarget=Math.max(1,Math.min(7,(target*10-totalComplexity)/Math.max(1,10-selected.length)));
  }
 };
 const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const trapCount=boss?3:2,types=shuffle(['tradition','context','misquote']);
 for(const type of types.slice(0,trapCount))take(item=>focus(item)&&item.q.trapType===type,1);
 take(item=>focus(item)&&item.q.trapType,trapCount-selected.length);
 take(focus,7-selected.filter(focus).length);take(item=>!focus(item),10-selected.length);take(()=>true,10-selected.length);
 if(selected.length<10)throw Error('Not enough non-conflicting reviewed questions for a full level. Review the bank.');
 return shuffle(selected).map(({q})=>({id:q.id,order:shuffle([0,1,2,3])}));
}
