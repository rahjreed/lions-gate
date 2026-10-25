// Curriculum metadata is independent of combat timers, ranks and saved queues.
export const knowledgeCategories=[
 ['people','Biblical people, places, and events'],
 ['torah','Commandments, Torah, and biblical law'],
 ['yeshua','Teachings of Yeshua'],
 ['connections','New Testament connections to the Old Testament'],
 ['context','Difficult and commonly misunderstood passages'],
 ['kingdom','Prophecy, judgment, and the Kingdom'],
 ['discernment','Complex Scripture interpretation, discernment, and leadership']
].map(([id,name])=>({id,name}));
const groups={
 people:['moses-brother','jonah-days','antioch-name','raphael','apollos-origin','lydia-city','sychar'],
 torah:['sabbath-day','unleavened-days','honor-parents','creation-rest','land-animals','water-creatures','six-days','teach-children','receive-commandments'],
 yeshua:['love-commandments','weightier-matters'],
 connections:['spirit-sword','vengeance','law-prophets-psalms','salem-meaning'],
 context:['wise-count','wise-house','david-stones','hands-complaint','hands-conclusion','establish-law','command-tradition','grace-sin','keeping-commandments'],
 kingdom:['city-descends','esdras-comparison'],
 discernment:['wisdom-soul','hear-first','guard-heart','trust-lord','hope-deferred','enemy-falls','learned-leisure','measure-number-weight','doers-word']
};
export const legacyKnowledge=Object.fromEntries(Object.entries(groups).flatMap(([category,ids])=>ids.map(id=>[id,category])));
export const knowledgeFor=q=>q.knowledge||{category:legacyKnowledge[q.id]||'people',complexity:q.difficulty,concept:q.id,mode:'explicit'};
export function knowledgeStage(level){
 if(!Number.isSafeInteger(level)||level<1)throw Error('Positive safe level required.');
 const stage=Math.min(7,Math.floor((level-1)/75)+1),position=level>525?75:(level-1)%75+1;
 const target=1+Math.min(524,level-1)*6/524;
 return {stage,position,category:knowledgeCategories[stage-1].id,target,bossTarget:Math.min(7,target+1),endless:level>525};
}
export const normalizedText=text=>String(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Longer specific answers can inadvertently disclose another question's answer.
export function answerConflict(a,b){
 const includes=(question,answer)=>{const text=normalizedText(answer);return text.length>=12&&(` ${normalizedText(question)} `).includes(` ${text} `)};
 return normalizedText(a.q)===normalizedText(b.q)||includes(a.q,b.correctAnswer)||includes(b.q,a.correctAnswer);
}
