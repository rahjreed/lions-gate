import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {dialogueBank} from '../dist/dialogue-bank.js';
import {approvedDialogue,validateDialogue,dialogueFingerprint,rotatedDialogue} from '../dist/dialogue-catalog.js';
import {dialogueFor,EncounterDialogue,dialogueMarkup} from '../dist/encounter-dialogue.js';
import {battleExchange,queueBattleDialogue,pendingBattleDialogue,claimBattleDialogue,clearBattleDialogue,validBattleDialogue,knockoutDialogueLevel} from '../dist/battle-dialogue.js';
import {questions} from '../dist/questions.js';
import {createRun,beginLevel,submit,advance,levelConfig,masteryCompleted,wardrobeFor} from '../dist/engine.js';
import {CombatDirector,combatHealth,combatDamageFeedback,finisherVariation} from '../dist/combat.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
const root=new URL('../',import.meta.url),snapshot=JSON.parse(await readFile(new URL('content/dialogue/approved-55.json',root),'utf8'));
assert.deepEqual(dialogueBank,snapshot.entries,'All supplied wording/pairs remain exact, including the three originals');
assert.equal(dialogueBank.length,55);assert.equal(new Set(dialogueBank.map(e=>e.id)).size,55);
for(const [category,count] of [['pre-battle',30],['enemy-low',7],['one-life',7],['knockout',6],['gatekeeper',5]]){
 const entries=approvedDialogue(dialogueBank,category);assert.equal(entries.length,count);
 const selected=Array.from({length:count*4},(_,i)=>rotatedDialogue(dialogueBank,category,i).id);
 assert.equal(new Set(selected.slice(0,count)).size,count);for(let i=1;i<selected.length;i++)assert.notEqual(selected[i],selected[i-1]);
}
for(const level of [1,2,5,10,700,Number.MAX_SAFE_INTEGER]){
 const original=dialogueFor(level),session=new EncounterDialogue(level);session.next();
 const restored=new EncounterDialogue(level,session.checkpoint());assert.equal(restored.exchange.id,original.id);assert.equal(restored.step,1);
 assert.equal(dialogueFor(level,original.id).id,original.id);
}
assert.ok((await readFile(new URL('.gitignore',root),'utf8')).includes('content/dialogue/private/'),'Contributor files are excluded from ordinary commits');
const proposal=JSON.parse(await readFile(new URL('content/dialogue/submissions.example.json',root),'utf8')).entries[0];
validateDialogue(proposal);assert.deepEqual(approvedDialogue([proposal]),[]);assert.deepEqual(approvedDialogue([{...proposal,reviewStatus:'rejected'}]),[]);
const projected=approvedDialogue([{...proposal,reviewStatus:'approved'}])[0];assert.ok(!Object.hasOwn(projected,'contributor'));assert.ok(!JSON.stringify(projected).includes(proposal.contributor));
const quoted={...proposal,reviewStatus:'approved',containsScriptureQuotation:true};assert.throws(()=>validateDialogue(quoted),/cited/);
const referenced={...proposal,reviewStatus:'approved',scripture:{book:'Psalms',chapter:119,verse:105}};assert.throws(()=>validateDialogue(referenced),/evidence/);
const reviewed={...referenced,scriptureReview:{contentFingerprint:dialogueFingerprint(referenced),accuracyChecked:true,contextChecked:true,excerpt:'TEST FIXTURE ONLY',sourceUrl:'https://example.test/fixture',reviewedBy:'FIXTURE — not a real approval'}};
validateDialogue(reviewed);assert.throws(()=>validateDialogue({...reviewed,judah:'Edited after review'}),/evidence/);
for(const book of ['Enoch','Jubilees','Jasher'])assert.throws(()=>validateDialogue({...reviewed,scripture:{book,chapter:1,verse:1}}),/80-book/);
assert.equal(new EncounterDialogue(1,{level:1,step:1}).step,1,'Old checkpoints without IDs still restore');
const fresh=level=>{const r=createRun(questions,'DIALOGUE QA',()=>.42);r.level=level;r.completed=level-1;beginLevel(r,questions,()=>.42);return r};
const answer=(r,right=true)=>{const q=questions.find(q=>q.id===r.queue[r.index].id);submit(r,questions,right?q.answer:-1);advance(r,questions,()=>.42)};
const finalQuestion=level=>{const r=fresh(level);for(let i=0;i<9;i++)answer(r);clearBattleDialogue(r);return r};
for(const startingLives of [2,3,4,5]){
 const r=fresh(2);r.lives=startingLives;for(let i=1;i<startingLives;i++)answer(r,false);
 assert.equal(r.lives,1);assert.deepEqual(r.battleDialogue.queue,['one-life']);claimBattleDialogue(r);
 const exchange=battleExchange(r.level,'one-life',r.battleDialogue.active.exchangeId,r);
 assert.equal(exchange.id==='L02',startingLives===5,'Four-blow taunt excludes carry-over lives');
}
const crossing=fresh(1);answer(crossing,false);for(let i=0;i<9;i++)answer(crossing);
assert.equal(crossing.index,10);assert.deepEqual(crossing.battleDialogue.queue,['enemy-low']);queueBattleDialogue(crossing,4);assert.equal(crossing.battleDialogue.queue.length,1);
const source=await readFile(new URL('dist/app.js',root),'utf8');
function definition(name){const at=source.indexOf(`function ${name}(`);assert.ok(at>=0,name);if(['proceed','setView'].includes(name))return source.slice(at).split('\n')[0];return source.slice(at,source.indexOf('\nfunction ',at+1)).replace(/\n\/\/[^\n]*/g,'')}
function harness(run,{skip=false,reduced=false}={}){
 let now=0,id=0;const jobs=new Map(),profile=emptyProfile(),saved={data:null,getItem(){return this.data},setItem(k,v){this.data=v}},events={frames:[],reveals:0,impacts:0,questionClocks:0,html:'',preview:null};profile.settings.skipDialogue=skip;
 const director=new CombatDirector({now:()=>now,setTimer:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id},clearTimer:id=>jobs.delete(id)});
 const control={focus(){}};
 const c={run,profile,questions,view:'game',paused:false,deadline:0,timer:null,pendingCombatHUD:null,encounter:null,pauseFocus:null,
  EncounterDialogue,pendingBattleDialogue,claimBattleDialogue,clearBattleDialogue,battleExchange,submit,advance,levelConfig,combatHealth,combatDamageFeedback,masteryCompleted,wardrobeFor,finisherVariation,
  combat:director,director:{cancel(){},pause(){},resume(){}},Date:{now:()=>now},window:{scrollTo(){}},document:{hidden:false,createElement:()=>({content:{firstElementChild:{}}})},matchMedia:()=>({matches:reduced}),
  $:s=>s==='#answer-reveal'?c.view==='game'&&c.run.status==='feedback'?control:null:['#screen-title','#dialogue-next'].includes(s)?control:null,
  persist(){captureProgress(profile,c.run);saveProfile(saved,profile)},startClock(){if(c.view==='game'&&c.run.status==='playing')events.questionClocks++},stopClock(){},music(){},mountPause(){},releasePause(){},
  render(defer=false){if(c.view==='encounter'){events.html=c.encounterScreen();events.preview=combatHealth(c.run,c.pendingCombatHUD)}else if(!defer)c.restoreCombatPresentation()},
  battleScene:()=>'',dialogueMarkup,opponentFor:()=>({name:'Roman QA'}),hud:()=>'',paintCombat:(_,frame)=>events.frames.push(frame),updateCombatHealth(){events.impacts++},
  audio:{effect(){}},juice:{answer(){},burst(){},combatNumber(){},enter(){},pause(){},resume(){}},answerReveal:{open(){events.reveals++},close(){}},armorReveal:{open(){}},
 };
 vm.createContext(c);vm.runInContext(['setView','choose','playCombat','proceed','beginBattleDialogue','finishEncounter','advanceDialogue','encounterScreen','previousCombatHUD','restoreCombatPresentation','pause','resume'].map(definition).join('\n'),c);
 return {c,events,saved,tick(ms){const end=now+ms;while(true){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;jobs.delete(due[0]);now=due[1].at;due[1].fn()}now=end}};
}
for(const level of [1,4,10])for(const reduced of [false,true]){
 const h=harness(finalQuestion(level),{reduced}),{c,events}=h;
 const q=questions.find(q=>q.id===c.run.queue[c.run.index].id);c.choose(q.answer);
 assert.equal(c.view,'encounter');assert.equal(c.encounter.kind,'knockout');assert.equal(events.frames.length,0);assert.equal(events.impacts,0);assert.equal(events.questionClocks,0);assert.equal(events.preview.enemy,10);
 const accepted=structuredClone(c.run);c.proceed();c.choose(q.answer);assert.equal(c.run.status,'feedback');assert.equal(c.run.asked,accepted.asked);
 c.advanceDialogue();assert.ok(events.html.includes('FINISH THE BATTLE'));const id=c.encounter.exchange.id;
 c.pause();c.document.hidden=true;c.resume();assert.equal(c.paused,true);c.document.hidden=false;c.resume();assert.equal(events.frames.length,0);
 const loaded=loadProfile(h.saved,questions).run;assert.ok(loaded);const reopened=harness(loaded,{reduced});reopened.c.beginBattleDialogue();assert.equal(reopened.c.encounter.step,1);assert.equal(reopened.c.encounter.exchange.id,id);
 const score=reopened.c.run.score,answers=structuredClone(reopened.c.run.answers);reopened.c.finishEncounter();reopened.c.finishEncounter();
 assert.equal(reopened.c.view,'game');assert.equal(reopened.events.questionClocks,0);reopened.c.proceed();if(!reduced)assert.equal(reopened.c.run.status,'feedback');
 reopened.tick(1600);assert.equal(reopened.events.impacts,1);assert.equal(reopened.events.frames.at(-1).phase,'defeated');assert.equal(reopened.events.reveals,1);
 assert.equal(reopened.c.run.score,reduced?score+levelConfig(level).bonus:score); // reduced proceed above may already clear
 assert.deepEqual(reopened.c.run.answers,answers);reopened.c.proceed();reopened.c.proceed();assert.equal(reopened.c.run.status,'levelup');assert.equal(reopened.c.run.completed,level);assert.equal(reopened.c.run.score,score+levelConfig(level).bonus);
 assert.equal(reopened.c.run.battleDialogue.queue.length,0);assert.ok(validBattleDialogue(reopened.c.run.battleDialogue));
}
for(const [level,skip] of [[1,true],[2,false],[5,false]]){
 const h=harness(finalQuestion(level),{skip}),q=questions.find(q=>q.id===h.c.run.queue[h.c.run.index].id);h.c.choose(q.answer);
 assert.equal(h.c.view,'game');assert.equal(h.events.frames[0].phase,'windup');h.tick(1600);assert.equal(h.events.impacts,1);assert.equal(h.events.reveals,1);
 assert.equal(pendingBattleDialogue(h.c.run),false);assert.equal(knockoutDialogueLevel(level)&&!skip,false);
}
const css=await readFile(new URL('dist/encounter-dialogue.css',root),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/orientation:portrait/);
console.log('PASS dialogue expansion: exact 55 approved pairs, all five categories, full-cycle no-adjacent-repeat selection, stable IDs/legacy checkpoints, private pending proposals, rejected/stale/unverified Scripture exclusion, carry-over-aware taunts, extended-battle triggers, actual choose/dialogue/finisher flow, save/reply/pause/skip/mute-preference flow, reduced motion, no double damage/score and regular/Gatekeeper timing.');
