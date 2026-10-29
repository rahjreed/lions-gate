import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {pauseTaunts,PauseTauntRotation,pauseGuardMarkup,closeGuardPause} from '../dist/pause-taunts.js';
import {opponentFor} from '../dist/opponents.js';
assert.equal(pauseTaunts.length,20);assert.equal(new Set(pauseTaunts).size,20);assert.ok(Object.isFrozen(pauseTaunts));
assert.equal(pauseTaunts[0],'Hast thou fled to consult Google? Even the search engine cannot save thee!');
assert.equal(pauseTaunts[19],'Dost thou require more time? I can have my servants prepare supper.');
for(const random of [()=>0,()=>.999999,Math.random]){
 const rotation=new PauseTauntRotation(random);let previous;
 for(let cycle=0;cycle<100;cycle++){
  const seen=new Set();
  for(let i=0;i<20;i++){
   const line=rotation.read();assert.notEqual(line,previous);assert.ok(pauseTaunts.includes(line));
   assert.equal(rotation.read(),line,'Repeated reads/settings redraws do not rotate');
   seen.add(line);previous=line;rotation.close();
  }
  assert.equal(seen.size,20,'Every line is accessible once per shuffled cycle');
 }
}
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const definition=name=>source.slice(source.indexOf(`function ${name}(`),source.indexOf('\nfunction ',source.indexOf(`function ${name}(`)+1));
const header={inert:true},context={paused:true,run:{level:1,score:100,lives:5,powers:{shield:1}},heldAnimations:[],app:{children:[]},document:{body:{classList:{remove(){}}}},$:selector=>selector==='header'?header:null,pauseGuardMarkup,closeGuardPause,opponentFor,button:(text,action,cls)=>`<button class="${cls}" data-action="${action}">${text}</button>`};
vm.createContext(context);vm.runInContext(['releasePause','pauseScreen'].map(definition).join('\n'),context);
for(const level of [1,5,700]){
 context.run.level=level;const snapshot=structuredClone(context.run);closeGuardPause();
 const first=context.pauseScreen();assert.ok(first.includes(opponentFor(level).name));
 assert.match(first,/aria-label="Roman guard taunt"/);assert.doesNotMatch(first,/JUDAH|data-action="(?:next|dialogue-next)"/);
 assert.match(first,/class="pause-portrait"/);assert.match(first,/assets\/console\/roman-portrait\.png/);assert.match(first,/class="pause-villain-card"/);
 assert.doesNotMatch(first,/Time and animations|Your run is saved|TAKE A BREATH|animations are|time is paused/i);
 for(const action of ['resume','save-title','retire'])assert.ok(first.includes(`data-action="${action}"`));
 context.releasePause();assert.equal(context.pauseScreen(),first,'Paused rerender retains selected dialogue');
 context.paused=false;context.releasePause();context.paused=true;
 assert.notEqual(context.pauseScreen(),first,'New pause picks a different taunt');assert.deepEqual(context.run,snapshot);
}
assert.ok(!pauseGuardMarkup('<script>guard</script>').includes('<script>'));closeGuardPause();
assert.match(source,/if\(!paused\)closeGuardPause\(\)/);
const portrait=await readFile(new URL('../dist/assets/console/roman-portrait.png',import.meta.url));assert.equal(portrait.readUInt32BE(16),1254);assert.equal(portrait.readUInt32BE(20),1254);
console.log('PASS guard pause taunts: 20 unique frozen lines, 6000 selections with full-cycle/no-adjacent-repeat guarantees, stable paused/settings redraws, resume reset, regular/Gatekeeper labels, unchanged controls/run and escaped speech.');
