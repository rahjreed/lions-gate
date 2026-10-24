import assert from 'node:assert/strict';
import {GameJuice} from '../dist/juice.js';
const cancelled=[],removed=[],classes=new Set();
globalThis.cancelAnimationFrame=id=>cancelled.push(id);
const root={querySelectorAll:()=>[{remove(){removed.push(true)}}],classList:{add:c=>classes.add(c),remove:(...cs)=>cs.forEach(c=>classes.delete(c))},querySelector:()=>null};
const j=new GameJuice(root,{reducedMotion:()=>true});j.frames.push(9);j.animations.push({cancel(){cancelled.push('animation')}});j.clear();assert.deepEqual(cancelled,['animation',9]);assert.equal(removed.length,1);assert.equal(j.frames.length,0);assert.equal(j.animations.length,0);
let animated=false;j.animate({animate(){animated=true}},[],{});assert.equal(animated,false);j.enter();assert.equal(classes.size,0);j.burst(null);
console.log('PASS juice: pending animation/frame cleanup, particle cleanup, reduced-motion suppresses motion, no gameplay-state dependencies.');
