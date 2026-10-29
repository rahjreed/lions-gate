import {MAX_LIVES} from './engine.js';
import {judah} from './mascot.js';
import {opponentFor} from './opponents.js';

export const combatDuration=920;
export const defeatDuration=1060;
export const groundContactAt=1210;
export const bounceAt=1330;
export const settleAt=1470;
export const shieldContactAt=1030;
// Source rectangles preserve the generated art's pixels; no body-part transforms.
export const romanKOFrames=[[15,59,425,373],[463,29,347,404],[826,155,411,279],[8,562,423,257],[444,641,377,186],[823,636,425,179],[44,1028,384,178],[446,1054,414,143]];
export const finisherVariation=level=>level%2===0?'sweep':'rising';
export const defeatStart=540;
export const combatFrames=[
 {at:0,phase:'windup',enemy:1},
 {at:140,phase:'strike',enemy:2},
 {at:240,phase:'impact',enemy:2},
 {at:340,phase:'followthrough',enemy:3},
 {at:540,phase:'recover',enemy:5},
 {at:combatDuration,phase:'ready',enemy:0}
];
export function romanSoldier(defeated=false){return `<div class="roman-soldier ${defeated?'is-defeated':''}" role="img" aria-label="Roman soldier with sword and shield${defeated?', defeated':''}"><span class="roman-sprite"></span><span class="roman-knockout" aria-hidden="true"><span class="roman-ko-art"></span></span><span class="roman-dropped-shield" aria-hidden="true"></span></div>`}

// Display only: derive from the engine's current level answers and actual lives.
// A pending snapshot holds the bars until impact; it is never saved as health.
export function combatHealth(run,pending=null){
 const hits=pending?.hits??run.answers.filter(a=>a.correct).length;
 return {hits,enemy:Math.max(0,100-hits*10),lives:pending?.lives??run.lives};
}
export function combatHealthMarkup(run,pending=null){
 const h=combatHealth(run,pending);
 const meter=(who,label,value,max,text)=>`<div class="health-block health-${who}"><div class="health-label"><b>${label}</b><span class="health-value">${text}</span></div><div class="health-track" data-health="${who}" role="progressbar" aria-label="${label} health" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${text}"><i class="health-lag" style="width:${value/max*100}%"></i><i class="health-fill" style="width:${value/max*100}%"></i></div></div>`;
 return `<div class="combat-health" aria-label="Combat health">${meter('judah','JUDAH',h.lives,MAX_LIVES,`${h.lives} / ${MAX_LIVES} LIVES`)}${meter('enemy',opponentFor(run.level).name,h.enemy,100,h.enemy?`${h.enemy}%`:'0% · KO')}<small>10 SUCCESSFUL HITS TO WIN · CORRECT ANSWERS DEAL 10%</small></div>`;
}
export function updateCombatHealth(root,run){
 if(!root)return;
 const h=combatHealth(run);
 for(const [who,value,text] of [['judah',h.lives,`${h.lives} / ${MAX_LIVES} LIVES`],['enemy',h.enemy,h.enemy?`${h.enemy}%`:'0% · KO']]){
  const meter=root.querySelector(`[data-health="${who}"]`),block=meter.closest('.health-block');
  if(value<Number(meter.getAttribute('aria-valuenow')))block.dataset.damaged='true';
  meter.setAttribute('aria-valuenow',value);meter.setAttribute('aria-valuetext',text);
  block.querySelector('.health-value').textContent=text;
  for(const fill of meter.children)fill.style.width=`${value/Number(meter.getAttribute('aria-valuemax'))*100}%`;
 }
}

// Read authoritative before/after HP; never change it or invent blocked damage.
export function combatDamageFeedback(before,after,last){
 const enemyLoss=Math.max(0,before.enemy-after.enemy),lifeLoss=Math.max(0,before.lives-after.lives);
 if(enemyLoss)return {who:'enemy',kind:'hit',amount:enemyLoss,text:'-'+enemyLoss};
 if(lifeLoss)return {who:'judah',kind:'hurt',amount:lifeLoss,text:'-'+lifeLoss+' LIFE'};
 if(last.shielded)return {who:'judah',kind:'blocked',amount:0,text:'BLOCKED'};
 return null;
}

