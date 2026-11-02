import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scriptureCollections,collectionScreen,collectionFor,questionInCollection,questionsForCollection} from '../dist/scripture-collections.js';
import {questions} from '../dist/questions.js';
import {canon,oldTestament,newTestament,apocrypha} from '../dist/question-rules.js';
import {createRun,selectQuestions,beginLevel,submit,advance,nextLevel,retryLevel,usePower,validRun} from '../dist/engine.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
import {answerRevealMarkup} from '../dist/answer-reveal.js';
import {collectionRevision,beforeCollectionFeature} from './collection-flow-revision.mjs';
const original=JSON.stringify(questions),books66=new Set([...oldTestament,...newTestament]),apo=new Set(apocrypha);
assert.equal(canon.length,80);assert.equal(books66.size,66);
assert.deepEqual(scriptureCollections.map(c=>[c.id,c.name,c.subtitle]),[['kjv80','Original KJV 80','66 Books + Apocrypha'],['kjv66','Traditional KJV 66','Old and New Testaments']]);
const screen=collectionScreen();assert.match(screen,/Choose Your Scripture Collection/);assert.match(screen,/Which collection will guide your journey\?/);assert.ok(screen.indexOf('Original KJV 80')<screen.indexOf('Traditional KJV 66'));assert.equal((screen.match(/class="collection-choice"/g)||[]).length,2);assert.doesNotMatch(screen,/checked|aria-checked|aria-selected|autofocus|selected/);
const pool66=questionsForCollection(questions,'kjv66'),pool80=questionsForCollection(questions,'kjv80');assert.equal(pool66.length,250);assert.equal(pool80.length,260);assert.ok(pool80.some(q=>apo.has(q.scripture.book)));assert.ok(pool66.every(q=>[q.scripture,...q.supportingScriptures||[]].every(s=>books66.has(s.book))));
for(const q of pool66){const html=answerRevealMarkup({q,last:{correct:true,choice:q.answer,earned:100},streak:0});for(const book of apocrypha)assert.ok(!html.includes(book),'66 reveal leaked '+book);}
const base=pool66[0],apocryphal=pool80.find(q=>apo.has(q.scripture.book));
assert.equal(questionInCollection({...base,supportingScriptures:[apocryphal.scripture]},'kjv66'),false);assert.equal(questionInCollection({...base,supportingScriptures:[apocryphal.scripture]},'kjv80'),true);
assert.equal(questionInCollection({...base,explain:'Compare Tobit 1:1.'},'kjv66'),false);
for(const id of ['kjv80','kjv66'])for(const book of ['Enoch','Jubilees','Jasher'])assert.equal(questionInCollection({...base,scripture:{...base.scripture,book}},id),false);
let seed=12345;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const assertQueue=run=>{assert.equal(new Set(run.queue.slice(0,10).map(q=>q.id)).size,10);assert.ok(run.queue.every(item=>questionInCollection(questions.find(q=>q.id===item.id),collectionFor(run))));assert.ok(validRun(run,questions));};
const apocryphaSeen=new Set();
for(const id of ['kjv80','kjv66']){
 const run=createRun(questions,'Collection QA',random,id);
 for(const level of [1,2,5,35,75,110,150,225,260,300,375,450,525,700,10001]){
  run.level=level;run.completed=level-1;beginLevel(run,questions,random);assertQueue(run);
  for(const item of run.queue){const q=questions.find(q=>q.id===item.id);if(apo.has(q.scripture.book))apocryphaSeen.add(q.id);run.history[item.id]={count:(run.history[item.id]?.count||0)+1,last:++run.asked,lastCorrect:true};}
 }
}
assert.ok(apocryphaSeen.size>0,'80 mode actually serves approved Apocrypha');
const roundtrip=run=>{const p=emptyProfile();captureProgress(p,run);const storage={value:null,getItem(){return this.value},setItem(_,s){this.value=s}};saveProfile(storage,p);const restored=loadProfile(storage,questions);assert.ok(restored.run);assert.equal(restored.run.scriptureCollection,run.scriptureCollection);assert.equal(restored.run.id,run.id);assert.equal(restored.run.level,run.level);assert.equal(restored.run.score,run.score);assert.deepEqual(restored.run.queue,run.queue);return restored;};
for(const id of ['kjv80','kjv66'])for(const level of [1,5,700]){
 const run=createRun(questions,'Saved '+id,random,id);run.level=level;run.completed=level-1;beginLevel(run,questions,random);
 for(const outcome of ['blocked-timeout','wrong',...Array(10).fill('correct')]){
  const q=questions.find(q=>q.id===run.queue[run.index].id);if(outcome==='blocked-timeout')assert.ok(usePower(run,questions,'shield'));
  assert.ok(submit(run,questions,outcome==='correct'?q.answer:outcome==='blocked-timeout'?-1:(q.answer+1)%4));roundtrip(run);assert.ok(advance(run,questions,random));assertQueue(run);
 }
 assert.equal(run.answers.length,12);assert.equal(run.status,'levelup');assert.equal(run.lives,4);assert.ok(nextLevel(run,questions,random));assert.equal(run.scriptureCollection,id);assertQueue(run);
 for(let i=0;i<4;i++){assert.ok(submit(run,questions,-1));assert.ok(advance(run,questions,random));}assert.equal(run.status,'gameover');roundtrip(run);
 const old=run.queue.map(q=>q.id);assert.ok(retryLevel(run,questions,random));assert.equal(run.scriptureCollection,id);assert.equal(run.lives,5);assertQueue(run);assert.notDeepEqual(run.queue.map(q=>q.id),old);roundtrip(run);
}
const legacy=createRun(questions,'Legacy Name',random);delete legacy.scriptureCollection;const p=emptyProfile();p.run=legacy;p.nickname='Legacy Name';p.bestScore=12345;p.badges=['Flawless'];p.armor.unlocked=['belt'];p.bestCompleted=75;
const store={value:JSON.stringify(p),getItem(){return this.value},setItem(_,s){this.value=s}};const restored=loadProfile(store,questions);assert.equal(collectionFor(legacy),'kjv80');assert.equal(restored.run.scriptureCollection,'kjv80');assert.equal(restored.run.id,legacy.id);assert.equal(restored.nickname,'Legacy Name');assert.equal(restored.bestScore,12345);assert.ok(restored.badges.includes('Flawless'));assert.ok(restored.armor.unlocked.includes('belt'));
const bad=createRun(questions,'Bad queue',random,'kjv66');bad.queue[0].id=apocryphal.id;assert.equal(validRun(bad,questions),false);assert.equal(submit(bad,questions,apocryphal.answer),false);
assert.throws(()=>selectQuestions(pool80.filter(q=>apo.has(q.scripture.book)),{level:10001,scriptureCollection:'kjv66'},random),/At least ten/,'Empty constrained pools fail promptly rather than looping');
for(const [path]of Object.entries(collectionRevision.files)){const source=(await readFile(new URL('../'+path,import.meta.url),'utf8')).replace(/\r\n/g,'\n');beforeCollectionFeature(path,source);assert.throws(()=>beforeCollectionFeature(path,source+' '));}
assert.equal(JSON.stringify(questions),original,'Approved bank and evidence must remain immutable');
console.log(`PASS collections: 260/250 shared-bank pools; ${apocryphaSeen.size} Apocrypha questions actually selected in 80 mode; 66 primary/support/display exclusions; exact unselected ordered choices; stages through 10001; extended battles, shields/timeouts, Gatekeepers, Master retries, save roundtrips, legacy defaults, corrupted-queue rejection, bounded empty-pool errors and immutable questions.`);
