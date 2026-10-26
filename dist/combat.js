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
 constructor({setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),now=()=>performance.now()}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.now=now;this.timers=[];this.active=false;this.paused=false;this.generation=0}
 start({correct,enemyDefeated=false,reducedMotion=false,onFrame,onImpact,onFinish}){
  if(this.active)return false;
  this.active=true;this.paused=false;this.elapsed=0;this.offset=0;this.started=this.now();this.generation++;
  const finishingBlow=correct&&enemyDefeated;
  const duration=finishingBlow?defeatStart+defeatDuration:combatDuration;
  if(reducedMotion){onFrame({phase:finishingBlow?'defeated':'ready',enemy:finishingBlow?3:0,correct,heroReady:true});onImpact();this.active=false;onFinish();return true}
  const timeline=finishingBlow?[...combatFrames.map(f=>f.at>=defeatStart?{...f,phase:'defeat',enemy:3,heroReady:f.at===combatDuration}:f),{at:duration,phase:'defeated',enemy:3,heroReady:true}]:combatFrames;
  this.jobs=timeline.map(frame=>({frame,done:false}));
  this.apply=job=>{
   if(job.done)return;job.done=true;const frame=job.frame;this.elapsed=Math.max(this.elapsed,frame.at);
   onFrame({...frame,correct,enemy:finishingBlow&&frame.at>=defeatStart?3:finishingBlow&&frame.at>=240?4:correct?(frame.at>=240&&frame.at<540?4:frame.at===540?5:0):frame.enemy});
   if(frame.phase==='impact')onImpact();
   if(frame.at===duration){this.active=false;this.timers=[];onFinish()}
  };
  this.apply(this.jobs[0]);this.schedule();return true;
 }
 schedule(){const generation=this.generation;for(const job of this.jobs.filter(j=>!j.done))this.timers.push(this.setTimer(()=>{if(this.active&&!this.paused&&generation===this.generation)this.apply(job)},Math.max(0,job.frame.at-this.elapsed)))}
 pause(){if(!this.active||this.paused)return;this.elapsed=Math.max(this.elapsed,this.offset+this.now()-this.started);this.paused=true;this.generation++;this.timers.forEach(this.clearTimer);this.timers=[]}
 resume(){if(!this.active||!this.paused)return;this.paused=false;this.offset=this.elapsed;this.started=this.now();this.schedule()}
 cancel(){this.generation++;this.timers.forEach(this.clearTimer);this.timers=[];this.active=false;this.paused=false}

}

export function paintCombat(scene,frame,completed,equipment=[],wardrobe){
 if(!scene)return;
 scene.dataset.combat=frame.phase;scene.dataset.outcome=frame.correct?'correct':'wrong';
 const soldier=scene.querySelector('.roman-soldier');
 soldier.classList.toggle('is-defeated',frame.phase==='defeated');
 soldier.setAttribute('aria-label',`Roman soldier with sword and shield${frame.phase==='defeated'?', defeated':''}`);
 // Atlas rows have different transparent foot margins. Anchor visible boots, not tiles.
 soldier.style.setProperty('--roman-foot',String([28,26,26,66,64,64][frame.enemy]/512));
 const sprite=scene.querySelector('.roman-sprite');
 sprite.style.backgroundPosition=`${frame.enemy%3*50}% ${Math.floor(frame.enemy/3)*100}%`;
 const hero=scene.querySelector('.scene-status>.judah');
 // Keep the figure itself alive: replacing it would restart its travel animation.
 let pose=hero.dataset.pose;
 if(frame.phase==='windup'&&frame.correct)pose='run';
 if(frame.phase==='strike'&&frame.correct)pose='slash';
 if(frame.phase==='impact'&&!frame.correct)pose='recoil';
 if(frame.correct&&(frame.phase==='recover'||frame.phase==='defeat'&&frame.at===defeatStart))pose='walk';
 if(frame.phase==='ready'||frame.heroReady)pose='ready';
 if(pose!==hero.dataset.pose){
  const template=hero.ownerDocument.createElement('template');template.innerHTML=judah(completed,pose,false,equipment,wardrobe);
  const next=template.content.firstElementChild;
  hero.className=next.className;hero.dataset.pose=pose;hero.innerHTML=next.innerHTML;
 }
}
