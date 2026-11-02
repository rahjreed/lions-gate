import {validCollection} from '../dist/scripture-collections.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {playerNameScreen} from '../dist/player-name.js';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel} from '../dist/engine.js';
import {emptyProfile,cleanNickname,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),fixture=JSON.parse(await readFile(new URL('fixtures/start-flow-revision.json',import.meta.url),'utf8')),sha=s=>createHash('sha256').update(s).digest('hex');
const title=source.match(/function titleScreen\(\)[^\n]*/)[0];assert.equal(sha(title.replace('Help Akobi take the Kingdom.','Help Judah take the Kingdom')),fixture.titleFunctionWithoutInputSha256,'Only remove input from the approved title; all artwork, menu buttons and composition code unchanged');assert.doesNotMatch(title,/<input|nickname-label/);
assert.equal(source.match(/if\(action==='continue'\)\{[\s\S]*?return\}if\(action==='next'\)/)[0],fixture.continueRoute,'Continue stays independent of name entry');
const html=playerNameScreen('A"<script>');assert.match(html,/ENTER PLAYER NAME/);assert.match(html,/maxlength="16"/);assert.match(html,/autocomplete="nickname"/);assert.match(html,/enterkeyhint="go"/);assert.match(html,/type="submit"/);assert.match(html,/data-action="cancel-start"/);assert.ok(html.includes('A&quot;&lt;script&gt;'));assert.doesNotMatch(html,/Judith|CHARACTER SELECT|<script>/i);
function definition(name){const at=source.indexOf(`function ${name}(`);assert.ok(at>=0);return source.slice(at).split('\n')[0];}
function setup(existing=false){
 const profile=emptyProfile();profile.nickname='Existing Hero';profile.bestCompleted=699;profile.bestScore=12345;profile.badges=['first-perfect'];profile.armor.unlocked=['belt'];profile.settings.skipDialogue=true;
 const old=existing?createRun(questions,profile.nickname,()=>.42):null;if(old){old.level=700;old.completed=699;beginLevel(old,questions,()=>.42);old.score=4321;old.lives=2;captureProgress(profile,old);}
 const storage={value:null,getItem(){return this.value},setItem(_,value){this.value=value}};saveProfile(storage,profile);
 const calls={newRuns:0,writes:0,encounters:0,confirmations:0,focus:[]},input={value:'',focus(){calls.focus.push('input')},select(){}};
 const c={profile,run:old,view:'title',paused:false,nameDraft:profile.nickname,collectionDraft:null,validCollection,questions,cleanNickname,audio:{unlock(){},effect(){}},allowOverwrite:false,
  $:selector=>selector==='#nickname'?input:selector==='[data-action="start"]'?{focus(){calls.focus.push('start')}}:null,
  confirm(){calls.confirmations++;return c.allowOverwrite},createRun(...args){calls.newRuns++;return createRun(...args)},persist(){calls.writes++;if(c.run)captureProgress(c.profile,c.run);saveProfile(storage,c.profile)},
  setView(view){c.view=view;if(view==='name-entry')input.value=c.nameDraft},beginEncounter(){calls.encounters++;c.view=c.profile.settings.skipDialogue?'game':'encounter'},pendingDialogue:()=>false,pendingBattleDialogue:()=>false,render(){},music(){}
 };vm.createContext(c);vm.runInContext(['start','chooseCollection','cancelStart','confirmPlayerName','beginNewGame','act'].map(definition).join('\n'),c);return{c,calls,input,storage};
}
for(const existing of [false,true])for(const mode of ['kjv80','kjv66']){
 const {c,calls,input,storage}=setup(existing),before=JSON.stringify(c.profile),saved=storage.value,oldRun=JSON.stringify(c.run);
 c.act('start');assert.equal(c.view,'collection');assert.equal(c.collectionDraft,null);c.act('confirm-name');assert.equal(calls.newRuns,0);c.act('choose-'+mode);assert.equal(c.view,'name-entry');assert.equal(input.value,'Existing Hero');assert.equal(calls.newRuns,0);assert.equal(calls.confirmations,0);assert.equal(storage.value,saved);assert.equal(JSON.stringify(c.run),oldRun);
 input.value='Discarded';c.nameDraft=input.value;c.act('cancel-start');assert.equal(c.view,'collection');c.act('cancel-start');assert.equal(c.view,'title');assert.equal(JSON.stringify(c.profile),before);assert.equal(storage.value,saved);assert.equal(calls.focus.at(-1),'start');
 c.act('start');c.act('choose-'+mode);assert.equal(input.value,'Existing Hero');input.value='New <Hero>!';c.nameDraft=input.value;
 if(existing){c.act('confirm-name');assert.equal(c.view,'name-entry');assert.equal(calls.confirmations,1);assert.equal(calls.newRuns,0);assert.equal(JSON.stringify(c.profile),before);assert.equal(storage.value,saved);c.allowOverwrite=true;}
 c.act('confirm-name');assert.equal(c.view,'game');assert.equal(c.profile.nickname,'New Hero');assert.equal(c.run.nickname,'New Hero');assert.equal(c.run.level,1);assert.equal(c.run.lives,5);assert.equal(c.run.scriptureCollection,mode);assert.equal(calls.newRuns,1);assert.equal(calls.encounters,1);assert.equal(c.profile.bestCompleted,699);assert.equal(c.profile.bestScore,12345);assert.deepEqual(c.profile.armor.unlocked,['belt']);assert.ok(c.profile.badges.includes('first-perfect'));
 const loaded=loadProfile(storage,questions);assert.equal(loaded.nickname,'New Hero');assert.equal(loaded.run.nickname,'New Hero');assert.equal(loaded.run.id,c.run.id);
 c.act('confirm-name');assert.equal(calls.newRuns,1,'Detached/repeated submissions cannot create a second run');
}
const {c,calls}=setup(true),prior=JSON.stringify(c.run),profileBefore=JSON.stringify(c.profile);c.act('continue');assert.equal(c.view,'game');assert.equal(c.paused,true);assert.equal(JSON.stringify(c.run),prior);assert.equal(JSON.stringify(c.profile),profileBefore);assert.equal(calls.newRuns,0);assert.equal(calls.confirmations,0);
// Draft input survives the existing audio-control redraw without becoming a save edit.
const draft=setup();draft.c.act('start');draft.c.act('choose-kjv80');draft.c.nameDraft='Draft name';assert.ok(playerNameScreen(draft.c.nameDraft).includes('value="Draft name"'));assert.equal(draft.c.profile.nickname,'Existing Hero');
assert.match(source,/addEventListener\('input',e=>\{nameDraft=e.target.value\}\)/);assert.match(source,/onsubmit=e=>\{e.preventDefault\(\);act\('confirm-name'\)\}/);assert.ok(source.includes("['collection','name-entry'].includes(view)&&e.key==='Escape'"));
assert.match(source,/view==='name-entry'\?playerNameScreen\(nameDraft\)/);assert.equal(cleanNickname('   '),'PLAYER 1');
console.log('PASS start flow: approved title unchanged except removed input; dedicated escaped native name form; Back/cancel and rejected overwrite preserve old save; one confirmed Judah initialization; existing sanitization/name persistence; unchanged Continue, achievements/armor and five-life start; repeat-submit guard and draft redraw retention.');
