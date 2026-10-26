import assert from 'node:assert/strict';
import {opponentFor} from '../dist/opponents.js';
import {CombatDirector,combatFrames,combatDuration,defeatStart,defeatDuration,combatHealth,combatHealthMarkup,paintCombat} from '../dist/combat.js';
import {createRun,submit,advance,nextLevel,usePower} from '../dist/engine.js';
import {questions} from '../dist/questions.js';
for(const outcome of ['correct','wrong','timeout','shield']){
 const run=createRun(questions),q=questions.find(q=>q.id===run.queue[0].id);
 if(outcome==='shield')run.shielded=true;
 const choice=outcome==='correct'?q.answer:outcome==='timeout'?-1:(q.answer+1)%4;
 assert.ok(submit(run,questions,choice));
 const snapshot=structuredClone(run),jobs=[],frames=[];let impact=0,finish=0;
 const director=new CombatDirector({setTimer:(fn,ms)=>{jobs.push({fn,ms});return jobs.length},clearTimer:()=>{}});
 const callbacks={correct:run.answers.at(-1).correct,onFrame:f=>frames.push(f),onImpact:()=>impact++,onFinish:()=>finish++};
 assert.ok(director.start(callbacks));assert.equal(director.start(callbacks),false);
 assert.equal(submit(run,questions,choice),false);
 for(const job of jobs)job.fn();
 assert.equal(impact,1);assert.equal(finish,1);assert.equal(director.active,false);
 assert.deepEqual(frames.map(f=>f.phase),combatFrames.map(f=>f.phase));
 assert.equal(frames[2].enemy,outcome==='correct'?4:2);
 assert.equal(jobs.at(-1).ms,combatDuration);assert.deepEqual(run,snapshot);
 assert.equal(run.lives,outcome==='wrong'||outcome==='timeout'?2:3);
 director.start(callbacks);director.cancel();const before=[impact,finish];jobs.forEach(j=>j.fn());assert.deepEqual([impact,finish],before);
 director.start({...callbacks,reducedMotion:true});assert.deepEqual([impact,finish],before.map(x=>x+1));
 assert.deepEqual(run,snapshot);
}
console.log('PASS combat: both outcomes, timeout, shield, single impact, duplicate rejection, cancellation, reduced motion, immutable score/lives.');

// Health is derived from actual answers/lives. No persistent HP counter exists.
for(const outcome of ['correct','wrong','timeout','shield']){
 const run=createRun(questions),q=questions.find(q=>q.id===run.queue[0].id),before={...combatHealth(run)};
 if(outcome==='shield')usePower(run,questions,'shield');
 const choice=outcome==='correct'?q.answer:outcome==='timeout'?-1:(q.answer+1)%4;
 submit(run,questions,choice);const result=structuredClone(run);
 assert.deepEqual(combatHealth(run,before),before,'Pending display waits for impact');
 const expected={hits:outcome==='correct'?1:0,enemy:outcome==='correct'?90:100,lives:['wrong','timeout'].includes(outcome)?2:3};
 assert.deepEqual(combatHealth(run),expected);
 assert.equal(submit(run,questions,choice),false);assert.deepEqual(combatHealth(run),expected,'Duplicate events cannot subtract HP');
 assert.deepEqual(run,result,'Health rendering cannot change engine/save state');
 assert.match(combatHealthMarkup(run),/aria-label="JUDAH health"/);
 assert.ok(combatHealthMarkup(run).includes(`aria-label="${opponentFor(run.level).name} health"`));
}
// An imperfect clear retains enemy health; next level resets only the enemy.
const imperfect=createRun(questions);
for(let i=0;i<10;i++){
 const q=questions.find(q=>q.id===imperfect.queue[imperfect.index].id);
 submit(imperfect,questions,i===0?-1:q.answer);advance(imperfect,questions);
}
assert.equal(imperfect.status,'levelup');assert.deepEqual(combatHealth(imperfect),{hits:9,enemy:10,lives:2});
nextLevel(imperfect,questions);assert.deepEqual(combatHealth(imperfect),{hits:0,enemy:100,lives:2});
const lost=createRun(questions);
for(let i=0;i<3;i++){submit(lost,questions,-1);advance(lost,questions)}
assert.equal(lost.status,'gameover');assert.equal(combatHealth(lost).lives,0);

