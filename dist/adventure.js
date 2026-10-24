// Presentation state only. This module never imports or mutates the quiz engine.
export const journeyLocations=[['wilderness','Wilderness Path'],['desert','Desert Pathway'],['village','Ancient Village'],['mountain','Mountain Pass'],['temple','Temple Courtyard'],['streets','Jerusalem-inspired Streets'],['lions-gate','Approach to the Lion’s Gate']];
export function locationFor(level){return level%5===0?journeyLocations[6]:journeyLocations[((level-2)%7+7)%7]}
export function gateProgress(run){return {broken:run.answers.filter(a=>a.correct).length,total:10,open:run.status==='levelup'}}
export function symbolicGate({broken=0,open=false}={}){return `<div class="symbolic-gate ${open?'gate-open':''}" style="--gate-power:${Math.max(0,Math.min(10,broken))/10}" aria-hidden="true"><div class="gate-door door-left"></div><div class="gate-door door-right"></div><img src="assets/console/challenge-gate.png" width="128" height="160" alt=""><span class="gate-sigil">✦</span></div>`}
export const journeyPhases=[{at:0,name:'walk',pose:'walk'},{at:900,name:'run',pose:'run'},{at:2200,name:'arrival',pose:'ready'},{at:3000,name:'intro',pose:'ready'}];
export class JourneyDirector{
 constructor({now=()=>performance.now(),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){this.now=now;this.setTimer=setTimer;this.clearTimer=clearTimer;this.active=false;this.token=0}
 start({onPhase,onFinish}){this.cancel();this.active=true;this.paused=false;this.elapsed=0;this.since=this.now();this.phase=-1;this.onPhase=onPhase;this.onFinish=onFinish;this.tick(this.token)}
 tick(token){if(!this.active||this.paused||token!==this.token)return;this.elapsed+=this.now()-this.since;this.since=this.now();if(this.elapsed>=4000)return this.finish();
  let phase=journeyPhases.findLastIndex(p=>p.at<=this.elapsed);if(phase!==this.phase){this.phase=phase;this.onPhase(journeyPhases[phase])}
  const next=journeyPhases[this.phase+1]?.at||4000;this.timer=this.setTimer(()=>this.tick(token),Math.max(1,next-this.elapsed));
 }
 pause(){if(!this.active||this.paused)return;this.elapsed+=this.now()-this.since;this.paused=true;this.clearTimer(this.timer)}
 resume(){if(!this.active||!this.paused)return;this.paused=false;this.since=this.now();this.tick(this.token)}
 finish(){if(!this.active)return false;const fn=this.onFinish;this.cancel();fn();return true}
 cancel(){this.clearTimer(this.timer);this.token++;this.active=false;this.onFinish=null;this.onPhase=null}
}
