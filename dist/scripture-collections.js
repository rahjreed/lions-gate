import {canon,oldTestament,newTestament,apocrypha} from './question-rules.js';
export const scriptureCollections=Object.freeze([
 Object.freeze({id:'kjv80',name:'Original KJV 80',subtitle:'66 Books + Apocrypha'}),
 Object.freeze({id:'kjv66',name:'Traditional KJV 66',subtitle:'Old and New Testaments'})
]);
export const validCollection=id=>scriptureCollections.some(c=>c.id===id);
// Undefined metadata means the full collection used by all previous releases.
export const collectionFor=run=>run?.scriptureCollection==='kjv66'?'kjv66':'kjv80';
const full=new Set(canon),traditional=new Set([...oldTestament,...newTestament]);
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const apocryphaText=new RegExp('\\b(?:'+apocrypha.map(escape).join('|')+')\\b','i');
export function questionInCollection(q,id='kjv80'){
 if(!validCollection(id)||!q?.scripture||!Array.isArray(q.supportingScriptures??[]))return false;
 const books=id==='kjv66'?traditional:full,citations=[q.scripture,...(q.supportingScriptures||[])];
 if(!citations.every(s=>s&&books.has(s.book)))return false;
 // Exclude the whole record rather than altering an approved explanation or
 // distractor that explicitly names an Apocrypha book. Citations remain intact.
 return id!=='kjv66'||!apocryphaText.test(JSON.stringify([q.q,q.options,q.explain,q.trap,q.topic,q.category]));
}
export const questionsForCollection=(bank,id='kjv80')=>bank.filter(q=>questionInCollection(q,id));
export function collectionScreen(){return `<section class="menu-screen collection-screen"><p class="kicker">A NEW JOURNEY</p><h1 id="screen-title" tabindex="-1">Choose Your Scripture Collection</h1><p class="collection-prompt">Which collection will guide your journey?</p><div class="collection-options">${scriptureCollections.map(c=>`<button class="collection-choice" data-action="choose-${c.id}"><strong>${c.name}</strong><span>${c.subtitle}</span></button>`).join('')}</div><button class="button collection-back" data-action="cancel-start">← BACK</button></section>`}
