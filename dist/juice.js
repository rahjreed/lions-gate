// Ephemeral presentation only: no scoring, timers, or run state are changed here.
export class GameJuice{
 constructor(root,{reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches}={}){this.root=root;this.reducedMotion=reducedMotion;this.animations=[];this.frames=[];this.timers=[];this.jobs=new Set();this.frameJobs=new Map();this.paused=false;this.pausedTime=0}
 pause(){if(this.paused)return;this.paused=true;this.pausedAt=performance.now();for(const job of this.jobs){clearTimeout(job.id);job.remaining=Math.max(0,job.due-this.pausedAt)}this.frames.forEach(cancelAnimationFrame)}
 resume(){if(!this.paused)return;this.pausedTime+=performance.now()-this.pausedAt;this.paused=false;for(const job of this.jobs)this.schedule(job);for(const [id,fn] of [...this.frameJobs]){this.frameJobs.delete(id);this.frame(fn)}}
 now(){return (this.paused?this.pausedAt:performance.now())-this.pausedTime}
 frame(fn){const id=requestAnimationFrame(()=>{this.frameJobs.delete(id);if(!this.paused)fn(this.now())});this.frames.push(id);this.frameJobs.set(id,fn)}
 schedule(job){job.due=performance.now()+job.remaining;job.id=setTimeout(()=>{this.jobs.delete(job);job.fn()},job.remaining);this.timers.push(job.id)}
 later(fn,ms){const job={fn,remaining:ms};this.jobs.add(job);this.schedule(job)}
 clear(){this.animations.forEach(a=>a.cancel());this.frames.forEach(cancelAnimationFrame);this.timers.forEach(clearTimeout);this.animations=[];this.frames=[];this.timers=[];this.jobs.clear();this.frameJobs.clear();this.paused=false;this.pausedTime=0;this.root.querySelectorAll('.pixel-burst,.reward-pop,.life-pop').forEach(e=>e.remove());this.root.classList.remove('impact-correct','impact-wrong','impact-shield','arriving','promoted')}
 animate(element,keyframes,options){if(!element||this.reducedMotion())return;const a=element.animate(keyframes,options);this.animations.push(a);return a}
 transientClass(name,duration){this.root.classList.add(name);this.later(()=>this.root.classList.remove(name),duration)}
 enter(kind='question'){this.clear();if(this.reducedMotion())return;this.transientClass(kind==='promotion'?'promoted':'arriving',650);if(kind==='promotion')this.burst(this.root.querySelector('.result-screen'),20,'gold')}
 burst(target,count=12,tone='green'){if(!target||this.reducedMotion())return;const layer=document.createElement('span');layer.className=`pixel-burst ${tone}`;layer.setAttribute('aria-hidden','true');for(let i=0;i<count;i++){const p=document.createElement('i');const angle=2*Math.PI*i/count;p.style.setProperty('--dx',`${Math.cos(angle)*(45+i%3*17)}px`);p.style.setProperty('--dy',`${Math.sin(angle)*(30+i%4*10)}px`);p.style.setProperty('--delay',`${i%3*20}ms`);layer.append(p)}target.append(layer);this.later(()=>layer.remove(),850)}
 answer({correct,earned,score,streak,shielded}){
  this.clear();const panel=this.root.querySelector('.question-panel'),hud=this.root.querySelector('.hud'),sword=this.root.querySelector('.small-sword'),scoreEl=this.root.querySelector('#score-value');
  this.transientClass(correct?'impact-correct':shielded?'impact-shield':'impact-wrong',800);
  if(correct){
   this.burst(this.root.querySelector('.answer.correct'));
   const pop=document.createElement('span');pop.className='reward-pop';pop.textContent=`+${earned.toLocaleString('en-US')}  ${streak>=3?'×'+Math.min(5,1+Math.floor(streak/3)):''}`;pop.setAttribute('aria-hidden','true');(this.root.querySelector('.answer.correct')||hud)?.append(pop);this.later(()=>pop.remove(),1000);
   this.animate(sword,[{transform:'rotate(20deg) scale(1)',filter:'drop-shadow(0 0 6px #8de5de)'},{transform:'rotate(-35deg) scale(1.18)',filter:'drop-shadow(0 0 26px #b7ffb4)'},{transform:'rotate(35deg) scale(1.1)'},{transform:'rotate(20deg) scale(1)'}],{duration:480,easing:'cubic-bezier(.2,.8,.3,1)'});
   this.animate(this.root.querySelector('.hud-combo'),[{transform:'scale(1)'},{transform:'scale(1.2)',color:'#e4ff9b'},{transform:'scale(1)'}],{duration:500});
   if(scoreEl&&!this.reducedMotion()){const started=this.now(),before=score-earned;const tick=now=>{const p=Math.min(1,(now-started)/350);scoreEl.textContent=Math.round(before+earned*(1-(1-p)**3)).toLocaleString('en-US').padStart(6,'0');if(p<1)this.frame(tick)};this.frame(tick)}
  }else{
   this.animate(panel,[{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'translateX(0)'}],{duration:250,easing:'ease-out'});
   if(!shielded){const hearts=this.root.querySelector('.hearts');const pop=document.createElement('span');pop.className='life-pop';pop.textContent='−1 ♥';pop.setAttribute('aria-hidden','true');hearts?.append(pop);this.later(()=>pop.remove(),900);this.animate(hearts,[{opacity:1,transform:'scale(1)'},{opacity:.45,transform:'scale(1.17)'},{opacity:1,transform:'scale(1)'}],{duration:450})}
  }
 }
}
