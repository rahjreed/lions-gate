import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {emptyProfile,loadProfile} from '../dist/storage.js';
import {createRun,rankFor,rankLabel,canRetryLevel} from '../dist/engine.js';
import {questions} from '../dist/questions.js';
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),definition=source.match(/function titleScreen\(\)[^\n]+/)[0];
for(const kind of ['new','saved','corrupt']){
 const raw=emptyProfile();raw.bestScore=9876;raw.bestCompleted=35;if(kind==='saved')raw.run=createRun(questions,'UI QA');if(kind==='corrupt')raw.run={level:5};
 const profile=loadProfile({getItem:()=>JSON.stringify(raw)},questions),ctx={profile,run:profile.run,rankFor,rankLabel,canRetryLevel,activeEnvironment:()=>0,landscape:()=>'',judah:()=>'',sword:'',environments:[{name:'Gate'}],esc:String,number:String,button:(label,action)=>`<button data-action="${action}">${label}</button>`};vm.createContext(ctx);vm.runInContext(definition,ctx);const html=ctx.titleScreen();assert.equal((html.match(/class="personal-bar"/g)||[]).length,1);assert.ok(html.indexOf('class="personal-bar"')<html.indexOf('class="title-art'));assert.match(html,/9876/);assert.match(html,kind==='saved'?/NEW GAME/:/PRESS START/);assert.equal(html.includes('CONTINUE · LEVEL'),kind==='saved');
}
const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.doesNotMatch(index,/id="(?:sound|music)"/);assert.match(index,/id="pause-control"/);assert.match(source,/const nav=\$\('header nav'\)/);assert.doesNotMatch(source,/\$\('#(?:sound|music)'\)\.onclick/);
console.log('PASS title/header: one live-data scoreboard before artwork; validated new/saved/corrupt runs select Press Start/New Game; unchanged Continue policy; header audio controls absent and Pause retained.');
