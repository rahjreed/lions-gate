import assert from 'node:assert/strict';
import {CombatDirector,combatFrames,combatDuration} from '../dist/combat.js';
import {createRun,submit} from '../dist/engine.js';
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
