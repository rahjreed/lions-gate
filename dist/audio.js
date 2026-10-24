// Original synthesized tones and melody; no sampled game assets.
export class ArcadeAudio{
 constructor(){this.sound=false;this.music=false;this.context=null;this.loop=null;this.step=0}
 unlock(){try{this.context??=new AudioContext();this.context.resume()}catch{}}
 tone(frequency,duration=.12,type='square',volume=.025,delay=0){if(!this.context)return;const c=this.context,o=c.createOscillator(),g=c.createGain(),at=c.currentTime+delay;o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+duration)}
 effect(name){if(!this.sound)return;this.unlock();const sequence={correct:[523,659,784],wrong:[220,165],start:[262,392,523,784],victory:[523,659,784,1047,784,1047],power:[392,784],click:[440]}[name]||[440];sequence.forEach((f,i)=>this.tone(f,.13,'square',.023,i*.08))}
 configure(sound,music,active=true){this.sound=sound;this.music=music;clearInterval(this.loop);this.loop=null;if(music&&active){this.unlock();const tune=[262,0,330,392,0,330,294,0,220,0,294,349,0,294,262,0];this.loop=setInterval(()=>{const f=tune[this.step++%tune.length];if(f)this.tone(f,.22,'triangle',.025);if(this.step%4===0)this.tone(65,.3,'triangle',.025)},240)}}
}
