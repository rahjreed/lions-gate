import assert from 'node:assert/strict';
import {JourneyDirector,journeyLocations,locationFor,gateProgress} from '../dist/adventure.js';
import {createRun,submit,advance,nextLevel} from '../dist/engine.js';
import {questions} from '../dist/questions.js';
import {loadProfile,saveProfile,emptyProfile} from '../dist/storage.js';
import {judah} from '../dist/mascot.js';
import {readFileSync} from 'node:fs';
import {combatDuration,combatFrames} from '../dist/combat.js';
const artCSS=readFileSync(new URL('../dist/adventure-frames.css',import.meta.url),'utf8');
const visualDuration=name=>Number(artCSS.match(new RegExp(`judah-${name}-sequence ([.\\d]+)s steps`))[1])*1000;
assert.equal(visualDuration('slash'),combatDuration,'Judah attack recovers before combat ends');
assert.equal(visualDuration('recoil'),combatDuration-combatFrames.find(f=>f.phase==='impact').at,'Judah hit recovery fits the remaining combat window');
for(const pose of ['slash','recoil'])assert.match(artCSS,new RegExp(`@keyframes judah-${pose}-sequence\\{[^\\n]*100\\.000000%\\{background-position-x:11\\.320755%`),'Combat ends on the canonical guard');
let time=0,id=0,timers=new Map();const clock={now:()=>time,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id},clearTimer:id=>timers.delete(id)};
function tick(ms){const end=time+ms;while(true){const due=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!due||due[1].at>end)break;time=due[1].at;timers.delete(due[0]);due[1].fn()}time=end}
const phases=[],d=new JourneyDirector(clock);let finishes=0;
d.start({onPhase:p=>phases.push(p.name),onFinish:()=>finishes++});tick(950);assert.deepEqual(phases,['walk','run']);d.pause();tick(50000);assert.equal(finishes,0);assert.equal(timers.size,0);d.resume();tick(3050);assert.deepEqual(phases,['walk','run','arrival','intro']);assert.equal(finishes,1);assert.equal(d.finish(),false);assert.equal(timers.size,0);
d.start({onPhase:()=>{},onFinish:()=>finishes++});tick(100);d.finish();d.finish();tick(10000);assert.equal(finishes,2);
d.start({onPhase:()=>{},onFinish:()=>finishes++});d.cancel();tick(10000);assert.equal(finishes,2);
// Engine state stays on the completed level for the entire journey; finish once.
const run=createRun(questions,'JOURNEY TEST');
for(let level=1;level<=5;level++){
 for(let i=0;i<10;i++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions)}
 assert.equal(run.status,'levelup');assert.deepEqual(gateProgress(run),{broken:10,total:10,open:true});const before=structuredClone(run);
 d.start({onPhase:()=>{},onFinish:()=>nextLevel(run,questions)});tick(2200);assert.deepEqual(run,before);d.pause();tick(60000);assert.deepEqual(run,before);d.resume();if(level%2)d.finish();else tick(1800);
 assert.equal(run.level,level+1);assert.equal(run.status,'playing');assert.equal(run.remaining,run.level%5===0?45:run.level<5?40:45);assert.equal(timers.size,0);
}
assert.deepEqual(gateProgress({answers:[{correct:true},{correct:false},{correct:true}],status:'feedback'}),{broken:2,total:10,open:false});
assert.equal(locationFor(5)[0],'lions-gate');assert.equal(locationFor(10)[0],'lions-gate');assert.equal(journeyLocations.length,7);assert.equal(new Set(Array.from({length:100},(_,i)=>locationFor(i+2)[0])).size,7);
for(const n of [0,5,15,30,50,60])for(const pose of ['stance','ready','slash','celebrate','recoil','walk','run','victory','transform']){const art=judah(n,pose,false);assert.ok(art.includes(`data-pose="${pose}"`));assert.ok(art.includes('-adventure.png'));assert.ok(art.includes('role="img"'));}
const p=emptyProfile();p.settings.shortJourneys=true;const storage={getItem:()=>storage.data,setItem:(k,v)=>storage.data=v};saveProfile(storage,p);assert.equal(loadProfile(storage,questions).settings.shortJourneys,true);delete p.settings.shortJourneys;saveProfile(storage,p);assert.equal(loadProfile(storage,questions).settings.shortJourneys,false);
console.log('PASS adventure: four phases, hidden-tab suspension, exactly-once skip, cancellation, five complete levels, frozen quiz state/timer, correct-only seals, seven routes, rank/pose coverage and backwards-compatible transition preference.');
