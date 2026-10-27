// Original oscillator patches. SFX and music have independent buses and mute states.
export const patches={
 swordSwing:[[1300,.075,'sawtooth',0,.025,170],[760,.095,'triangle',.02,.028,90]],
 swordStrike:[[920,.045,'square',0,.045,180],[110,.13,'triangle',.008,.08,55],[540,.06,'sawtooth',.018,.018,90]],
 heavyImpact:[[80,.17,'triangle',0,.085,40],[120,.06,'square',0,.03,45],[440,.035,'sawtooth',.01,.012,90]],
 damage:[[145,.08,'sawtooth',0,.045,45],[70,.15,'triangle',.008,.075,40],[220,.045,'square',.015,.018,70]],
 perfectVictory:[[392,.12,'square',0,.035],[523,.12,'square',.1,.035],[659,.14,'square',.2,.035],[784,.16,'square',.3,.035],[1047,.45,'triangle',.44,.075],[1319,.42,'triangle',.44,.04],[523,.45,'triangle',.44,.04]],
 gateOpen:[[98,.24,'triangle',0,.045,196],[196,.24,'triangle',.2,.05,392],[784,.24,'square',.4,.022]],
 correct:[[523,.12,'square',0,.04],[784,.14,'square',.09,.035],[1047,.24,'triangle',.18,.085],[1319,.18,'square',.27,.025]],
 wrong:[[196,.16,'sawtooth',0,.035,98],[147,.23,'square',.12,.035,73]],
 lifeLost:[[110,.16,'triangle',0,.09,55],[82,.2,'square',.08,.035,41]],
 select:[[659,.055,'square',0,.035],[880,.07,'triangle',.045,.05]],
 next:[[392,.06,'square',0,.03],[587,.08,'square',.05,.035],[784,.1,'triangle',.11,.06]],
 start:[[262,.1,'square',0,.035],[392,.1,'square',.09,.035],[523,.12,'square',.18,.035],[784,.24,'triangle',.28,.07]],
 levelComplete:[[523,.13,'square',0,.04],[659,.13,'square',.1,.04],[784,.16,'square',.2,.04],[1047,.35,'triangle',.34,.09],[523,.4,'triangle',.34,.04]],
 promotion:[[392,.13,'square',0,.035],[523,.13,'square',.12,.035],[659,.15,'square',.24,.035],[784,.16,'square',.36,.035],[1047,.4,'triangle',.5,.08],[1319,.4,'triangle',.5,.04]],
 gatekeeper:[[130,.16,'square',0,.035],[196,.16,'square',.16,.035],[147,.16,'square',.32,.035],[294,.3,'triangle',.48,.08]],
 pause:[[523,.08,'triangle',0,.06],[392,.14,'triangle',.08,.055]],
 resume:[[392,.08,'triangle',0,.055],[523,.14,'triangle',.08,.06]],
 power:[[392,.1,'square',0,.035,784],[784,.2,'triangle',.1,.07]],
 shield:[[1047,.08,'triangle',0,.065,1568],[784,.12,'triangle',.018,.04,392],[392,.14,'triangle',.025,.035,196]],
 gameover:[[262,.15,'square',0,.035],[220,.15,'square',.17,.035],[196,.16,'square',.34,.035],[130,.45,'triangle',.51,.08]]
};
export class ArcadeAudio{
 constructor({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),onState=()=>{}}={}){this.sound=false;this.music=false;this.context=null;this.loop=null;this.step=0;this.voices=new Set();this.contextFactory=contextFactory;this.onState=onState;this.playCount=0;this.generation=0}
 report(effect=''){this.onState({state:this.context?.state||'locked',effect,playCount:this.playCount,sound:this.sound})}
 async unlock(){try{this.context??=this.contextFactory();if(!this.sfxBus){this.sfxBus=this.context.createGain();this.sfxBus.gain.value=this.sound?.7:0;this.sfxBus.connect(this.context.destination);this.musicBus=this.context.createGain();this.musicBus.gain.value=.7;this.musicBus.connect(this.context.destination)}if(this.context.state!=='running')await this.context.resume();this.report();return this.context.state==='running'}catch{this.report('unavailable');return false}}
 tone(frequency,duration=.12,type='square',volume=.025,delay=0,endFrequency=null,bus='sfx'){
  if(!this.context||this.context.state!=='running')return;
  const c=this.context,o=c.createOscillator(),g=c.createGain(),at=c.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(frequency,at);if(endFrequency)o.frequency.exponentialRampToValueAtTime(endFrequency,at+duration);
  g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(volume,at+.006);g.gain.exponentialRampToValueAtTime(.001,at+duration);
  o.connect(g);g.connect(bus==='music'?this.musicBus:this.sfxBus);const voice={o,g,bus};this.voices.add(voice);
  o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(voice)};o.start(at);o.stop(at+duration+.01);
 }
 async effect(name,offset=0){if(!this.sound||!patches[name])return false;const generation=this.generation;if(!await this.unlock()||!this.sound||generation!==this.generation)return false;
  // Bound rapid-click polyphony; gameplay is never delayed by an audio sequence.
  if(this.voices.size>48)this.cancel('sfx');
  for(const [f,d,t,delay,v,end] of patches[name])this.tone(f,d,t,v,delay+offset,end);
  this.playCount++;this.report(name);return true;
 }
 cancel(bus){for(const voice of [...this.voices])if(voice.bus===bus){try{voice.o.stop()}catch{}voice.o.disconnect();voice.g.disconnect();this.voices.delete(voice)}}
 configure(sound,music,active=true){const wasSound=this.sound;this.sound=sound;this.music=music;
  if(wasSound&&!sound){this.generation++;this.cancel('sfx')}
  if(this.sfxBus)this.sfxBus.gain.setValueAtTime(sound?.7:0,this.context.currentTime);
  this.musicActive=music&&active;const shouldPlay=this.musicActive;
  if(!shouldPlay){clearInterval(this.loop);this.loop=null;this.cancel('music')}
  else if(!this.loop){void this.unlock().then(ready=>{if(!ready||!this.musicActive||this.loop)return;const tune=[262,0,330,392,0,330,294,0,220,0,294,349,0,294,262,0];this.loop=setInterval(()=>{const f=tune[this.step++%tune.length];if(f)this.tone(f,.22,'triangle',.025,0,null,'music');if(this.step%4===0)this.tone(65,.3,'triangle',.025,0,null,'music')},240)})}
  this.report();
 }
}
