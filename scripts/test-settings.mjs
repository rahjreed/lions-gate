import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {settingsScreen} from '../dist/settings.js';
import {emptyProfile,saveProfile,loadProfile,captureProgress} from '../dist/storage.js';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel,submit,advance} from '../dist/engine.js';
import {EncounterDialogue} from '../dist/encounter-dialogue.js';
import {pendingBattleDialogue,claimBattleDialogue,clearBattleDialogue,battleExchange} from '../dist/battle-dialogue.js';
assert.deepEqual(emptyProfile().settings,{sound:true,music:true,shortJourneys:false,skipDialogue:false});
for(const music of [true,false])for(const sound of [true,false])for(const dialogue of [true,false]){
 const p=emptyProfile();p.run=createRun(questions);captureProgress(p,p.run);p.settings={...p.settings,music,sound,skipDialogue:!dialogue};
 const store={getItem(){return this.value},setItem(k,v){this.value=v}};saveProfile(store,p);
 const loaded=loadProfile(store,questions);assert.deepEqual(loaded.settings,p.settings);assert.deepEqual(loaded.run,p.run);
 const html=settingsScreen(loaded.settings);assert.equal((html.match(/role="switch"/g)||[]).length,3);
 for(const [key,on]of [['music',music],['sound',sound],['dialogue',dialogue]])assert.match(html,new RegExp(`id="setting-${key}"[^>]+aria-checked="${on}"`));
 assert.doesNotMatch(html,/study mode|questions.only|shortJourneys|data-action="(?:start|sample)"/i);
}
const legacy=emptyProfile(),legacyStore={getItem:()=>JSON.stringify(legacy)};legacy.settings.sound=false;legacy.settings.music=false;legacy.settings.skipDialogue=true;
assert.deepEqual(loadProfile(legacyStore,questions).settings,legacy.settings,'Existing explicit OFF choices are preserved');
delete legacy.settings;assert.deepEqual(loadProfile(legacyStore,questions).settings,emptyProfile().settings,'Missing preferences use new defaults without changing save version');
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
function definition(name){const at=source.indexOf(`function ${name}(`);assert.ok(at>=0,name);return ['act','music'].includes(name)?source.slice(at).split('\n')[0]:source.slice(at,source.indexOf('\nfunction ',at+1))}
let writes=0,renders=0,focus='';const p=emptyProfile();p.run=createRun(questions);const runBefore=structuredClone(p.run),calls=[];
const c={view:'settings',paused:false,run:p.run,profile:p,combat:{active:false},document:{hidden:false},audio:{unlock(){},effect(name){calls.push(name)},configure(...args){calls.push(args)}},persist(){writes++},render(){renders++},updateAudioControls(){},$:s=>({focus(){focus=s}})};
vm.createContext(c);vm.runInContext(['music','changeAudioSetting','act'].map(definition).join('\n'),c);
for(const key of ['music','sound']){const before=p.settings[key];c.act('setting-'+key);assert.equal(p.settings[key],!before);assert.equal(focus,'#setting-'+key);assert.ok(calls.some(x=>Array.isArray(x)&&x[0]===p.settings.sound&&x[1]===p.settings.music&&x[2]===true));}
c.act('setting-dialogue');assert.equal(p.settings.skipDialogue,true);assert.equal(focus,'#setting-dialogue');assert.equal(writes,3);assert.equal(renders,3);assert.deepEqual(p.run,runBefore);
// The same handler is used by the existing in-game controls; no redraw during combat.
c.view='game';c.combat.active=true;const beforeRender=renders;c.changeAudioSetting('sound');assert.equal(renders,beforeRender);assert.deepEqual(p.run,runBefore);
assert.match(source,/\$\('#sound'\)\.onclick=\(\)=>changeAudioSetting\('sound'\)/);
assert.match(source,/\$\('#music'\)\.onclick=\(\)=>changeAudioSetting\('music'\)/);
const gameplayState=r=>JSON.stringify({...r,dialogue:undefined,battleDialogue:undefined});
for(const level of [1,10])for(const skip of [false,true]){
 const state={run:createRun(questions),profile:emptyProfile(),encounter:null,paused:false,view:'title',EncounterDialogue,pendingBattleDialogue,claimBattleDialogue,clearBattleDialogue,battleExchange,stopClock(){},persist(){},$:()=>null,views:[],setView(next){this.view=next;this.views.push(next)}};
 // A plain function avoids binding VM callbacks to the host global.
 state.setView=next=>{state.view=next;state.views.push(next)};state.profile.settings.skipDialogue=skip;state.run.level=level;state.run.completed=level-1;beginLevel(state.run,questions,()=>.42);
 vm.createContext(state);vm.runInContext(['beginEncounter','beginBattleDialogue','finishEncounter'].map(definition).join('\n'),state);
 const initial=gameplayState(state.run);state.beginEncounter();assert.equal(state.view,skip?'game':'encounter');assert.equal(gameplayState(state.run),initial);if(skip)assert.equal(state.run.dialogue.done,true);
 for(const kind of ['enemy-low','one-life','knockout']){
  state.run=createRun(questions);state.run.level=level;state.run.completed=level-1;beginLevel(state.run,questions,()=>.42);state.view='game';state.views=[];state.encounter=null;
  const n=kind==='one-life'?4:kind==='enemy-low'?9:10;
  for(let i=0;i<n;i++){const q=questions.find(q=>q.id===state.run.queue[state.run.index].id);submit(state.run,questions,kind==='one-life'?-1:q.answer);if(i<n-1||kind!=='knockout')advance(state.run,questions,()=>.42)}
  assert.ok(pendingBattleDialogue(state.run),kind+' trigger exists');const before=gameplayState(state.run);state.beginBattleDialogue();
  assert.equal(state.view,skip?'game':'encounter');assert.equal(gameplayState(state.run),before,'Dialogue preference cannot change combat or quiz state');
  if(skip){assert.equal(state.views.includes('encounter'),false);assert.equal(pendingBattleDialogue(state.run),false)}else assert.equal(state.encounter.kind,kind);
 }
}
assert.match(source,/button\('SETTINGS','settings','menu-link'\)/);assert.match(source,/view==='settings'\?settingsScreen\(profile.settings\)/);
console.log('PASS Settings: exactly three toggles; eight saved combinations; new ON defaults; legacy OFF preservation; shared header controls/focus; unchanged run; normal/Gatekeeper introductions, low-health, last-life and knockout conversations skip immediately without touching RPG state.');
