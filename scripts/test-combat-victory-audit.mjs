// Regression tests for the owner-authorized true-defeat rule, superseding the audit characterization.
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
import {questions} from '../dist/questions.js';import {createRun,beginLevel,submit,advance,nextLevel,retryLevel,usePower,levelConfig,masteryCompleted,wardrobeFor} from '../dist/engine.js';
import {CombatDirector,combatHealth,combatHealthMarkup,combatDamageFeedback,romanSoldier,finisherVariation} from '../dist/combat.js';
import {clearBattleDialogue,pendingBattleDialogue} from '../dist/battle-dialogue.js';import {pendingDialogue} from '../dist/encounter-dialogue.js';import {gateProgress} from '../dist/adventure.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
const bank=questions,correctChoice=r=>bank.find(q=>q.id===r.queue[r.index].id).answer;
function fresh(level=1,lives=5){const r=createRun(bank,'AUDIT',()=>.42);r.level=level;r.completed=level-1;beginLevel(r,bank,()=>.42);r.lives=lives;return r}
function runPattern(pattern,{level=1,lives=5,shield=false}={}){const r=fresh(level,lives);let protectedOnce=false;for(const correct of pattern){if(r.status!=='playing')break;if(!correct&&shield&&!protectedOnce){usePower(r,bank,'shield');protectedOnce=true}submit(r,bank,correct?correctChoice(r):-1);advance(r,bank)}return r}
const patterns={perfect:Array(10).fill(true),eight:[false,false,...Array(8).fill(true)],five:[...Array(5).fill(true),...Array(5).fill(false)]};
for(const level of [1,5])for(const [name,pattern] of Object.entries(patterns))for(const shield of [false,true]){
 const r=runPattern(pattern,{level,shield}),expectedHP={perfect:0,eight:20,five:50}[name],expectedLives=name==='perfect'?5:name==='eight'?(shield?4:3):(shield?1:0);
 assert.equal(combatHealth(r).enemy,expectedHP);assert.equal(r.lives,expectedLives);assert.equal(r.status,!expectedLives?'gameover':expectedHP?'playing':'levelup');
 if(level===5)assert.equal(gateProgress(r).open,expectedHP===0&&expectedLives>0,'Gatekeepers require actual defeat');
 console.log(`${level===5?'Gatekeeper':'Regular'} ${name}${shield?' + Shield':''}: HP ${expectedHP}, lives ${expectedLives}, ${r.status}`);
}
// Exhaust all answer orderings, starting lives, Shield usage, and regular/boss rules.
// Clone two prepared queues rather than generating 12,288 different question sets.
let combinations=0;
// Pre-provision later slots for the combinatorial health/rule matrix. Full encounter
// tests below separately exercise actual fresh selection and persisted extensions.
for(const level of [1,5]){const template=fresh(level);template.queue.push(...structuredClone(template.queue));for(const startingLives of [1,3,5])for(const protect of [false,true])for(let mask=0;mask<1024;mask++){
 const r=structuredClone(template);r.lives=startingLives;let hits=0,misses=0,blocked=0,points=0,streak=0;
 for(let i=0;i<10&&r.status==='playing';i++){
  const right=!!(mask&(1<<i)),before=combatHealth(r);if(!right&&protect&&!blocked){assert.equal(usePower(r,bank,'shield'),true);blocked=1}
  assert.equal(submit(r,bank,right?correctChoice(r):-1),true);if(right){hits++;streak++;points+=100*Math.min(5,1+Math.floor(streak/3))*(level===5?2:1)}else{misses++;streak=0}
  assert.equal(submit(r,bank,-1),false);const after=combatHealth(r),delta=combatDamageFeedback(before,after,r.answers.at(-1));
  assert.equal(after.enemy,100-10*hits);assert.equal(after.lives,startingLives-misses+blocked);assert.equal(delta.text,right?'-10':r.answers.at(-1).shielded?'BLOCKED':'-1 LIFE');
  assert.deepEqual(combatHealth(r,before),before);assert.ok(combatHealthMarkup(r).includes(`aria-valuenow="${after.enemy}"`));advance(r,bank);
 }
 const survival=startingLives-misses+blocked>0,won=survival&&hits===10;assert.equal(r.status,!survival?'gameover':won?'levelup':'playing');assert.equal(r.completed,won?level:level-1);assert.equal(r.score,points+(won?levelConfig(level).bonus:0));
 if(survival&&hits<10)assert.ok(combatHealth(r).enemy>0);combinations++;
}}
console.log(`PASS ${combinations} exhaustive combinations: zero HP required, surviving Q10 continues, exact points/HP/lives/blocked deltas.`);
for(const power of ['fifty','time','shield']){const r=fresh();usePower(r,bank,power);submit(r,bank,correctChoice(r));assert.equal(combatHealth(r).enemy,90,'Support powers never multiply damage');advance(r,bank);for(let i=1;i<10;i++){submit(r,bank,correctChoice(r));advance(r,bank)}assert.equal(combatHealth(r).enemy,0)}
// Full-length encounters, round-trip saves after every answer and retry high-water rewards.
for(const level of [1,5,335,700])for(const misses of [0,1,2,4,5]){
 const r=fresh(level),saved={data:null,getItem(){return this.data},setItem(k,v){this.data=v}},profile=emptyProfile();
 const pattern=misses===5?[...Array(9).fill(true),...Array(5).fill(false)]:[...Array(misses).fill(false),...Array(10).fill(true)];
 for(const right of pattern){
  const before=combatHealth(r);assert.equal(submit(r,bank,right?correctChoice(r):-1),true);assert.equal(submit(r,bank,-1),false);
  const after=combatHealth(r);assert.equal(after.enemy,before.enemy-(right?10:0));advance(r,bank,()=>.42);
  captureProgress(profile,r);saveProfile(saved,profile);assert.deepEqual(loadProfile(saved,bank).run,r,'Extended queues survive refresh at every answer');
 }
 assert.equal(r.status,misses===5?'gameover':'levelup');assert.equal(r.answers.length,misses===5?14:10+misses);
 assert.equal(combatHealth(r).enemy,misses===5?10:0);assert.equal(r.lives,5-misses);
 if(misses){assert.equal(r.perfects,0);assert.equal(r.flawless.count,0)}
 if(misses===5){const score=r.score;retryLevel(r,bank,()=>.42);assert.equal(r.index,0);assert.equal(r.queue.length,10);assert.equal(r.lives,5);assert.equal(combatHealth(r).enemy,100);for(let i=0;i<9;i++){submit(r,bank,correctChoice(r));advance(r,bank)}assert.equal(r.score,score,'Retry cannot repay already earned points for the same nine-hit path')}
}
for(const level of [1,5]){
 const r=fresh(level);usePower(r,bank,'shield');submit(r,bank,-1);advance(r,bank);assert.equal(r.lives,5);
 for(let i=0;i<4;i++){submit(r,bank,-1);advance(r,bank)}
 for(let i=0;i<10;i++){submit(r,bank,correctChoice(r));advance(r,bank)}
 assert.equal(r.status,'levelup');assert.equal(r.answers.length,15);assert.equal(r.lives,1);assert.equal(combatHealth(r).enemy,0);assert.equal(r.flawless.count,0);
 assert.equal(new Set(r.queue.map(q=>q.id)).size,r.queue.length,'Current published pool supports fresh extended questions');
}
console.log('PASS full battles: 10/0, 10/1, 10/2, 10/4, 9/5, shielded 15-question wins, four progression levels, per-answer save round trips, fresh extensions and retry score protection.');
function clock(){let now=0,id=0;const jobs=new Map();return {get now(){return now},options:{now:()=>now,setTimer:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id},clearTimer:id=>jobs.delete(id)},tick(ms){const end=now+ms;while(true){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;jobs.delete(due[0]);now=due[1].at;due[1].fn()}now=end},jobs}}
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
function definition(name){const at=source.indexOf(`function ${name}(`);assert.ok(at>=0);if(['act','proceed','setView'].includes(name))return source.slice(at).split('\n')[0];const end=source.indexOf('\nfunction ',at+1);return source.slice(at,end).replace(/\n\/\/[^\n]*/g,'')}
function lastQuestion(kind,level=1){const pattern=kind==='survivor'?patterns.eight.slice(0,9):kind==='judah'?patterns.five.slice(0,9):patterns.perfect.slice(0,9),r=fresh(level);for(const right of pattern){submit(r,bank,right?correctChoice(r):-1);advance(r,bank)}clearBattleDialogue(r);return r}
function appHarness(run,reduced=false){
 const cclock=clock(),d=new CombatDirector(cclock.options),profile=emptyProfile(),saved={data:null,getItem(){return this.data},setItem(k,v){this.data=v}},log={frames:[],reveals:[],health:[],numbers:[],advances:0};profile.settings.skipDialogue=true;
 const control={setAttribute(){},focus(){}},app={innerHTML:'',querySelectorAll:()=>[],insertAdjacentHTML(){}};
 const c={run,profile,questions:bank,view:'game',paused:false,deadline:0,combat:d,pendingCombatHUD:null,storageOK:true,armorItems:[],armorReveal:{close(){}},app,
  submit,advance:(...args)=>{const ok=advance(...args);if(ok)log.advances++;return ok},combatHealth,combatDamageFeedback,combatHealthMarkup,romanSoldier,finisherVariation,masteryCompleted,wardrobeFor,levelConfig,gateProgress,pendingBattleDialogue,pendingDialogue,
  director:{cancel(){}},releasePause(){},updateAudioControls(){},setGameLayout(){},stopClock(){},startClock(){},music(){},persist(){captureProgress(profile,c.run);saveProfile(saved,profile)},
  environments:[{unlock:0}],landscape:()=>'',symbolicGate:()=>'',sword:'',judah:(_,pose)=>`<figure class="judah" data-pose="${pose}"></figure>`,hud:()=>'',esc:String,
  questionScreen:()=>c.battleScene()+'<dialog id="answer-reveal"></dialog>',resultScreen:()=>`RESULT ${c.run.status}`,titleScreen:()=> 'TITLE',mountPause(){},
  $:selector=>selector==='#answer-reveal'?(app.innerHTML.includes('id="answer-reveal"')?control:null):['#storage-warning','#screen-title'].includes(selector)?control:null,
  document:{createElement:()=>({content:{firstElementChild:{}}})},window:{scrollTo(){}},Date:{now:()=>cclock.now},matchMedia:()=>({matches:reduced}),
  audio:{effect(){},unlock(){}},juice:{clear(){},enter(){},answer(){},burst(){},combatNumber:(_,delta)=>log.numbers.push({at:cclock.now,delta})},
  paintCombat:(_,frame)=>log.frames.push(frame),updateCombatHealth:()=>log.health.push({at:cclock.now,...combatHealth(c.run)}),
  answerReveal:{close(){},open(){log.reveals.push(cclock.now)}},beginBattleDialogue(){throw Error('Unexpected dialogue at encounter end')},beginEncounter(){},beginJourney(){}}
 vm.createContext(c);vm.runInContext(['battleScene','restoreCombatPresentation','render','choose','playCombat','proceed','setView','act'].map(definition).join('\n'),c);return {c,clock:cclock,log,saved,d,app};
}
for(const level of [1,5])for(const kind of ['ko','survivor','judah'])for(const reduced of [false,true]){
 const h=appHarness(lastQuestion(kind,level),reduced),{c,clock,log,d}=h,before=combatHealth(c.run),choice=kind==='judah'?-1:correctChoice(c.run),duration=kind==='survivor'?920:1600;
 c.choose(choice);const accepted=c.run.asked;for(let i=0;i<20;i++)c.choose(choice);assert.equal(c.run.asked,accepted);
 if(!reduced){for(let time=0;time<duration;time+=40){c.proceed();assert.equal(log.advances,0);clock.tick(Math.min(40,duration-time))}assert.equal(log.reveals.length,1);assert.equal(log.reveals[0],duration)}else assert.equal(log.reveals.length,1);
 assert.equal(log.health.length,1);assert.equal(log.numbers.length,1);assert.equal(log.numbers[0].at,reduced?0:240);assert.equal(log.numbers[0].delta.text,kind==='judah'?'-1 LIFE':'-10');assert.equal(log.advances,0);assert.equal(c.run.status,'feedback');assert.equal(d.active,false);
 if(kind==='survivor')assert.equal(log.frames.some(f=>f.phase==='defeated'),false);else assert.equal(log.frames.at(-1).phase,kind==='ko'?'defeated':'hero-defeated');
 c.proceed();for(let i=0;i<30;i++)c.proceed();assert.equal(log.advances,1);assert.equal(c.run.status,kind==='judah'?'gameover':kind==='survivor'?'playing':'levelup');
 if(kind==='judah'){const banked=c.run.score;assert.equal(retryLevel(c.run,bank),true);assert.deepEqual(combatHealth(c.run),{hits:0,enemy:100,lives:5});assert.equal(c.run.score,banked);assert.deepEqual(c.run.battleDialogue.seen,[]);assert.deepEqual(c.run.powers,c.run.levelRewards.startPowers)}
}
console.log('PASS actual choose/proceed/render integration: normal/KO/Judah loss, regular/Gatekeeper, 240ms impact, 920/1600ms gating, rapid taps, reduced motion, single advancement and clean retry.');
// An interrupted saved answer replays presentation only; no resubmission/double damage.
for(const kind of ['ko','judah']){
 const h=appHarness(lastQuestion(kind));h.c.choose(kind==='judah'?-1:correctChoice(h.c.run));h.clock.tick(200);assert.equal(h.log.reveals.length,0);
 h.d.pause();h.c.paused=true;h.c.act('save-title');assert.equal(h.d.active,false);
 const restored=loadProfile(h.saved,bank).run,snapshot=structuredClone(restored);assert.ok(restored);
 const reopened=appHarness(restored);reopened.c.view='title';reopened.c.act('continue');assert.equal(reopened.log.reveals.length,0);assert.equal(reopened.d.active,true);
 reopened.c.proceed();assert.equal(reopened.log.advances,0);reopened.clock.tick(1600);
 assert.equal(reopened.log.frames.at(-1).phase,kind==='ko'?'defeated':'hero-defeated');assert.equal(reopened.log.reveals.length,1);
 assert.equal(reopened.c.run.score,snapshot.score);assert.deepEqual(reopened.c.run.answers,snapshot.answers);assert.equal(reopened.c.run.lives,snapshot.lives);
 const asked=reopened.c.run.asked;reopened.c.render();assert.equal(reopened.log.frames.at(-1).phase,kind==='ko'?'defeated':'hero-defeated');assert.equal(reopened.d.active,false);assert.equal(reopened.c.run.asked,asked);
 // Older saves lack the additive presentation checkpoint: show the stable down pose.
 delete restored.combatPresentation;const legacy=appHarness(restored);legacy.c.render();assert.equal(legacy.log.frames.at(-1).phase,kind==='ko'?'defeated':'hero-defeated');assert.equal(legacy.d.active,false);
}
// Optional presentation corruption cannot discard authoritative progress.
const salvage=fresh(),salvageProfile=emptyProfile(),salvageStore={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};
salvage.score=1234;salvage.combatPresentation={answer:99,complete:'bad'};captureProgress(salvageProfile,salvage);saveProfile(salvageStore,salvageProfile);
const salvaged=loadProfile(salvageStore,bank).run;assert.ok(salvaged);assert.equal(salvaged.score,1234);assert.equal(salvaged.combatPresentation,undefined);
console.log('PASS restored finishes: pending presentation replays without damage/rewards, completed and legacy saves hold terminal poses, redraw cannot resurrect either fighter.');
