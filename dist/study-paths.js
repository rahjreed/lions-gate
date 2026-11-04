import {canon,oldTestament,newTestament,apocrypha} from './question-rules.js';
import {questionInCollection} from './scripture-collections.js';
import {lessonFor} from './lessons.js';
export const studyPaths=Object.freeze([
 {id:'complete',name:'COMPLETE SCRIPTURE — OT + NT',subtitle:'The full journey toward the Kingdom.'},
 {id:'ot',name:'OLD TESTAMENT ONLY',subtitle:'Study the Law, History, Wisdom, and Prophets.'},
 {id:'nt',name:'NEW TESTAMENT ONLY',subtitle:'Study the Gospels, Apostles, and their teachings.'}
].map(Object.freeze));
export const validStudyPath=id=>studyPaths.some(p=>p.id===id);
export const studyPathFor=run=>run?.studyPath===undefined?'complete':run.studyPath;
export const kingdomEligible=run=>studyPathFor(run)==='complete';
export function booksForStudy(collection,path){return new Set(path==='nt'?newTestament:path==='ot'?[...oldTestament,...(collection==='kjv80'?apocrypha:[])]:collection==='kjv80'?canon:[...oldTestament,...newTestament]);}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Names come only from the existing canon. Conservative full-book mentions in
// retained lesson/context text exclude the record; no approved text is edited.
const namedBooks=canon.map(book=>({book,pattern:new RegExp('\\b'+escape(book)+'\\b'),citation:new RegExp('\\b'+escape(book)+'\\s+\\d+','i')}));
const cache=new WeakMap();
export function questionInStudy(q,collection='kjv80',path='complete'){
 if(!validStudyPath(path)||!questionInCollection(q,collection))return false;
 if(path==='complete')return true;
 let saved=cache.get(q);const key=collection+':'+path;if(saved?.has(key))return saved.get(key);
 const books=booksForStudy(collection,path),lesson=lessonFor(q),refs=[q.scripture,...q.supportingScriptures||[],lesson.primary,...lesson.related];
 const text=JSON.stringify([q.q,q.options,q.correctAnswer,q.explain,q.trap,q.topic,q.category,q.knowledge,lesson]);
 const allowed=refs.every(s=>books.has(s.book))&&!namedBooks.some(({book,pattern,citation})=>!books.has(book)&&(pattern.test(text)||citation.test(text)));
 if(!saved){saved=new Map();cache.set(q,saved)}saved.set(key,allowed);return allowed;
}
export const questionsForStudy=(bank,collection,path)=>bank.filter(q=>questionInStudy(q,collection,path));
export function studyPathScreen(){return `<section class="menu-screen collection-screen study-path-screen"><p class="kicker">A NEW JOURNEY</p><h1 id="screen-title" tabindex="-1">CHOOSE YOUR STUDY PATH</h1><p class="study-path-note">Complete the full Scripture journey to unlock the Kingdom.</p><div class="collection-options">${studyPaths.map(p=>`<button class="collection-choice" data-action="path-${p.id}"><strong>${p.name}</strong><span>${p.subtitle}</span></button>`).join('')}</div><p class="study-path-note">OT-only and NT-only journeys reach a study-path completion at Level 700. You may continue studying afterward.</p><button class="button collection-back" data-action="cancel-start">← BACK</button></section>`;}
export function studyCompletionMarkup(run){if(run?.status!=='levelup'||run.level!==700||run.completed<700||kingdomEligible(run))return '';const label=studyPaths.find(p=>p.id===run.studyPath)?.name;if(!label)return '';return `<section class="study-completion" aria-label="Study path completed"><h2>${label} — STUDY PATH COMPLETE</h2><p>You completed Level 700 on your chosen study path. Your earned progress and achievements are kept. Continue studying beyond this milestone if you wish.</p><p>Complete the full Scripture journey to unlock the Kingdom. This alternate path does not grant Kingdom arrival or completion.</p></section>`;}
