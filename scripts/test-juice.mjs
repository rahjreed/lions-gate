import assert from 'node:assert/strict';
import {GameJuice} from '../dist/juice.js';
const cancelled=[],removed=[],classes=new Set();
globalThis.cancelAnimationFrame=id=>cancelled.push(id);
const root={querySelectorAll:()=>[{remove(){removed.push(true)}}],classList:{add:c=>classes.add(c),remove:(...cs)=>cs.forEach(c=>classes.delete(c))},querySelector:()=>null};
const j=new GameJuice(root,{reducedMotion:()=>true});j.frames.push(9);j.animations.push({cancel(){cancelled.push('animation')}});j.clear();assert.deepEqual(cancelled,['animation',9]);assert.equal(removed.length,1);assert.equal(j.frames.length,0);assert.equal(j.animations.length,0);
let animated=false;j.animate({animate(){animated=true}},[],{});assert.equal(animated,false);j.enter();assert.equal(classes.size,0);j.burst(null);
console.log('PASS juice: pending animation/frame cleanup, particle cleanup, reduced-motion suppresses motion, no gameplay-state dependencies.');
// Presentation cleanup timers and score RAFs suspend with the combat timeline.
const originalPerformance=globalThis.performance,originalSetTimeout=globalThis.setTimeout,originalClearTimeout=globalThis.clearTimeout;let now=0,id=0;const jobs=new Map(),raf=new Map();
try{
 globalThis.performance={now:()=>now};globalThis.setTimeout=(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id};globalThis.clearTimeout=key=>jobs.delete(key);globalThis.requestAnimationFrame=fn=>{raf.set(++id,fn);return id};globalThis.cancelAnimationFrame=key=>raf.delete(key);
 const juice=new GameJuice(root,{reducedMotion:()=>false});let fired=0,stamp=-1;juice.later(()=>fired++,800);juice.frame(time=>stamp=time);now=240;juice.pause();now=60240;assert.equal(jobs.size,0);assert.equal(raf.size,0);juice.resume();assert.equal([...jobs.values()][0].at,60800);for(const fn of raf.values())fn();assert.equal(stamp,240,'Score tick excludes hidden time');assert.equal(fired,0);[...jobs.values()][0].fn();assert.equal(fired,1);juice.pause();juice.clear();assert.equal(juice.jobs.size,0);assert.equal(juice.frameJobs.size,0);assert.equal(juice.paused,false);
}finally{globalThis.performance=originalPerformance;globalThis.setTimeout=originalSetTimeout;globalThis.clearTimeout=originalClearTimeout}
console.log('PASS juice pause: delayed cleanup and score frames freeze, resume remaining time, clear cancels suspended work.');
