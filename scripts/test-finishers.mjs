import assert from 'node:assert/strict';
import './test-roman-knockout.mjs';
import {readFile} from 'node:fs/promises';
import {CombatDirector,combatDuration,defeatStart,defeatDuration,groundContactAt,bounceAt,settleAt,finisherVariation,combatHealth,combatDamageFeedback} from '../dist/combat.js';
import {createRun,submit,advance,retryLevel,usePower} from '../dist/engine.js';
import {questions} from '../dist/questions.js';
assert.equal(defeatStart+defeatDuration,1600);assert.equal(combatDuration,920);
assert.notEqual(finisherVariation(1),finisherVariation(2));assert.equal(finisherVariation(1),finisherVariation(3));
function clock(){let now=0,id=0;const jobs=new Map();return {get now(){return now},options:{now:()=>now,setTimer:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id},clearTimer:id=>jobs.delete(id)},jobs,tick(ms){const end=now+ms;while(true){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;jobs.delete(due[0]);now=due[1].at;due[1].fn()}now=end}}}
for(const target of ['enemy','judah'])for(const variation of ['rising','sweep'])for(const reducedMotion of [false,true]){
 const run=createRun(questions);if(target==='enemy')for(let i=0;i<9;i++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions)}else run.lives=1;
 const before=combatHealth(run),q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,target==='enemy'?q.answer:-1);const after=structuredClone(run),feedback=combatDamageFeedback(before,combatHealth(run),run.answers.at(-1));
 assert.equal(feedback.text,target==='enemy'?'-10':'-1 LIFE');
 const c=clock(),d=new CombatDirector(c.options),frames=[];let impact=0,finish=0;
 const options={correct:target==='enemy',enemyDefeated:target==='enemy',heroDefeated:target==='judah',variation,reducedMotion,onFrame:f=>frames.push(f),onImpact:()=>impact++,onFinish:()=>finish++};
 assert.equal(d.start(options),true);if(!reducedMotion)assert.equal(d.start(options),false);
 if(!reducedMotion){c.tick(239);assert.equal(impact,0);c.tick(1);assert.equal(impact,1);c.tick(groundContactAt-240);assert.equal(finish,0);assert.equal(frames.at(-1).phase,target==='enemy'?'ground':'hero-ground');c.tick(bounceAt-groundContactAt);assert.ok(frames.at(-1).phase.endsWith('bounce'));c.tick(settleAt-bounceAt);assert.equal(finish,0);c.tick(1600-settleAt);}
 if(reducedMotion&&target==='enemy'){assert.equal(impact,1);assert.equal(finish,0);assert.equal(frames.at(-1).phase,'settle');c.tick(320)}
 assert.equal(impact,1);assert.equal(finish,1);assert.equal(d.active,false);assert.equal(frames.at(-1).phase,target==='enemy'?'defeated':'hero-defeated');assert.equal(frames.at(-1).finisher,target);assert.deepEqual(run,after,'Finishing presentation does not apply extra damage/rewards');
 assert.equal(run.status,'feedback');advance(run,questions);assert.equal(run.status,target==='enemy'?'levelup':'gameover');if(target==='judah'){assert.equal(retryLevel(run,questions),true);assert.equal(run.lives,5);}
}
// Background time, repeat pause/resume, cancellation and stale callbacks at every fall boundary.
for(const target of ['enemy','judah'])for(const at of [0,140,239,240,539,540,919,920,1209,1210,1329,1330,1470,1599]){
 const c=clock(),d=new CombatDirector(c.options),events=[];let impact=0,finish=0;d.start({correct:target==='enemy',enemyDefeated:target==='enemy',heroDefeated:target==='judah',onFrame:f=>events.push(f.phase),onImpact:()=>impact++,onFinish:()=>finish++});c.tick(at);d.pause();const old=[...c.jobs.values()],snapshot=[impact,finish,events.length];c.tick(60000);old.forEach(j=>j.fn());assert.deepEqual([impact,finish,events.length],snapshot);d.resume();d.resume();c.tick(1600-at);assert.equal(finish,1);assert.equal(impact,1);assert.equal(c.jobs.size,0);
 const c2=clock(),other=new CombatDirector(c2.options);other.start({correct:target==='enemy',enemyDefeated:target==='enemy',heroDefeated:target==='judah',onFrame(){},onImpact(){},onFinish:()=>finish++});c2.tick(at);other.pause();other.cancel();other.resume();c2.tick(5000);assert.equal(finish,1);
}
// Existing powers are support powers, not offensive combo triggers.
for(const power of ['fifty','time','shield']){
 const r=createRun(questions),available=r.powers[power];assert.equal(usePower(r,questions,power),true);const q=questions.find(q=>q.id===r.queue[r.index].id);submit(r,questions,q.answer);assert.equal(combatHealth(r).enemy,90);assert.equal(r.powers[power],available-1);assert.equal(r.score,100);
 const c=clock(),d=new CombatDirector(c.options),snapshot=structuredClone(r);let hits=0;d.start({correct:true,onFrame(){},onImpact:()=>hits++,onFinish(){}});c.tick(920);assert.equal(d.active,false);assert.equal(hits,1);assert.deepEqual(r,snapshot);
}
const css=await readFile(new URL('../dist/combat.css',import.meta.url),'utf8');for(const key of ['roman-finish-rise','roman-finish-sweep','judah-final-fall','75.625%','83.125%','prefers-reduced-motion'])assert.ok(css.includes(key));
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');assert.match(app,/heroDefeated:!last.correct&&!last.shielded&&run.lives===0/);assert.match(app,/onFinish:[^\n]+answerReveal.open/);assert.match(app,/function proceed\(\)\{if\(paused\|\|combat.active/);
console.log('PASS finishers: two enemy variations, final-life defeat, 1600ms fall/contact/bounce, exactly-once damage/ground/finish, reduced motion, all pause/background/cancel boundaries, retry, and unchanged support powers/scoring.');
