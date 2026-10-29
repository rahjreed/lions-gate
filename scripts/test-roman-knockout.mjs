import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CombatDirector,romanKOFrames,shieldContactAt,paintCombat,romanSoldier} from '../dist/combat.js';
const asset=await readFile(new URL('../dist/assets/console/roman-knockout.png',import.meta.url));
assert.equal(asset.readUInt32BE(16),1254);assert.equal(asset.readUInt32BE(20),1254);assert.equal(asset[25],6,'RGBA transparency');
assert.equal(romanKOFrames.length,8);assert.equal(new Set(romanKOFrames.map(JSON.stringify)).size,8);
for(const [x,y,w,h]of romanKOFrames)assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1254&&y+h<=1254);
assert.ok(romanKOFrames[7][3]<romanKOFrames[0][3]/2,'Collapsed anatomy, not a rotated standing pose');
for(const reducedMotion of [false,true])for(const pauseAt of [0,239,240,340,540,760,1029,1030,1210,1330,1400,1470,1480,1599]){
 let now=0,id=0,impact=0,clang=0,finish=0;const jobs=new Map(),frames=[];
 const tick=ms=>{const end=now+ms;for(;;){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;jobs.delete(due[0]);now=due[1].at;due[1].fn()}now=end};
 const director=new CombatDirector({now:()=>now,setTimer:(fn,ms)=>{jobs.set(++id,{at:now+ms,fn});return id},clearTimer:id=>jobs.delete(id)});
 director.start({correct:true,enemyDefeated:true,reducedMotion,onFrame:f=>{frames.push(f);if(f.shieldImpact)clang++},onImpact:()=>impact++,onFinish:()=>finish++});
 const duration=reducedMotion?320:1600,at=Math.min(pauseAt,duration-1);tick(at);director.pause();const state=[frames.length,impact,clang,finish];tick(60000);assert.deepEqual([frames.length,impact,clang,finish],state);director.resume();tick(duration-at);
 assert.equal(impact,1);assert.equal(finish,1);assert.equal(clang,reducedMotion?0:1);assert.equal(frames.at(-1).phase,'defeated');assert.equal(director.active,false);
 if(!reducedMotion)assert.equal(frames.find(f=>f.shieldImpact).at,shieldContactAt);
}
const soldier={classList:{toggle(){}},setAttribute(){},style:{setProperty(k,v){this[k]=v}}};
const hero={dataset:{pose:'ready'},setAttribute(){}};
const scene={dataset:{},querySelector:s=>s==='.roman-soldier'?soldier:s==='.roman-sprite'?{style:{}}:hero};
for(const [index,at]of [240,340,540,760,1210,1330,1400,1470].entries()){
 // Keep pose replacement out of this geometry-only fixture.
 const phase=at===540?'defeat':'settling';hero.dataset.pose=at===540?'walk':'ready';
 paintCombat(scene,{at,phase,enemy:4,correct:true,finisher:'enemy',heroReady:at!==540},0);
 assert.equal(scene.dataset.koFrame,String(index));assert.equal(scene.dataset.knockout,'true');assert.equal(Number(soldier.style['--roman-foot']),28/512);
}
paintCombat(scene,{at:0,phase:'ready',enemy:0,correct:false},0);assert.equal(scene.dataset.knockout,'false','Retry/next encounter restores original sprite');
assert.ok(romanSoldier().includes('roman-dropped-shield'));
const css=await readFile(new URL('../dist/combat.css',import.meta.url),'utf8');assert.match(css,/roman-gentle-disappear/);assert.match(css,/roman-shield-tumble/);assert.match(css,/data-knockout=true[^}]+roman-sprite\{display:none/);
console.log('PASS Roman knockout: eight anatomical poses, transparent bounded atlas, independent shield, exactly-once hit/clang/finish across all pause boundaries, 320ms reduced-motion hold/fade, terminal disappearance and clean retry.');
