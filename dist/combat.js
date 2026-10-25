import {judah} from './mascot.js';
import {opponentFor} from './opponents.js';

export const combatDuration=920;
export const defeatDuration=760;
export const defeatStart=540;
export const combatFrames=[
 {at:0,phase:'windup',enemy:1},
 {at:140,phase:'strike',enemy:2},
 {at:240,phase:'impact',enemy:2},
 {at:340,phase:'followthrough',enemy:3},
 {at:540,phase:'recover',enemy:5},
 {at:combatDuration,phase:'ready',enemy:0}
];
export function romanSoldier(defeated=false){return `<div class="roman-soldier ${defeated?'is-defeated':''}" role="img" aria-label="Roman soldier with sword and shield${defeated?', defeated':''}"><span class="roman-sprite"></span></div>`}

// Display only: derive from the engine's current level answers and actual lives.
// A pending snapshot holds the bars until impact; it is never saved as health.
export function combatHealth(run,pending=null){
 const hits=pending?.hits??run.answers.filter(a=>a.correct).length;
 return {hits,enemy:Math.max(0,100-hits*10),lives:pending?.lives??run.lives};
}
export function combatHealthMarkup(run,pending=null){
 const h=combatHealth(run,pending);
 const meter=(who,label,value,max,text)=>`<div class="health-block health-${who}"><div class="health-label"><b>${label}</b><span class="health-value">${text}</span></div><div class="health-track" data-health="${who}" role="progressbar" aria-label="${label} health" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${text}"><i class="health-lag" style="width:${value/max*100}%"></i><i class="health-fill" style="width:${value/max*100}%"></i></div></div>`;
 return `<div class="combat-health" aria-label="Combat health">${meter('judah','JUDAH',h.lives,3,`${h.lives} / 3 LIVES`)}${meter('enemy',opponentFor(run.level).name,h.enemy,100,h.enemy?`${h.enemy}%`:'0% · KO')}<small>LEVEL ENDS AFTER 10 QUESTIONS · CORRECT ANSWERS DEAL 10%</small></div>`;
}
export function updateCombatHealth(root,run){
 if(!root)return;
 const h=combatHealth(run);
 for(const [who,value,text] of [['judah',h.lives,`${h.lives} / 3 LIVES`],['enemy',h.enemy,h.enemy?`${h.enemy}%`:'0% · KO']]){
  const meter=root.querySelector(`[data-health="${who}"]`),block=meter.closest('.health-block');
  if(value<Number(meter.getAttribute('aria-valuenow')))block.dataset.damaged='true';
  meter.setAttribute('aria-valuenow',value);meter.setAttribute('aria-valuetext',text);
  block.querySelector('.health-value').textContent=text;
  for(const fill of meter.children)fill.style.width=`${value/Number(meter.getAttribute('aria-valuemax'))*100}%`;
 }
}

// Owns only presentation callbacks. The quiz engine remains the sole authority
// for score, lives, shields and answer acceptance. Cancel invalidates stale work.
export class CombatDirector{
 constructor({setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.timers=[];this.active=false;this.generation=0}
 start({correct,enemyDefeated=false,reducedMotion=false,onFrame,onImpact,onFinish}){
  if(this.active)return false;
  this.active=true;const generation=++this.generation;
  const finishingBlow=correct&&enemyDefeated;
  const duration=finishingBlow?defeatStart+defeatDuration:combatDuration;
  if(reducedMotion){onFrame({phase:finishingBlow?'defeated':'ready',enemy:finishingBlow?3:0,correct,heroReady:true});onImpact();this.active=false;onFinish();return true}
  const timeline=finishingBlow?[...combatFrames.map(f=>f.at>=defeatStart?{...f,phase:'defeat',enemy:3,heroReady:f.at===combatDuration}:f),{at:duration,phase:'defeated',enemy:3,heroReady:true}]:combatFrames;
  const apply=frame=>{
   if(!this.active||generation!==this.generation)return;
   onFrame({...frame,correct,enemy:finishingBlow&&frame.at>=defeatStart?3:finishingBlow&&frame.at>=240?4:correct?(frame.at>=240&&frame.at<540?4:frame.at===540?5:0):frame.enemy});
   if(frame.phase==='impact')onImpact();
   if(frame.at===duration){this.active=false;this.timers=[];onFinish()}
  };
  apply(timeline[0]);
  for(const frame of timeline.slice(1))this.timers.push(this.setTimer(()=>apply(frame),frame.at));
  return true;
 }
 cancel(){this.generation++;this.timers.forEach(this.clearTimer);this.timers=[];this.active=false}
}

export function paintCombat(scene,frame,completed){
 if(!scene)return;
 scene.dataset.combat=frame.phase;scene.dataset.outcome=frame.correct?'correct':'wrong';
 const soldier=scene.querySelector('.roman-soldier');
 soldier.classList.toggle('is-defeated',frame.phase==='defeated');
 soldier.setAttribute('aria-label',`Roman soldier with sword and shield${frame.phase==='defeated'?', defeated':''}`);
 const sprite=scene.querySelector('.roman-sprite');
 sprite.style.backgroundPosition=`${frame.enemy%3*50}% ${Math.floor(frame.enemy/3)*100}%`;
 const hero=scene.querySelector('.scene-status>.judah');
 if(frame.phase==='windup'&&frame.correct)hero.outerHTML=judah(completed,'slash',false);
 if(frame.phase==='impact'&&!frame.correct)hero.outerHTML=judah(completed,'recoil',false);
 if(frame.phase==='ready'||frame.heroReady)hero.outerHTML=judah(completed,'ready',false);
}
