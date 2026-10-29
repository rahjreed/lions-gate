import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {MAX_LIVES,createRun,beginLevel,submit,advance,rankFor,rankLabel,rankProgress,masteryCompleted,wardrobeFor,levelConfig} from '../dist/engine.js';
import {CombatDirector,finisherVariation,combatHealth,combatHealthMarkup,combatDamageFeedback} from '../dist/combat.js';
import {pendingBattleDialogue,clearBattleDialogue} from '../dist/battle-dialogue.js';
import {GameJuice} from '../dist/juice.js';
import {patches} from '../dist/audio.js';
import {questions} from '../dist/questions.js';
import {emptyProfile,captureProgress,saveProfile,loadProfile} from '../dist/storage.js';
assert.equal(MAX_LIVES,5);
assert.deepEqual(combatDamageFeedback({enemy:100,lives:5},{enemy:90,lives:5},{}),{who:'enemy',kind:'hit',amount:10,text:'-10'});
assert.equal(combatDamageFeedback({enemy:0,lives:5},{enemy:0,lives:5},{}),null,'Never invent a hit after KO');
assert.deepEqual(combatDamageFeedback({enemy:100,lives:1},{enemy:100,lives:0},{}),{who:'judah',kind:'hurt',amount:1,text:'-1 LIFE'});
assert.deepEqual(combatDamageFeedback({enemy:100,lives:4},{enemy:100,lives:4},{shielded:true}),{who:'judah',kind:'blocked',amount:0,text:'BLOCKED'});
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),at=source.indexOf('function choose('),end=source.indexOf('\nfunction proceed(',at);
for(const outcome of ['correct','wrong','timeout','shield','boss','finisher']){
 const run=createRun(questions);if(outcome==='boss'){run.level=5;run.completed=4;beginLevel(run,questions)}if(outcome==='finisher')for(let i=0;i<9;i++){const q=questions.find(q=>q.id===run.queue[run.index].id);submit(run,questions,q.answer);advance(run,questions)}
 const q=questions.find(q=>q.id===run.queue[run.index].id),before=structuredClone(run),correct=['correct','boss','finisher'].includes(outcome);if(outcome==='shield')run.shielded=true;
 let now=0;const jobs=[],sounds=[],numbers=[];const director=new CombatDirector({now:()=>now,setTimer:(fn,delay)=>{jobs.push({fn,delay});return jobs.length},clearTimer(){}});
 const c={pendingBattleDialogue,clearBattleDialogue,finisherVariation,view:'game',run,paused:false,deadline:0,combat:director,questions,submit,combatHealth,combatDamageFeedback,rankFor,masteryCompleted,wardrobeFor,profile:{settings:{skipDialogue:true},armor:{unlocked:[]},bestCompleted:0,mastery:{legacyCompleted:0}},matchMedia:()=>({matches:false}),stopClock(){},persist(){},render(){},music(){},paintCombat(){},updateCombatHealth(){},hud:()=>'',pendingCombatHUD:null,Date:{now:()=>now},$:()=>null,document:{createElement:()=>({content:{firstElementChild:{}}})},audio:{effect:name=>sounds.push([now,name])},juice:{answer(){},burst(){},combatNumber:(scene,f)=>numbers.push([now,f])},levelConfig,answerReveal:{open(){}}};
 vm.createContext(c);vm.runInContext(source.slice(at,end),c);const choice=correct?q.answer:outcome==='timeout'?-1:(q.answer+1)%4;c.choose(choice);
 assert.equal(numbers.length,0);assert.equal(sounds.length,0);assert.equal(run.lives,5-(['wrong','timeout'].includes(outcome)?1:0));
 c.choose(choice);for(const job of jobs){now=job.delay;job.fn()}
 assert.equal(numbers.length,1);assert.equal(numbers[0][0],240);assert.equal(numbers[0][1].text,correct?'-10':outcome==='shield'?'BLOCKED':'-1 LIFE');
 assert.ok(sounds.some(([time,name])=>time===140&&name==='swordSwing'));
 assert.ok(sounds.some(([time,name])=>time===240&&name===(correct?'swordStrike':outcome==='shield'?'shield':'damage')));
 assert.equal(sounds.filter(([,name])=>name==='heavyImpact').length,outcome==='boss'?1:0);
 assert.equal(sounds.filter(([,name])=>name==='finisher').length,outcome==='finisher'?1:0);
 assert.equal(sounds.filter(([,name])=>name==='groundImpact').length,outcome==='finisher'?1:0);
 assert.equal(sounds.filter(([,name])=>name==='enemyDefeat').length,0,'No vocal defeat cue');
 assert.equal(sounds.filter(([,name])=>name==='shieldClang').length,outcome==='finisher'?1:0);
 if(outcome==='finisher')for(const [name,time]of [['finisher',240],['shieldClang',1030],['groundImpact',1210]])assert.ok(sounds.some(([at,cue])=>cue===name&&at===time),name+' stays synchronized');
 assert.equal(sounds.filter(([,name])=>name==='lifeLost').length,['wrong','timeout'].includes(outcome)?1:0);
 assert.equal(run.asked,before.asked+1);assert.equal(run.index,before.index);assert.equal(run.powers.shield,before.powers.shield);assert.equal(run.status,'feedback');
 const html=combatHealthMarkup(run);assert.ok(html.includes('aria-valuemax="5"'));assert.ok(html.includes(`${run.lives} / 5 LIVES`));
}
// Five losses end an attempt; an old saved in-progress count is never refilled.
const r=createRun(questions);for(let i=0;i<5;i++){submit(r,questions,-1);advance(r,questions);assert.equal(r.lives,4-i);assert.equal(r.status,i===4?'gameover':'playing')}
const p=emptyProfile(),saved={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};p.run=createRun(questions);p.run.level=76;p.run.completed=75;beginLevel(p.run,questions);p.run.lives=2;p.run.score=500;captureProgress(p,p.run);saveProfile(saved,p);const copy=loadProfile(saved,questions);assert.deepEqual(copy,p,'Legacy remaining lives, scores, armor, achievements and checkpoint stay intact');
copy.run.status='gameover';copy.run.lives=0;saveProfile(saved,copy);assert.equal(loadProfile(saved,questions).run.status,'gameover','An old defeat is not resurrected');
for(const name of ['swordSwing','swordStrike','damage','shield','heavyImpact'])assert.ok(Math.max(...patches[name].map(([,d,,delay])=>d+delay))<=.18,name+' stays short');
const peak=names=>names.flatMap(n=>patches[n]).reduce((s,p)=>s+p[4],0)*.7;
assert.ok(peak(['swordSwing','swordStrike','heavyImpact','correct'])<.6,'Conservative simultaneous SFX peak leaves headroom');assert.ok(peak(['swordSwing','damage','lifeLost'])<.6);
// The transient number belongs to the scene, outside replaceable sprite frames.
const originalDocument=globalThis.document,originalCancel=globalThis.cancelAnimationFrame,removed=[];let pop;
try{
 globalThis.cancelAnimationFrame=()=>{};
 globalThis.document={createElement:()=>pop={style:{},setAttribute(){},remove(){removed.push(true)}}};
 const root={querySelectorAll:()=>pop?[pop]:[],classList:{remove(){}}},scene={getBoundingClientRect:()=>({left:0,top:0,width:300,height:90}),querySelector:()=>({getBoundingClientRect:()=>({left:270,top:20,width:70,height:80})}),append(node){assert.equal(node,pop)}};
 const juice=new GameJuice(root,{reducedMotion:()=>true});juice.combatNumber(scene,{who:'enemy',kind:'hit',text:'-10'});assert.equal(pop.style.left,'252px');assert.equal(pop.textContent,'-10');assert.equal(juice.jobs.size,1);juice.clear();assert.equal(juice.jobs.size,0);assert.equal(removed.length,1);
}finally{globalThis.document=originalDocument;globalThis.cancelAnimationFrame=originalCancel}
console.log('PASS combat feedback: five lives, legacy save preservation, exact impact-only deltas/blocked hits, no duplicate indicators, short bounded audio, strike synchronization, mobile clamping, cleanup and reduced-motion visibility.');
