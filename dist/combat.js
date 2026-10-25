import {judah} from './mascot.js';

export const combatDuration=920;
export const combatFrames=[
 {at:0,phase:'windup',enemy:1},
 {at:140,phase:'strike',enemy:2},
 {at:240,phase:'impact',enemy:2},
 {at:340,phase:'followthrough',enemy:3},
 {at:540,phase:'recover',enemy:5},
 {at:combatDuration,phase:'ready',enemy:0}
];
export function romanSoldier(){return '<div class="roman-soldier" role="img" aria-label="Roman soldier with sword and shield"><span class="roman-sprite"></span></div>'}

// Owns only presentation callbacks. The quiz engine remains the sole authority
// for score, lives, shields and answer acceptance. Cancel invalidates stale work.
export class CombatDirector{
 constructor({setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.timers=[];this.active=false;this.generation=0}
 start({correct,reducedMotion=false,onFrame,onImpact,onFinish}){
  if(this.active)return false;
  this.active=true;const generation=++this.generation;
  if(reducedMotion){onFrame({phase:'ready',enemy:0,correct});onImpact();this.active=false;onFinish();return true}
  const apply=frame=>{
   if(!this.active||generation!==this.generation)return;
   onFrame({...frame,correct,enemy:correct?(frame.at>=240&&frame.at<540?4:frame.at===540?5:0):frame.enemy});
   if(frame.phase==='impact')onImpact();
   if(frame.phase==='ready'){this.active=false;this.timers=[];onFinish()}
  };
  apply(combatFrames[0]);
  for(const frame of combatFrames.slice(1))this.timers.push(this.setTimer(()=>apply(frame),frame.at));
  return true;
 }
 cancel(){this.generation++;this.timers.forEach(this.clearTimer);this.timers=[];this.active=false}
}

export function paintCombat(scene,frame,completed){
 if(!scene)return;
 scene.dataset.combat=frame.phase;scene.dataset.outcome=frame.correct?'correct':'wrong';
 const sprite=scene.querySelector('.roman-sprite');
 sprite.style.backgroundPosition=`${frame.enemy%3*50}% ${Math.floor(frame.enemy/3)*100}%`;
 const hero=scene.querySelector('.scene-status>.judah');
 if(frame.phase==='windup'&&frame.correct)hero.outerHTML=judah(completed,'slash',false);
 if(frame.phase==='impact'&&!frame.correct)hero.outerHTML=judah(completed,'recoil',false);
 if(frame.phase==='ready')hero.outerHTML=judah(completed,'ready',false);
}
