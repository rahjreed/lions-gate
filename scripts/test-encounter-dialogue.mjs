import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {EncounterDialogue,dialogueFor,dialoguePools,pendingDialogue,dialogueMarkup} from '../dist/encounter-dialogue.js';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel,retryLevel,nextLevel,levelConfig} from '../dist/engine.js';
import {emptyProfile,saveProfile,loadProfile,captureProgress} from '../dist/storage.js';
for(const pool of Object.values(dialoguePools)){
 assert.equal(new Set(pool.map(e=>e[0])).size,pool.length);
 for(const pair of pool)for(const line of pair)assert.ok(line.length<=90,'Keep mobile lines brief');
}
const regular=Array.from({length:10000},(_,i)=>i+1).filter(n=>n%5),boss=Array.from({length:2000},(_,i)=>(i+1)*5);
for(const levels of [regular,boss]){
 for(let i=0;i<levels.length;i++){const d=dialogueFor(levels[i]);assert.deepEqual(dialogueFor(levels[i]),d);if(i)assert.notEqual(d.id,dialogueFor(levels[i-1]).id);}
 const size=levels===regular?30:5;assert.equal(new Set(levels.slice(0,size).map(n=>dialogueFor(n).id)).size,size);
}
for(const level of [1,5,335,410,700,1000000,Number.MAX_SAFE_INTEGER])assert.equal(dialogueFor(level).boss,level%5===0);
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
function definition(name){const at=source.indexOf(`function ${name}(`);assert.ok(at>=0);const end=source.indexOf('\nfunction ',at+1);return source.slice(at,end<0?undefined:end).replace(/\n\/\/[^\n]*/g,'');}
const definitions=['stopClock','startClock','setView','beginEncounter','finishEncounter','advanceDialogue','pause','resume','retry','finishJourney'].map(definition).join('\n');
let now=1000,id=0,intervals=new Map();
const store={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};
const profile=emptyProfile();
const c={EncounterDialogue,profile,questions,run:createRun(questions,'INTRO TEST'),encounter:null,view:'title',paused:false,deadline:0,timer:null,pauseFocus:null,document:{hidden:false},window:{scrollTo(){}},Date:{now:()=>now},setInterval:fn=>{intervals.set(++id,fn);return id},clearInterval:id=>intervals.delete(id),clock(){},$:()=>null,render(){},music(){},combat:{active:false,pause(){},resume(){}},director:{cancel(){},pause(){},resume(){}},juice:{enter(){},pause(){},resume(){}},audio:{unlock(){},effect(){}},mountPause(){},releasePause(){},retryLevel,nextLevel,levelConfig,persist(){captureProgress(profile,c.run);saveProfile(store,profile)}};
vm.createContext(c);vm.runInContext(definitions,c);
const gameState=r=>JSON.stringify({...r,dialogue:undefined,rankHighWater:undefined});
let before=gameState(c.run);c.beginEncounter();assert.equal(c.view,'encounter');assert.equal(intervals.size,0);assert.equal(pendingDialogue(c.run),true);
now+=60000;c.advanceDialogue();assert.equal(c.encounter.step,1);assert.equal(intervals.size,0);assert.equal(gameState(c.run),before,'Banter never changes score, lives, queue, timer or rules');
c.pause();const saved=JSON.stringify(c.run);c.advanceDialogue();c.finishEncounter();now+=60000;assert.equal(JSON.stringify(c.run),saved);assert.equal(intervals.size,0);c.document.hidden=true;c.resume();assert.equal(c.paused,true);c.document.hidden=false;c.resume();assert.equal(intervals.size,0,'Resuming dialogue never starts the question clock');
const restored=loadProfile(store,questions);assert.equal(restored.run.dialogue.step,1);assert.equal(pendingDialogue(restored.run),true);c.run=restored.run;c.beginEncounter(true);assert.equal(c.encounter.step,1);
c.advanceDialogue();assert.equal(c.view,'game');assert.equal(intervals.size,1);assert.equal(c.deadline-now,c.run.remaining*1000);assert.equal(pendingDialogue(c.run),false);c.finishEncounter();c.advanceDialogue();assert.equal(intervals.size,1,'Duplicate callbacks cannot restart gameplay');assert.equal(gameState(c.run),before);
for(const level of [1,5,335,410,700]){
 c.run=createRun(questions);c.run.level=level;c.run.completed=level-1;beginLevel(c.run,questions);c.run.status='gameover';c.run.lives=0;
 c.retry();assert.equal(c.view,'encounter');assert.equal(c.run.level,level);assert.equal(c.run.lives,5);assert.equal(intervals.size,0);assert.equal(c.encounter.step,0);const retryState=gameState(c.run);
 c.finishEncounter();assert.equal(c.view,'game');assert.equal(gameState(c.run),retryState,'Immediate retry skip cannot advance a question or alter rewards');
}
c.run.status='levelup';const previous=c.run.level;c.finishJourney();assert.equal(c.run.level,previous+1);assert.equal(c.view,'encounter');assert.equal(intervals.size,0,'Journey arrival pauses for dialogue before Q1');
profile.settings.skipDialogue=true;c.beginEncounter();assert.equal(c.view,'game');assert.equal(c.run.dialogue.done,true);assert.equal(intervals.size,1);assert.equal(loadProfile(store,questions).settings.skipDialogue,true);
delete profile.settings.skipDialogue;saveProfile(store,profile);assert.equal(loadProfile(store,questions).settings.skipDialogue,false,'Old saves default to dialogue on');
for(const level of [1,5]){const session=new EncounterDialogue(level),first=dialogueMarkup(session,'<script>');assert.ok(first.includes('&lt;script&gt;'));assert.ok(first.includes('disabled aria-hidden="true"'));session.next();const reply=dialogueMarkup(session,'Marcus');assert.ok(reply.includes('BEGIN BATTLE'));session.skip();assert.equal(session.next(),false);assert.equal(session.skip(),false);}
assert.match(source,/if\(pendingDialogue\(run\)\)return beginEncounter\(true\)/);
assert.match(source,/if\(view!=='game'\|\|!run/,'No hidden answer input during introductions');
assert.match(source,/dialogue-setting/);assert.match(source,/dialogue-disable/);
console.log('PASS encounter dialogue: 30 regular/5 boss exchanges; deterministic full-cycle variety; manual phases; fresh/retry/journey entry; immediate skip; immutable gameplay; frozen clock; pause/background/restore; idempotent completion; persisted opt-out; escaped accessible markup.');