const perfect=createRun(questions);
for(let i=0;i<9;i++){const q=questions.find(q=>q.id===perfect.queue[perfect.index].id);submit(perfect,questions,q.answer);advance(perfect,questions)}
const before={...combatHealth(perfect)},q=questions.find(q=>q.id===perfect.queue[9].id);
submit(perfect,questions,q.answer);assert.equal(combatHealth(perfect,before).enemy,10);assert.equal(combatHealth(perfect).enemy,0);
const jobs=[],phases=[];let impacts=0,finished=0;
const director=new CombatDirector({setTimer:(fn,ms)=>{jobs.push({fn,ms});return jobs.length},clearTimer:()=>{}});
const callbacks={correct:true,enemyDefeated:true,onFrame:f=>phases.push(f),onImpact:()=>impacts++,onFinish:()=>finished++};
director.start(callbacks);assert.equal(director.start(callbacks),false);
for(const job of jobs.filter(j=>j.ms<=combatDuration))job.fn();
assert.equal(impacts,1);assert.equal(finished,0);assert.equal(director.active,true,'Reveal/Continue stays gated during the fall');
assert.equal(phases.at(-1).phase,'defeat');assert.equal(phases.at(-1).heroReady,true);
assert.equal(jobs.at(-1).ms,defeatStart+defeatDuration);
jobs.at(-1).fn();assert.equal(finished,1);assert.equal(director.active,false);assert.equal(phases.at(-1).phase,'defeated');
director.start(callbacks);director.cancel();const counts=[impacts,finished];jobs.forEach(j=>j.fn());assert.deepEqual([impacts,finished],counts,'Canceled fall cannot open a stale reveal');
director.start({...callbacks,reducedMotion:true});assert.equal(phases.at(-1).phase,'defeated');assert.deepEqual([impacts,finished],counts.map(n=>n+1));
assert.equal(perfect.status,'feedback','Presentation does not advance a level');
console.log('PASS health/defeat: derived HP, impact snapshot, correct/wrong/timeout/shield, duplicates, imperfect clear, carry-over lives, reset enemy, zero lives, gated fall completion, cancel and reduced motion.');
// Pausing at any combat boundary retains pending time and exactly-once effects.
for(const correct of [true,false])for(const enemyDefeated of [true,false])for(const pauseAt of [0,139,140,239,240,339,539,540,700,919]){
 let now=0,id=0,impact=0,finish=0;const jobs=new Map(),frames=[];
 const tick=ms=>{const end=now+ms;while(true){const entry=[...jobs.entries()].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;jobs.delete(entry[0]);now=entry[1].at;entry[1].fn()}now=end};
 const d=new CombatDirector({now:()=>now,setTimer:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id},clearTimer:id=>jobs.delete(id)});
 d.start({correct,enemyDefeated,onFrame:f=>frames.push(f.phase),onImpact:()=>impact++,onFinish:()=>finish++});tick(pauseAt);
 const stale=[...jobs.values()],before=[impact,finish,frames.length];d.pause();d.pause();tick(60000);stale.forEach(j=>j.fn());assert.deepEqual([impact,finish,frames.length],before,'Hidden time and stale callbacks cannot progress combat');
 d.resume();d.resume();tick(2000);assert.equal(impact,1);assert.equal(finish,1);assert.equal(d.active,false);
 assert.equal(frames.length,new Set(frames.filter(p=>p!=='defeat')).size+frames.filter(p=>p==='defeat').length);
 d.start({correct,onFrame:()=>{},onImpact:()=>impact++,onFinish:()=>finish++});d.pause();d.cancel();d.resume();tick(2000);assert.equal(impact,1);assert.equal(finish,1);
}
console.log('PASS combat pause: 40 boundary/outcome combinations, background suspension, precise remaining delays, stale callbacks, repeated pause/resume, cancellation and single impact/finish.');

// Pose changes must retain the travelling actor node and its animation clock.
// This small DOM fixture parses only the production figure attributes it needs.
const hero={dataset:{pose:'ready'},className:'judah judah-ready',innerHTML:'',ownerDocument:{
 createElement(){return {content:{},set innerHTML(html){
  this.content.firstElementChild={className:html.match(/class="([^"]+)"/)[1],innerHTML:html.slice(html.indexOf('>')+1,html.lastIndexOf('</figure>'))};
 }}}
}};
const soldier={classList:{toggle(){}},setAttribute(){},style:{setProperty(name,value){this[name]=value}}},sprite={style:{}},scene={dataset:{},querySelector:s=>s==='.roman-soldier'?soldier:s==='.roman-sprite'?sprite:hero};
for(const completed of [0,35,110,185,260]){
 hero.dataset.pose='ready';
 const equipment=completed===260?['belt']:[];
 for(const [phase,at,enemy,pose] of [['windup',0,0,'run'],['strike',140,0,'slash'],['impact',240,4,'slash'],['recover',540,5,'walk'],['ready',920,0,'ready']]){
  paintCombat(scene,{phase,at,enemy,correct:true},completed,equipment);
  assert.equal(hero.dataset.pose,pose);assert.equal(scene.querySelector('.scene-status>.judah'),hero);
  assert.ok(!Object.hasOwn(hero,'outerHTML'),'Do not replace/restart the actor');
  if(equipment.length)assert.match(hero.innerHTML,/data-armor="belt"/);
 }
 paintCombat(scene,{phase:'impact',at:240,enemy:2,correct:false},completed,equipment);assert.equal(hero.dataset.pose,'recoil');
 paintCombat(scene,{phase:'ready',at:920,enemy:0,correct:false},completed,equipment);assert.equal(hero.dataset.pose,'ready');
}
for(const [enemy,tail] of [28,26,26,66,64,64].entries()){paintCombat(scene,{phase:'impact',at:240,enemy,correct:true},0);assert.equal(Number(soldier.style['--roman-foot']),tail/512)}
paintCombat(scene,{phase:'defeat',at:540,enemy:3,correct:true},0);assert.equal(hero.dataset.pose,'walk');
paintCombat(scene,{phase:'defeat',at:920,enemy:3,correct:true,heroReady:true},0);assert.equal(hero.dataset.pose,'ready');
console.log('PASS combat staging: persistent actor identity/clock, approach/slash/backstep/home, all ranks and belt, wrong recoil, defeat recovery and all six boot anchors.');