// Owns only presentation callbacks. The quiz engine remains the sole authority
// for score, lives, shields and answer acceptance. Cancel invalidates stale work.
export class CombatDirector{
 constructor({setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),now=()=>performance.now()}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.now=now;this.timers=[];this.active=false;this.paused=false;this.generation=0}
 start({correct,enemyDefeated=false,heroDefeated=false,variation='rising',reducedMotion=false,onFrame,onImpact,onFinish}){
  if(this.active)return false;
  this.active=true;this.paused=false;this.elapsed=0;this.offset=0;this.started=this.now();this.generation++;
  const finishingBlow=correct&&enemyDefeated,heroFalls=!correct&&heroDefeated;
  const finisher=finishingBlow?'enemy':heroFalls?'judah':'',variant=variation==='sweep'?'sweep':'rising';
  const duration=reducedMotion&&finishingBlow?320:finisher?defeatStart+defeatDuration:combatDuration;
  if(reducedMotion&&!finishingBlow){onFrame({at:duration,phase:heroFalls?'hero-defeated':'ready',enemy:0,correct,finisher,variation:variant,heroReady:!heroFalls,reducedMotion:true});onImpact();this.active=false;onFinish();return true}
  const prefix=heroFalls?'hero-':'';
  const timeline=reducedMotion?[
   {at:0,phase:'settle',enemy:4,heroReady:true},
   {at:duration,phase:'defeated',enemy:4,heroReady:true}
  ]:finisher?[
   ...combatFrames.map(f=>f.at>=defeatStart?{...f,phase:prefix+'defeat',enemy:finishingBlow?4:0,heroReady:!heroFalls&&f.at===combatDuration}:f),
   {at:groundContactAt,phase:prefix+'ground',enemy:finishingBlow?4:0,heroReady:!heroFalls},
   {at:bounceAt,phase:prefix+'bounce',enemy:finishingBlow?4:0,heroReady:!heroFalls},
   {at:settleAt,phase:prefix+'settle',enemy:finishingBlow?4:0,heroReady:!heroFalls},
   ...(finishingBlow?[
    {at:760,phase:'defeat',enemy:4,heroReady:false},
    {at:shieldContactAt,phase:'defeat',enemy:4,heroReady:true,shieldImpact:true},
    {at:1100,phase:'falling',enemy:4,heroReady:true},
    {at:1400,phase:'settling',enemy:4,heroReady:true},
    {at:1480,phase:'flicker',enemy:4,heroReady:true}
   ]:[]),
   {at:duration,phase:prefix+'defeated',enemy:finishingBlow?4:0,heroReady:!heroFalls}
  ]:combatFrames;
  this.jobs=timeline.sort((a,b)=>a.at-b.at).map(frame=>({frame,done:false}));
  this.apply=job=>{
   if(job.done)return;job.done=true;const frame=job.frame;this.elapsed=Math.max(this.elapsed,frame.at);
   onFrame({...frame,correct,finisher,variation:variant,reducedMotion,enemy:finishingBlow&&frame.at>=240?4:correct?(frame.at>=240&&frame.at<540?4:frame.at===540?5:0):frame.enemy});
   if(frame.phase==='impact'||reducedMotion&&frame.at===0)onImpact();
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
 scene.dataset.finisher=frame.finisher||'';scene.dataset.variation=frame.variation||'rising';scene.dataset.slowMotion=String(!!frame.finisher&&frame.at>=defeatStart&&frame.at<groundContactAt);
 scene.dataset.reducedMotion=String(!!frame.reducedMotion);
 const soldier=scene.querySelector('.roman-soldier');
 const knockout=frame.finisher==='enemy'&&(frame.at>=240||frame.reducedMotion||frame.phase==='defeated');
 scene.dataset.knockout=String(knockout);
 if(knockout){
  const index=frame.reducedMotion||frame.phase==='defeated'?7:frame.at>=1470?7:frame.at>=1400?6:frame.at>=1330?5:frame.at>=1100?4:frame.at>=760?3:frame.at>=540?2:frame.at>=340?1:0;
  const [x,y,w,h]=romanKOFrames[index],scale=1.08;
  scene.dataset.koFrame=String(index);
  for(const [key,value]of Object.entries({width:w*scale/512*100+'%',height:h*scale/512*100+'%',left:(256-w*scale/2)/512*100+'%',top:(484-h*scale)/512*100+'%',size:`${1254/w*100}% ${1254/h*100}%`,position:`${x/(1254-w)*100}% ${y/(1254-h)*100}%`}))soldier.style.setProperty('--ko-'+key,value);
  soldier.style.setProperty('--ko-lift',frame.reducedMotion?'0px':frame.at>=1100&&frame.at<1210?'calc(var(--fighter-unit) * -5)':frame.at>=1330&&frame.at<1400?'calc(var(--fighter-unit) * -2.5)':'0px');
 }
 soldier.classList.toggle('is-defeated',frame.phase==='defeated');
 soldier.setAttribute('aria-label',`Roman soldier with sword and shield${frame.phase==='defeated'?', defeated':''}`);
 // Atlas rows have different transparent foot margins. Anchor visible boots, not tiles.
 soldier.style.setProperty('--roman-foot',String((knockout?28:[28,26,26,66,64,64][frame.enemy])/512));
 const sprite=scene.querySelector('.roman-sprite');
 sprite.style.backgroundPosition=`${frame.enemy%3*50}% ${Math.floor(frame.enemy/3)*100}%`;
 const hero=scene.querySelector('.scene-status>.judah');
 // Keep the figure itself alive: replacing it would restart its travel animation.
 let pose=hero.dataset.pose;
 if(frame.phase==='windup'&&frame.correct)pose=frame.finisher==='enemy'?'stance':'run';
 if(frame.phase==='strike'&&frame.correct)pose='slash';
 if(frame.phase==='impact'&&!frame.correct)pose='recoil';
 if(frame.correct&&(frame.phase==='recover'||frame.phase==='defeat'&&frame.at===defeatStart))pose='walk';
 if(frame.phase==='ready'||frame.heroReady)pose='ready';
 if(frame.finisher==='judah'&&frame.at>=240)pose='recoil';
 if(frame.finisher==='enemy'&&frame.phase==='defeated')pose='victory';
 hero.setAttribute?.('aria-label',frame.phase==='hero-defeated'?'Judah, defeated':'Judah');
 if(pose!==hero.dataset.pose){
  const template=hero.ownerDocument.createElement('template');template.innerHTML=judah(completed,pose,false,equipment,wardrobe);
  const next=template.content.firstElementChild;
  hero.className=next.className;hero.dataset.pose=pose;hero.innerHTML=next.innerHTML;
 }
}
